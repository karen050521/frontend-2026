import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BusService } from '../../../core/services/bus.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-conductor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './conductor-dashboard.component.html',
  styleUrl: './conductor-dashboard.component.css',
})
export class ConductorDashboardComponent implements OnInit {
  protected isShiftActive = signal<boolean>(false);
  protected shiftStartTime = signal<string>('');
  protected assignedBus = signal<any | null>(null);
  protected reportForm: FormGroup;
  protected isSubmittingReport = signal<boolean>(false);
  protected incidents = signal<any[]>([]);

  constructor(
    private busService: BusService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.reportForm = this.fb.group({
      busId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      severity: ['media', Validators.required],
      category: ['Mecanica', Validators.required],
    });
  }

  ngOnInit(): void {
    this.checkShiftStatus();
    this.loadRecentIncidents();
  }

  /**
   * Verifica el estado del turno actual
   */
  protected checkShiftStatus(): void {
    const shiftStatus = localStorage.getItem('shift_active');
    if (shiftStatus === 'true') {
      this.isShiftActive.set(true);
      this.shiftStartTime.set(localStorage.getItem('shift_start_time') || '');
      // Cargar datos del bus asignado
      this.assignedBus.set({
        id: 'B001',
        plate: 'ABC-123',
        model: 'Mercedes Benz O-500',
        passengers: 45,
      });
    }
  }

  /**
   * Inicia un turno
   */
  protected iniciarTurno(): void {
    const now = new Date().toLocaleTimeString('es-CO');
    localStorage.setItem('shift_active', 'true');
    localStorage.setItem('shift_start_time', now);
    this.isShiftActive.set(true);
    this.shiftStartTime.set(now);
    this.assignedBus.set({
      id: 'B001',
      plate: 'ABC-123',
      model: 'Mercedes Benz O-500',
      passengers: 45,
    });
    this.toastService.success('✅ Turno iniciado correctamente (HU-006)');
  }

  /**
   * Finaliza el turno actual
   */
  protected finalizarTurno(): void {
    localStorage.removeItem('shift_active');
    localStorage.removeItem('shift_start_time');
    this.isShiftActive.set(false);
    this.assignedBus.set(null);
    this.toastService.success('✅ Turno finalizado');
  }

  /**
   * Carga incidentes recientes
   */
  protected loadRecentIncidents(): void {
    this.incidents.set([
      {
        id: 1,
        title: 'Pérdida de pasajero',
        date: '2024-05-12 10:30',
        severity: 'Alta',
        status: 'Reportado',
      },
      {
        id: 2,
        title: 'Congestión de tráfico',
        date: '2024-05-11 14:15',
        severity: 'Media',
        status: 'Resuelto',
      },
    ]);
  }

  /**
   * Envía el reporte de incidente
   */
  protected enviarReporte(): void {
    if (this.reportForm.invalid) {
      this.toastService.error('Por favor completa todos los campos');
      return;
    }

    this.isSubmittingReport.set(true);

    // Simular envío del reporte
    setTimeout(() => {
      const newIncident = {
        id: this.incidents().length + 1,
        title: this.reportForm.get('title')?.value,
        date: new Date().toLocaleString('es-CO'),
        severity: this.reportForm.get('severity')?.value,
        status: 'Reportado',
      };

      this.incidents.update((incidents) => [newIncident, ...incidents]);
      this.reportForm.reset({ severity: 'media', category: 'Mecanica' });
      this.isSubmittingReport.set(false);
      this.toastService.success('✅ Reporte enviado correctamente (HU-007)');
    }, 1000);
  }

  /**
   * Obtiene el color de severidad
   */
  protected getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  }
}
