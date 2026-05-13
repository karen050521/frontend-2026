import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusService } from '../../../core/services/bus.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.css',
})
export class CompanyDashboardComponent implements OnInit {
  protected buses = signal<any[]>([]);
  protected incidents = signal<any[]>([]);
  protected schedules = signal<any[]>([]);
  protected registrationForm: FormGroup;
  protected scheduleForm: FormGroup;
  protected selectedBusForIncidents = signal<string>('');
  protected isSubmittingBusForm = signal<boolean>(false);
  protected isSubmittingScheduleForm = signal<boolean>(false);

  // Computed signals para los KPIs
  protected openIncidentsCount = computed(() => {
    return this.incidents().filter((i: any) => i.status === 'Abierto').length;
  });

  protected totalBusesCount = computed(() => {
    return this.buses().length;
  });

  protected activeSchedulesCount = computed(() => {
    return this.schedules().length;
  });

  constructor(
    private busService: BusService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.registrationForm = this.fb.group({
      plate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{3}$/)]],
      model: ['', [Validators.required, Validators.minLength(3)]],
      year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      capacity: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      licensePlate: ['', [Validators.required]],
    });

    this.scheduleForm = this.fb.group({
      route: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      busId: ['', Validators.required],
      frequency: ['Diario', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBuses();
    this.loadIncidents();
    this.loadSchedules();
  }

  /**
   * Carga los buses de la empresa
   */
  protected loadBuses(): void {
    this.buses.set([
      {
        id: 'B001',
        plate: 'ABC-123',
        model: 'Mercedes Benz O-500',
        year: 2020,
        capacity: 50,
        status: 'Operativo',
        mileage: 125000,
      },
      {
        id: 'B002',
        plate: 'DEF-456',
        model: 'Volvo B12B',
        year: 2019,
        capacity: 48,
        status: 'Mantenimiento',
        mileage: 189000,
      },
      {
        id: 'B003',
        plate: 'GHI-789',
        model: 'Scania K124',
        year: 2021,
        capacity: 52,
        status: 'Operativo',
        mileage: 87000,
      },
    ]);
  }

  /**
   * Carga los incidentes de los buses
   */
  protected loadIncidents(): void {
    this.incidents.set([
      {
        id: 1,
        busId: 'B001',
        busPlate: 'ABC-123',
        title: 'Pérdida de pasajero',
        date: '2024-05-12',
        severity: 'Alta',
        status: 'Abierto',
      },
      {
        id: 2,
        busId: 'B002',
        busPlate: 'DEF-456',
        title: 'Problemas con aire acondicionado',
        date: '2024-05-11',
        severity: 'Media',
        status: 'En revisión',
      },
      {
        id: 3,
        busId: 'B003',
        busPlate: 'GHI-789',
        title: 'Revisión de llantas programada',
        date: '2024-05-10',
        severity: 'Baja',
        status: 'Cerrado',
      },
    ]);
  }

  /**
   * Carga las programaciones
   */
  protected loadSchedules(): void {
    this.schedules.set([
      {
        id: 1,
        route: 'Centro - Aeropuerto',
        bus: 'ABC-123',
        startTime: '06:00',
        endTime: '22:00',
        frequency: 'Diario',
      },
      {
        id: 2,
        route: 'Norte - Sur',
        bus: 'DEF-456',
        startTime: '07:00',
        endTime: '21:00',
        frequency: 'Diario',
      },
      {
        id: 3,
        route: 'Este - Oeste',
        bus: 'GHI-789',
        startTime: '08:00',
        endTime: '20:00',
        frequency: 'Lunes-Viernes',
      },
    ]);
  }

  /**
   * Registra un nuevo bus
   */
  protected registrarBus(): void {
    if (this.registrationForm.invalid) {
      this.toastService.error('Por favor completa todos los campos correctamente');
      return;
    }

    this.isSubmittingBusForm.set(true);

    setTimeout(() => {
      const newBus = {
        id: `B${this.buses().length + 1}`,
        ...this.registrationForm.value,
        status: 'Operativo',
        mileage: 0,
      };

      this.buses.update((buses) => [...buses, newBus]);
      this.registrationForm.reset();
      this.isSubmittingBusForm.set(false);
      this.toastService.success('✅ Bus registrado exitosamente (HU-012)');
    }, 1500);
  }

  /**
   * Crea una nueva programación
   */
  protected crearProgramacion(): void {
    if (this.scheduleForm.invalid) {
      this.toastService.error('Por favor completa todos los campos');
      return;
    }

    this.isSubmittingScheduleForm.set(true);

    setTimeout(() => {
      const newSchedule = {
        id: this.schedules().length + 1,
        ...this.scheduleForm.value,
      };

      this.schedules.update((schedules) => [...schedules, newSchedule]);
      this.scheduleForm.reset({ frequency: 'Diario' });
      this.isSubmittingScheduleForm.set(false);
      this.toastService.success('✅ Programación creada (HU-011)');
    }, 1000);
  }

  /**
   * Obtiene los incidentes de un bus específico
   */
  protected getIncidentsForBus(busId: string): any[] {
    if (!busId) return this.incidents();
    return this.incidents().filter((incident) => incident.busId === busId);
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

  /**
   * Obtiene el color de estado del bus
   */
  protected getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'operativo':
        return 'text-green-600 dark:text-green-400';
      case 'mantenimiento':
        return 'text-orange-600 dark:text-orange-400';
      case 'fuera de servicio':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }
}
