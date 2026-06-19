import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertaService, AlertaPayload } from 'src/app/core/services/alerta.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-alerta-masiva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alerta-masiva.component.html'
})
export class AlertaMasivaComponent implements OnInit {
  alertaForm!: FormGroup;
  totalDestinatarios: number = 0;
  
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  // 📦 VARIABLES AGREGADAS PARA CORREGIR LOS ERRORES DE COMPILACIÓN
  listaRutas: any[] = [];
  listaZonas: any[] = [];

  // Historial de alertas enviadas en la sesión actual para ver estadísticas
  alertasEnviadas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private alertaService: AlertaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    
    this.alertaForm = this.fb.group({
      contenido: ['', [Validators.required, Validators.maxLength(500)]],
      alcanceTipo: ['TODOS', Validators.required],
      alcanceId: [''],
      esUrgente: [false],
      programadoPara: ['']
    });

    // Cargar los catálogos de rutas y zonas desde el backend de inmediato
    this.cargarRutas();
    this.cargarZonas();

    // Cargar el contador inicial al abrir la vista
    this.actualizarContador();

    // Cargar alertas previas desde la BD para que el monitor no quede vacío
this.alertaService.getTodasAlertas().subscribe({
  next: (alertas) => this.alertasEnviadas = alertas,
  error: () => {}
});
    
    // Escuchar cambios del alcance para recalcular destinatarios automáticamente
    this.alertaForm.get('alcanceTipo')?.valueChanges.subscribe(() => {
      this.alertaForm.get('alcanceId')?.setValue('');
      this.actualizarContador();
    });
  }

  cargarRutas(): void {
    this.alertaService.obtenerRutasDisponibles().subscribe({
      next: (rutas) => {
        this.listaRutas = rutas;
      },
      error: () => {
        this.listaRutas = [];
      }
    });
  }

  cargarZonas(): void {
    this.alertaService.obtenerZonasDisponibles().subscribe({
      next: (zonas) => {
        this.listaZonas = zonas;
      },
      error: () => {
        this.listaZonas = [];
      }
    });
  }

  actualizarContador(): void {
    const tipo = this.alertaForm.get('alcanceTipo')?.value;
    const id = this.alertaForm.get('alcanceId')?.value || undefined;

    this.alertaService.getContadorDestinatarios(tipo, id).subscribe({
      next: (res) => {
        this.totalDestinatarios = res.total;
      },
      error: () => {
        this.totalDestinatarios = 0;
      }
    });
  }

  enviarAlerta(): void {
    if (this.alertaForm.invalid) return;

    const adminIdReal = this.authService.currentUser()?.id;

    if (!adminIdReal) {
      this.mensajeError = 'Error: No se pudo identificar la sesión del administrador actual.';
      return;
    }

    this.mensajeExito = null;
    this.mensajeError = null;

    const formValues = this.alertaForm.value;
    const payload: AlertaPayload = {
      contenido: formValues.contenido,
      alcanceTipo: formValues.alcanceTipo,
      alcanceId: formValues.alcanceId || undefined,
      esUrgente: formValues.esUrgente,
      programadoPara: formValues.programadoPara ? new Date(formValues.programadoPara).toISOString() : undefined
    };

    this.alertaService.enviarAlertaMasiva(adminIdReal, payload).subscribe({
      next: (res) => {
        this.mensajeExito = `Alerta masiva desplegada con éxito. Destinatarios alcanzados: ${res.estadisticas.totalDestinatarios}`;
        
        this.alertasEnviadas.unshift({
          id: res.mensajeId,
          contenido: formValues.contenido,
          alcanceTipo: formValues.alcanceTipo,
          estado: res.estado,
          fechaEnvio: res.fechaEnvio,
          estadisticas: res.estadisticas
        });

        this.alertaForm.reset({
          alcanceTipo: 'TODOS',
          esUrgente: false,
          contenido: '',
          alcanceId: '',
          programadoPara: ''
        });
        this.actualizarContador();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Ocurrió un error inesperado al procesar la alerta.';
      }
    });
  }

  cargarEstadisticas(alerta: any): void {
    this.alertaService.getEstadisticasAlerta(alerta.id).subscribe({
      next: (res) => {
        alerta.estadisticas = res.estadisticas;
        this.mensajeExito = `Estadísticas de la alerta #${alerta.id} actualizadas.`;
      },
      error: (err) => {
        this.mensajeError = 'No se pudieron refrescar las estadísticas del servidor.';
      }
    });
  }
}