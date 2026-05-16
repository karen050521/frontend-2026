import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnoService, CreateTurnoDto } from '../../core/services/turno.service'; 
import { ToastService } from '../../core/services/toast.service';
import { BusService } from '../../core/services/bus.service'; 
import { ConductorService } from '../../core/services/conductor.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-turno-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-conductor.component.html',
  styleUrl: './turno-conductor.component.css'
})
export class TurnoConductorComponent implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly toastService = inject(ToastService);
  private readonly busService = inject(BusService);
  private readonly conductorService = inject(ConductorService);
  private readonly authService = inject(AuthService);

  // ==========================================
  // 🚀 SEÑALES COMPUTADAS DE SEGURIDAD Y ROLES
  // ==========================================
  public readonly esGerente = computed(() => {
    const r = this.authService.activeRole() || localStorage.getItem('user_role') || '';
    const roleLower = r.toLowerCase();
    return (
      roleLower.includes('gerente') || 
      roleLower.includes('empresa') || 
      roleLower.includes('administrador de empresa') ||
      roleLower.includes('adminsitrador de empresa') // Blindaje por si acaso
    );
  });

  public readonly esConductor = computed(() => {
    const r = this.authService.activeRole() || localStorage.getItem('user_role') || '';
    return r.toLowerCase().includes('conductor');
  });

  // ==========================================
  // SIGNALS COMPARTIDOS / CONDUCTOR
  // ==========================================
  public readonly turnoId = signal<number | null>(null);
  public readonly turnoActual = signal<any | null>(null);
  public readonly historialTurnos = signal<any[]>([]); 
  public readonly isShiftActive = signal<boolean>(false);
  public readonly shiftStartTime = signal<string>('');
  public readonly cargando = signal<boolean>(true);

  // Propiedades vinculadas al formulario del conductor
  public readonly estadoBusConfirmado = signal<string>('operativo');
  public readonly observacionesBus = signal<string>('');

  // ==========================================
  // SIGNALS MÓDULO GERENTE (CREACIÓN MANUAL)
  // ==========================================
  public readonly nuevoTurnoForm = signal<CreateTurnoDto>({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    conductorId: undefined,
    busId: undefined
  });

  public readonly busesDisponibles = signal<any[]>([]);
  public readonly conductoresDisponibles = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarJornadaReal();
    
    if (this.esGerente()) {
      this.cargarDatosFormularioGerente();
    }
  }

  /**
   * Carga los buses y conductores reales desde la Base de Datos con logs de diagnóstico
   */
  protected cargarDatosFormularioGerente(): void {
    this.busService.listarBuses().subscribe({
      next: (buses: any[]) => {
        console.log("🚌 [Debug Buses] Data cruda recibida del servidor:", buses);
        this.busesDisponibles.set(buses);
      },
      error: (err) => {
        console.error('❌ Error al cargar buses reales:', err);
        this.toastService.error('No se pudieron cargar los buses.');
      }
    });

    this.conductorService.obtenerConductores().subscribe({
      next: (conductores: any[]) => {
        console.log("👤 [Debug Conductores] Data cruda recibida del servidor:", conductores);
        this.conductoresDisponibles.set(conductores);
      },
      error: (err) => {
        console.error('❌ Error al cargar conductores reales:', err);
        this.toastService.error('No se pudieron cargar los conductores.');
      }
    });
  }

  /**
   * Obtiene el turno correspondiente al Conductor autenticado e inicializa el historial
   */
  protected cargarJornadaReal(): void {
    this.cargando.set(true);
    this.turnoService.obtenerMisTurnos().subscribe({
      next: (turnos: any[]) => {
        if (turnos && turnos.length > 0) {
          const turnoPrioritario = turnos.find((t: any) => t.estado === 'en_curso' || t.estado === 'PROGRAMADO') || turnos[0];
          
          this.turnoId.set(turnoPrioritario.id);
          this.turnoActual.set(turnoPrioritario);

          if (turnoPrioritario.estado === 'en_curso') {
            this.isShiftActive.set(true);
            this.shiftStartTime.set(turnoPrioritario.horaInicio ? new Date(turnoPrioritario.horaInicio).toLocaleTimeString('es-CO') : '');
          }

          this.historialTurnos.set(turnos);
        } else {
          this.turnoActual.set(null);
          this.historialTurnos.set([]);
        }
        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error al mapear turnos:', err);
        this.toastService.error('Error al conectar con el sistema de turnos');
        this.cargando.set(false);
      }
    });
  }

  /**
   * LÓGICA DE OPERADOR: Confirma el checklist de seguridad e inicia la ruta
   */
  protected confirmarInicioTurno(): void {
    const id = this.turnoId() || this.turnoActual()?.id;
    
    if (!id) {
      this.toastService.error('No se identificó ningún turno válido asignado para hoy.');
      return;
    }

    if (this.estadoBusConfirmado() === 'con_observaciones' && !this.observacionesBus().trim()) {
      this.toastService.error('Por favor, detalle las observaciones mecánicas encontradas.');
      return;
    }

    const payload = {
      estadoBusConfirmado: this.estadoBusConfirmado() as 'operativo' | 'con_observaciones',
      observaciones: this.estadoBusConfirmado() === 'operativo' ? 'Sin observaciones' : this.observacionesBus().trim()
    };

    console.log('📡 Enviando reporte de inicio de turno al servidor:', payload);

    this.turnoService.iniciarTurno(id, payload).subscribe({
      next: (res: any) => {
        const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        
        this.isShiftActive.set(true);
        this.shiftStartTime.set(now);
        this.turnoActual.update((turno: any) => turno ? { ...turno, estado: 'en_curso' } : null);
        
        this.toastService.success(res.message || '✅ ¡Turno iniciado y tracking GPS activado!');
        this.cargarJornadaReal(); 
      },
      error: (err: any) => {
        console.error('❌ Error al intentar iniciar jornada:', err);
        const errorMsg = err.error?.message || 'No se pudo iniciar el turno. Verifica la hora asignada.';
        this.toastService.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    });
  }

  /**
   * LÓGICA DE OPERADOR: Finaliza la ruta actual y cierra la jornada del bus
   */
  protected completarFinalizacionTurno(): void {
    const id = this.turnoId() || this.turnoActual()?.id;

    if (!id) {
      this.toastService.error('No se pudo identificar el código del turno para proceder con el cierre.');
      return;
    }

    const confirmar = confirm('⚠️ ¿Está seguro de que desea finalizar su turno actual? Se detendrá la transmisión de coordenadas GPS.');
    if (!confirmar) return;

    console.log(`📡 Solicitando cierre definitivo para el turno ID: ${id}`);

    this.turnoService.finalizarTurno(id, { estado: 'finalizado' }).subscribe({
      next: (res: any) => {
        this.toastService.success(res.message || '🏁 Jornada finalizada con éxito. ¡Buen descanso!');
        
        this.isShiftActive.set(false);
        this.shiftStartTime.set('');
        this.turnoActual.set(null); 

        this.cargarJornadaReal(); 
      },
      error: (err: any) => {
        console.error('❌ Error al intentar cerrar el turno:', err);
        const errorMsg = err.error?.message || 'No se pudo procesar el cierre del turno.';
        this.toastService.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    });
  }

  /**
   * LÓGICA DE GERENCIA: Registra un nuevo turno de manera manual
   */
public crearTurnoManual(): void {
    console.log('🚀 [Paso 1] ¡El botón funciona perfectamente!');
    
    const datos = this.nuevoTurnoForm();
    console.log('📦 [Paso 2] Datos capturados del formulario:', datos);

    // Revisemos campo por campo qué tienes diligenciado en el formulario antes de enviarlo
    if (!datos.fecha || !datos.horaInicio || !datos.horaFin || !datos.busId || !datos.conductorId) {
      console.warn('⚠️ [Paso 3] ¡Bloqueado por validación! Faltan campos obligatorios.');
      console.log('Detalle de campos vacíos:', {
        'fecha está vacío?': !datos.fecha,
        'horaInicio está vacío?': !datos.horaInicio,
        'horaFin está vacío?': !datos.horaFin,
        'busId está vacío?': !datos.busId,
        'conductorId está vacío?': !datos.conductorId
      });
      this.toastService.error('Todos los campos son obligatorios para programar el turno.');
      return;
    }

    console.log('📡 [Paso 4] Pasó la validación. Enviando payload al servicio...');

    this.turnoService.crearTurnoManual(datos).subscribe({
      next: (res: any) => {
        console.log('✅ [Paso 5] ¡El servidor respondió con ÉXITO!', res);
        this.toastService.success('✅ ¡Turno creado y asignado exitosamente!');
        
        this.limpiarFormularioGerente();
        this.cargarJornadaReal();
      },
      error: (err: any) => {
        console.error('❌ [Paso 5 Error] El servidor rechazó la petición o falló la red:', err);
        const errorMsg = err.error?.message || 'Error al programar el turno manual.';
        this.toastService.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    });
  }

  /**
   * Verifica si el turno ya expiró comparando la fecha de fin con la hora actual
   */
  protected turnoHaExpirado(fechaFin: string | Date | undefined): boolean {
    if (!fechaFin) return false;
    const ahora = new Date();
    const finTurno = new Date(fechaFin);
    return ahora > finTurno;
  }  

  private limpiarFormularioGerente(): void {
    this.nuevoTurnoForm.set({
      fecha: '',
      horaInicio: '',
      horaFin: '',
      conductorId: undefined,
      busId: undefined
    });
  }

  protected updateFormField(field: keyof CreateTurnoDto, value: any): void {
    this.nuevoTurnoForm.update(form => ({
      ...form,
      [field]: value
    }));
  }

  /**
   * 🛠️ Interceptor para el HTML: Evita advertencias de optional chaining en consola
   */
  public obtenerCampoFormulario(field: keyof CreateTurnoDto): any {
    const form = this.nuevoTurnoForm();
    return form && form[field] ? form[field] : '';
  }
}