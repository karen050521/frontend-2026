import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, Chart } from 'chart.js';
import { ReporteIncidentesService, DataTendencia } from '../../../core/services/reporte-incidentes.service';

// Registrar componentes de Chart.js para evitar el error de escalas
import { registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-tendencia-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './tendencia-incidentes.html',
  styleUrls: ['./tendencia-incidentes.css']
})
export class TendenciaIncidentes implements OnInit {
  private readonly reporteService = inject(ReporteIncidentesService);

  // Control del filtro bindeado al select
  empresaSeleccionada: string = 'todas';

  // Configuración estructural del Gráfico (Líneas Múltiples)
  public lineChartType: ChartType = 'line';
  
  // Data inicial estructurada para Chart.js
  public lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  // Estilos visuales Premium alineados con la UI de Kala (Modo Oscuro)
  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#e4e4e7', // text-zinc-200
          font: { family: 'Inter, sans-serif', size: 12, weight: 'bold' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#18181b', // zinc-900
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { color: '#27272a', drawOnChartArea: true }, // Líneas sutiles de fondo
        ticks: { color: '#a1a1aa', font: { size: 11 } }
      },
      y: {
        min: 0,
        suggestedMax: 10,
        grid: { color: '#27272a' },
        ticks: { color: '#a1a1aa', font: { size: 11 }, stepSize: 2 }
      }
    }
  };

  ngOnInit(): void {
    this.cargarDatosReales();
  }

  filtrarPorEmpresa(): void {
    this.cargarDatosReales();
  }

  private cargarDatosReales(): void {
    this.reporteService.obtenerTendencia(this.empresaSeleccionada).subscribe({
      next: (data: DataTendencia[]) => {
        this.procesarDataGrafico(data);
      },
      error: (err) => {
        console.error('Error cargando tendencias en Kala:', err);
      }
    });
  }

  private procesarDataGrafico(data: DataTendencia[]): void {
    // 1. Obtener meses únicos presentes y ordenarlos cronológicamente (Garantiza mínimo 3 meses)
    const mesesSet = new Set<string>();
    
    // Rellenar con los últimos 4 meses de manera predeterminada si la BD viene vacía o corta
    const hoy = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      mesesSet.add(d.toISOString().substring(0, 7));
    }
    
    // Agregar los meses devueltos por la base de datos
    data.forEach(item => mesesSet.add(item.mes));
    const listaMeses = Array.from(mesesSet).sort();

    // 2. Definición estricta de las categorías requeridas por los Criterios de Aceptación
    const categoriasConfig = [
      { key: 'MECANICO', label: '🛠️ Mecánicos', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
      { key: 'ACCIDENTE', label: '💥 Accidentes', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
      { key: 'RETRASO', label: '⏳ Retrasos', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
      { key: 'PASAJEROS', label: '👥 Problemas Pasajeros', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
      { key: 'OTROS', label: '📁 Otros', color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)' }
    ];

    // 3. Construir los datasets rellenando con 0 los meses donde no haya registros
    const datasets = categoriasConfig.map(cat => {
      const dataMensual = listaMeses.map(mes => {
        // Buscar si existe registro para este mes y esta categoría
        const registro = data.find(d => d.mes === mes && d.tipo.toUpperCase() === cat.key);
        return registro ? registro.cantidad : 0; // Si no hay, se pone 0 para mantener la continuidad de la línea
      });

      return {
        label: cat.label,
        data: dataMensual,
        borderColor: cat.color,
        backgroundColor: cat.bg,
        pointBackgroundColor: cat.color,
        pointBorderColor: '#18181b',
        pointHoverBackgroundColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4, // Curvatura suave elegante estilo Kala
        fill: true   // Relleno translúcido debajo de la línea
      };
    });

    // 4. Asignar los datos al objeto bindeado al canvas
    this.lineChartData = {
      labels: listaMeses,
      datasets: datasets
    };
  }
}