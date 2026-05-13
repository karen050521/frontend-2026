import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.css',
})
export class AnalyticsDashboardComponent implements OnInit {
  // HU-014: Reportes de Ingresos
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

  // HU-015: Demografía
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

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.calculateKPIs();
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
    // Simular descarga
    setTimeout(() => {
      this.toastService.success('✅ Reporte descargado (HU-014)');
    }, 1500);
  }

  /**
   * Descarga reporte demográfico
   */
  protected descargarReporteDemografia(): void {
    this.toastService.info('📥 Descargando reporte demográfico...');
    // Simular descarga
    setTimeout(() => {
      this.toastService.success('✅ Reporte descargado (HU-015)');
    }, 1500);
  }

  /**
   * Descarga reporte de incidentes
   */
  protected descargarReporteIncidentes(): void {
    this.toastService.info('📥 Descargando reporte de incidentes...');
    // Simular descarga
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
}
