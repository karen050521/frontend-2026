import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ToastService } from '../../../core/services/toast.service';
import { ReporteService } from '../../../core/services/reporte.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css'],
})
export class AnalyticsDashboardComponent implements OnInit {
  // HU-014: Reportes de Ingresos (datos estáticos usados para tabla y KPIs)
  protected ingresosMensuales = signal<any[]>([
    { mes: 'Enero', ingresos: 2850000, viajes: 1245 },
    { mes: 'Febrero', ingresos: 3120000, viajes: 1389 },
    { mes: 'Marzo', ingresos: 2950000, viajes: 1312 },
    { mes: 'Abril', ingresos: 3450000, viajes: 1521 },
    { mes: 'Mayo', ingresos: 3680000, viajes: 1643 },
  ]);

  protected ingresosPorRuta = signal<any[]>([
    { ruta: 'Centro - Aeropuerto', ingresos: 1200000, percentage: 22 },
    { ruta: 'Norte - Sur', ingresos: 950000, percentage: 18 },
    { ruta: 'Este - Oeste', ingresos: 780000, percentage: 15 },
    { ruta: 'Centro - Periferia', ingresos: 650000, percentage: 12 },
    { ruta: 'Sur - Occidente', ingresos: 550000, percentage: 10 },
  ]);

  // HU-015: Demografía (estáticos para secciones que no fueron convertidas a charts)
  protected demografiaUsuarios = signal<any>({
    hombres: 58,
    mujeres: 35,
    otros: 7,
  });

  protected rangoEdades = signal<any[]>([
    { rango: '18-25', porcentaje: 28 },
    { rango: '26-35', porcentaje: 35 },
    { rango: '36-45', porcentaje: 22 },
    { rango: '46+', porcentaje: 15 },
  ]);

  // HU-016: Tendencias de Incidentes
  protected incidentesPorTipo = signal<any[]>([
    { tipo: 'Mecánicos', cantidad: 45, tendencia: '+12%' },
    { tipo: 'Seguridad', cantidad: 23, tendencia: '-5%' },
    { tipo: 'Pasajeros', cantidad: 67, tendencia: '+8%' },
    { tipo: 'Infraestructura', cantidad: 12, tendencia: '-2%' },
  ]);

  protected incidentesPorMes = signal<any[]>([
    { mes: 'Enero', cantidad: 34 },
    { mes: 'Febrero', cantidad: 41 },
    { mes: 'Marzo', cantidad: 38 },
    { mes: 'Abril', cantidad: 52 },
    { mes: 'Mayo', cantidad: 48 },
  ]);

  // KPIs Principales
  protected ingresoTotal = signal<number>(0);
  protected viajesTotal = signal<number>(0);
  protected usuariosActivos = signal<number>(2847);
  protected incidentesResueltos = signal<number>(156);

  protected dateRangeFilter = signal<string>('mes'); // 'semana', 'mes', 'trimestre', 'año'

  // Chart.js / ng2-charts
  private reporteService = inject(ReporteService);
  private toastService = inject(ToastService);
  private token = localStorage.getItem('authToken') || '';
  protected loading = signal<boolean>(false);

