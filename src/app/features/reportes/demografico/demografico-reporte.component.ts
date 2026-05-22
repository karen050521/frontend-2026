import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, Chart, ChartEvent, ActiveElement } from 'chart.js';
import { registerables } from 'chart.js';
import { ReportesApiService } from '../shared/services/reportes-api.service';
import { MetricCardComponent } from '../shared/components/metric-card/metric-card.component';
import { ExportButtonsComponent } from '../shared/components/export-buttons/export-buttons.component';
import { DemograficoResponse, FiltrosDemografico, RangoEtarioItem } from '../shared/models/reportes.models';
import { RutaService } from '../../../core/services/ruta.service';

Chart.register(...registerables);

const PALETA = ['#8b5cf6','#ec4899','#06b6d4','#f59e0b','#10b981','#6b7280'];
const PALETA_ALPHA = ['rgba(139,92,246,0.8)','rgba(236,72,153,0.8)','rgba(6,182,212,0.8)','rgba(245,158,11,0.8)','rgba(16,185,129,0.8)','rgba(107,114,128,0.8)'];

@Component({
  selector: 'app-demografico-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, MetricCardComponent, ExportButtonsComponent],
  templateUrl: './demografico-reporte.component.html',
})
export class DemograficoReporteComponent implements OnInit {
  private readonly api = inject(ReportesApiService);
  private readonly rutaService = inject(RutaService);

  // ─── Estado ───────────────────────────────────────────────────────────────
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly datos = signal<DemograficoResponse | null>(null);
  protected readonly segmentoActivo = signal<RangoEtarioItem | null>(null);
  protected readonly toastMsg = signal<string | null>(null);

  // Filtros
  protected readonly filtroFechaInicio = signal<string>('');
  protected readonly filtroFechaFin = signal<string>('');
  protected readonly filtroRutaId = signal<number | null>(null);
  protected readonly rutas = signal<any[]>([]);

  protected readonly filtrosActivos = computed<FiltrosDemografico>(() => {
    const f: FiltrosDemografico = {};
    if (this.filtroRutaId()) f.rutaId = this.filtroRutaId()!;
    if (this.filtroFechaInicio()) f.fechaInicio = this.filtroFechaInicio();
    if (this.filtroFechaFin()) f.fechaFin = this.filtroFechaFin();
    return f;
  });

  // ─── Chart.js ─────────────────────────────────────────────────────────────
  public readonly doughnutType = 'doughnut' as const;
  public doughnutData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

  public readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    animation: { duration: 700, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#e4e4e7',
          font: { family: 'Inter, sans-serif', size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#3f3f46',
        borderWidth: 1,
        padding: 14,
        callbacks: {
          label: (ctx) => {
            const d = this.datos();
            const rango = d?.rangos[ctx.dataIndex];
            return rango
              ? ` ${rango.cantidad.toLocaleString('es-CO')} pasajeros (${rango.porcentaje}%)`
              : ` ${ctx.formattedValue}`;
          },
        },
      },
    },
    onClick: (event: ChartEvent, elements: ActiveElement[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const rangos = this.datos()?.rangos ?? [];
        this.segmentoActivo.set(rangos[idx] ?? null);
      }
    },
  };

  ngOnInit(): void {
    this.cargarRutas();
    this.cargarDatos();
  }

  protected cargarRutas(): void {
    this.rutaService.obtenerRutas().subscribe({
      next: (r) => this.rutas.set(r || []),
      error: () => {},
    });
  }

  protected cargarDatos(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.segmentoActivo.set(null);

    this.api.getDemografico(this.filtrosActivos()).subscribe({
      next: (res) => {
        this.datos.set(res);
        this.actualizarGrafico(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected aplicarFiltros(): void {
    this.cargarDatos();
  }

  protected limpiarFiltros(): void {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.filtroRutaId.set(null);
    this.cargarDatos();
  }

  protected cerrarDetalle(): void {
    this.segmentoActivo.set(null);
  }

  private actualizarGrafico(res: DemograficoResponse): void {
    const labels = res.rangos.map((r) => r.rango);
    const values = res.rangos.map((r) => r.cantidad);
    const bg = res.rangos.map((_, i) => PALETA_ALPHA[i % PALETA_ALPHA.length]);
    const border = res.rangos.map((_, i) => PALETA[i % PALETA.length]);

    this.doughnutData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      }],
    };
  }

  protected onExportError(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3500);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  protected toNumber(v: any): number | null {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  protected getMayorCrecimiento(): string {
    const rangos = this.datos()?.rangos ?? [];
    if (!rangos.length) return '—';
    const max = rangos.reduce((a, b) =>
      b.variacionVsMesAnterior > a.variacionVsMesAnterior ? b : a
    );
    return max.variacionVsMesAnterior > 0
      ? `${max.rango.split('(')[0].trim()} +${max.variacionVsMesAnterior.toFixed(1)}%`
      : '—';
  }

  protected getColor(i: number): string {
    return PALETA[i % PALETA.length];
  }

  protected esPredominante(rango: RangoEtarioItem): boolean {
    return rango.rango === this.datos()?.segmentoPredominante;
  }

  protected variacionClass(v: number): string {
    if (v > 0) return 'text-emerald-400';
    if (v < 0) return 'text-rose-400';
    return 'text-white/30';
  }

  protected variacionLabel(v: number): string {
    const s = v >= 0 ? '+' : '';
    return `${s}${v.toFixed(1)}%`;
  }

  protected tendenciaIcon(v: number): string {
    if (v > 1) return '↑';
    if (v < -1) return '↓';
    return '→';
  }
}
