import {
  Component, OnInit, inject, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, Chart } from 'chart.js';
import { registerables } from 'chart.js';
import { ReportesApiService } from '../shared/services/reportes-api.service';
import { MetricCardComponent } from '../shared/components/metric-card/metric-card.component';
import { ExportButtonsComponent } from '../shared/components/export-buttons/export-buttons.component';
import {
  IngresosMetodoPagoResponse,
  MetricaIngreso,
  PeriodoMeses,
} from '../shared/models/reportes.models';

Chart.register(...registerables);

// Paleta de colores para métodos de pago
const COLORES = [
  { bg: 'rgba(139,92,246,0.85)',  border: '#8b5cf6' },
  { bg: 'rgba(236,72,153,0.85)',  border: '#ec4899' },
  { bg: 'rgba(6,182,212,0.85)',   border: '#06b6d4' },
  { bg: 'rgba(245,158,11,0.85)',  border: '#f59e0b' },
  { bg: 'rgba(16,185,129,0.85)',  border: '#10b981' },
  { bg: 'rgba(107,114,128,0.85)', border: '#6b7280' },
];

@Component({
  selector: 'app-ingresos-reporte',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MetricCardComponent, ExportButtonsComponent],
  templateUrl: './ingresos-reporte.component.html',
})
export class IngresosReporteComponent implements OnInit {
  private readonly api = inject(ReportesApiService);

  // ─── Estado ───────────────────────────────────────────────────────────────
  protected readonly periodoActivo = signal<PeriodoMeses>(6);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly datos = signal<IngresosMetodoPagoResponse | null>(null);
  protected readonly toastMsg = signal<string | null>(null);

  protected readonly periodos: PeriodoMeses[] = [3, 6, 12];

  // ─── Datos derivados ──────────────────────────────────────────────────────
  protected readonly totalIngresos = computed(() => {
    const d = this.datos();
    if (!d) return 0;
    return Object.values(d.totalesPorMetodo).reduce((s, v) => s + v, 0);
  });

  protected readonly metodoMasUsado = computed(() => {
    const d = this.datos();
    if (!d) return '—';
    const entries = Object.entries(d.totalesPorMetodo);
    if (!entries.length) return '—';
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  });

  protected readonly metricas = computed<MetricaIngreso[]>(() => {
    const d = this.datos();
    if (!d) return [];
    const total = this.totalIngresos();
    const metodos = Object.keys(d.totalesPorMetodo);

    return metodos.map((metodo) => {
      const tot = d.totalesPorMetodo[metodo];
      const porcentaje = total > 0 ? (tot / total) * 100 : 0;

      // Calcular variación entre primer y último mes disponibles
      const evolucion = d.evolucionMensual;
      let variacion = 0;
      if (evolucion.length >= 2) {
        const primero = Number(evolucion[0][metodo] ?? 0);
        const ultimo = Number(evolucion[evolucion.length - 1][metodo] ?? 0);
        variacion = primero > 0 ? ((ultimo - primero) / primero) * 100 : 0;
      }

      const tendencia = (variacion > 1 ? 'up' : variacion < -1 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral';
      return {
        metodo,
        total: tot,
        porcentaje,
        variacionMensual: variacion,
        tendencia,
      };
    }).sort((a, b) => b.total - a.total);
  });

  // ─── Chart.js ─────────────────────────────────────────────────────────────
  public readonly barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  public readonly barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#e4e4e7',
          font: { family: 'Inter, sans-serif', size: 12, weight: 'bold' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#3f3f46',
        borderWidth: 1,
        padding: 14,
        boxPadding: 6,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw as number;
            return ` ${ctx.dataset.label}: ${this.formatCOP(val)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { color: '#27272a' },
        ticks: { color: '#a1a1aa', font: { size: 11 } },
      },
      y: {
        stacked: false,
        grid: { color: '#27272a' },
        ticks: {
          color: '#a1a1aa',
          font: { size: 11 },
          callback: (v) => this.formatMillones(Number(v)),
        },
      },
    },
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cambiarPeriodo(p: PeriodoMeses): void {
    this.periodoActivo.set(p);
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.api.getIngresosMetodoPago(this.periodoActivo()).subscribe({
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

  private actualizarGrafico(res: IngresosMetodoPagoResponse): void {
    const metodos = Object.keys(res.totalesPorMetodo);
    const labels = res.evolucionMensual.map((e) => this.formatMes(e.mes));

    const datasets = metodos.map((metodo, i) => {
      const color = COLORES[i % COLORES.length];
      return {
        label: metodo,
        data: res.evolucionMensual.map((e) => Number(e[metodo] ?? 0)),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      };
    });

    this.barChartData = { labels, datasets };
  }

  protected onExportError(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3500);
  }

  // ─── Formatters ───────────────────────────────────────────────────────────
  protected formatCOP(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  protected formatMillones(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  }

  protected formatMes(mes: string): string {
    const [y, m] = mes.split('-');
    const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${nombres[parseInt(m) - 1]} ${y}`;
  }

  protected variacionLabel(v: number): string {
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}% vs mes anterior`;
  }

  protected getTendencia(m: MetricaIngreso): string {
    if (m.tendencia === 'up') return '↑';
    if (m.tendencia === 'down') return '↓';
    return '→';
  }

  protected getColorForIndex(i: number): string {
    return COLORES[i % COLORES.length].border;
  }

  protected variantForIndex(i: number): 'purple' | 'pink' | 'cyan' | 'amber' {
    const v: Array<'purple' | 'pink' | 'cyan' | 'amber'> = ['purple', 'pink', 'cyan', 'amber'];
    return v[i % v.length];
  }
}