  // HU-014 - Bar chart configuration (ingresos por método o por mes)
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: { stacked: false },
      y: { stacked: false, ticks: { callback: (val: any) => '$' + val } }
    },
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  };

  // HU-015 - Pie chart configuration (rango etario)
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'right' }
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.calculateKPIs();
    this.cargarDatos(); // carga datos reales para gráficos
  }

  /**
   * Calcula los KPIs principales
   */
  protected calculateKPIs(): void {
    this.ingresoTotal.set(this.ingresosMensuales().reduce((sum, item) => sum + item.ingresos, 0));
    this.viajesTotal.set(this.ingresosMensuales().reduce((sum, item) => sum + item.viajes, 0));
  }

  /**
   * Descarga reporte de ingresos
   */
  protected descargarReporteIngresos(): void {
    this.toastService.info('📥 Descargando reporte de ingresos...');
    setTimeout(() => {
      this.toastService.success('✅ Reporte descargado (HU-014)');
    }, 1500);
  }

  /**
   * Descarga reporte demográfico
   */
  protected descargarReporteDemografia(): void {
    this.toastService.info('📥 Descargando reporte demográfico...');
    setTimeout(() => {
      this.toastService.success('✅ Reporte descargado (HU-015)');
    }, 1500);
  }

  /**
   * Descarga reporte de incidentes
   */
  protected descargarReporteIncidentes(): void {
    this.toastService.info('📥 Descargando reporte de incidentes...');
    setTimeout(() => {
      this.toastService.success('✅ Reporte descargado (HU-016)');
    }, 1500);
  }

  /**
   * Obtiene la altura de la barra en porcentaje
   */
  protected getBarHeight(actual: number, maximo: number): number {
    return (actual / maximo) * 100;
  }

  /**
   * Obtiene el color según el tipo de incidente
   */
  protected getIncidentTypeColor(tipo: string): string {
    switch (tipo.toLowerCase()) {
      case 'mecánicos':
        return 'bg-orange-500';
      case 'seguridad':
        return 'bg-red-500';
      case 'pasajeros':
        return 'bg-blue-500';
      case 'infraestructura':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Obtiene el color de tendencia
   */
  protected getTrendColor(tendencia: string): string {
    return tendencia.includes('+') ? 'text-red-600' : 'text-green-600';
  }

  /**
   * Formatea moneda
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /* ------------------- Integración con ReporteService para charts ------------------- */

  protected onPeriodoSeleccionado(periodo: string): void {
    this.dateRangeFilter.set(periodo);
    this.cargarDatos();
  }

  private cargarDatos(): void {
    if (!this.token) {
      // si no hay token, no intentamos pedir datos reales
      this.toastService.info('Inicia sesión para cargar métricas reales.');
      return;
    }
    this.loading.set(true);

    // HU-014: Obtener ingresos por método (normaliza a etiquetas/datos)
    this.reporteService.obtenerIngresosPorMetodo().subscribe({
      next: (resp) => {
        const ingresos = resp?.ingresos || [];
        if (Array.isArray(ingresos) && ingresos.length > 0) {
          const labels = ingresos.map((i: any) => i.tipoInstrumento || i.tipo_instrumento || 'Desconocido');
          const data = ingresos.map((i: any) => Number(i.ingresosTotal ?? i.ingresos_total ?? 0));
          this.barChartData = {
            labels,
            datasets: [{ label: 'Ingresos', data }]
          };
        } else {
          const labels = this.ingresosMensuales().map(i => i.mes);
          const data = this.ingresosMensuales().map(i => i.ingresos);
          this.barChartData = { labels, datasets: [{ label: 'Ingresos (simulado)', data }] };
        }
      },
      error: (err) => {
        console.error('Error cargando ingresos desde API', err);
      }
    });

    // HU-015: Obtener distribución etaria -> pie chart
    this.reporteService.obtenerDistribucionEtaria().subscribe({
      next: (resp) => {
        const distrib = resp?.distribucion || [];
        if (Array.isArray(distrib) && distrib.length > 0) {
          const labels = distrib.map((d: any) => d.rangoEtario || d.rango_etario || d.rango || 'Desconocido');
          const data = distrib.map((d: any) => Number(d.porcentaje ?? d.porcentaje ?? 0));
          this.pieChartData = {
            labels,
            datasets: [{
              data,
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
            }]
          };
        } else {
          const labels = this.rangoEdades().map(r => r.rango);
          const data = this.rangoEdades().map(r => r.porcentaje);
          this.pieChartData = {
            labels,
            datasets: [{
              data,
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
            }]
          };
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando distribución etaria', err);
        this.loading.set(false);
      }
    });
  }
}