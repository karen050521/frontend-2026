import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramacionService, CreateProgramacionDto } from '../../core/services/programacion.service';
import { BusService } from '../../core/services/bus.service'; 
import { RutaService } from '../../core/services/ruta.service'; 
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-programacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programacion.component.html',
  styleUrls: ['./programacion.component.css']
})
export class ProgramacionComponent implements OnInit {
  private readonly programacionService = inject(ProgramacionService);
  private readonly busService = inject(BusService);
  private readonly rutaService = inject(RutaService);
  private readonly authService = inject(AuthService); // 👈 Inyectamos el servicio de autenticación

  buses: any[] = [];
  rutas: any[] = []; 
  programaciones: any[] = [];
  programacionesFiltradas: any[] = [];

  formData: CreateProgramacionDto = {
    busId: 0,
    rutaId: 0,
    fecha: '',
    horaSalida: '',
    margenToleranciaMinutos: 0,
    tipoRecurrencia: 'none'
  };

  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    // Optimización: Solo cargamos buses y rutas si el usuario tiene permisos de edición
    if (this.esAdmin() || this.esGerente() || this.esEmpresa()) {
      this.cargarBuses();
      this.cargarRutas();
    }
    this.cargarProgramaciones(); // Esto lo cargan todos (incluido el ciudadano)
  }
// ==========================================
  // METODOS DE CONTROL DE ROLES (CORREGIDOS PARA ROL LARGO)
  // ==========================================
  
  private obtenerRolActual(): string {
    try {
      return (this.authService as any).activeRole?.() || localStorage.getItem('user_role') || '';
    } catch {
      return localStorage.getItem('user_role') || '';
    }
  }

  esAdmin(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    // `.includes()` soluciona el problema si el rol se llama "administrador de empresa"
    return rol.includes('admin') || rol.includes('administrador');
  }

  esGerente(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    return rol.includes('gerente');
  }

  esEmpresa(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    return rol.includes('empresa');
  }

  esCiudadano(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    return rol.includes('ciudadano');
  }
  // ==========================================

  cargarBuses(): void {
    this.busService.findAll().subscribe({
      next: (data: any[]) => this.buses = data, 
      error: (err: any) => console.error('Error al cargar buses', err) 
    });
  }

  cargarRutas(): void {
    this.rutaService.obtenerRutas().subscribe({
      next: (data: any[]) => this.rutas = data,
      error: (err: any) => console.error('Error al cargar rutas', err)
    });
  }

  cargarProgramaciones(): void {
    this.programacionService.findAll().subscribe({
      next: (data: any[]) => {
        this.programaciones = data;
        if (this.esCiudadano()) {
          // Filtrar solo programaciones de hoy o futuro para ciudadanos
          this.filtrarPor('hoy');
        } else {
          // Mostrar todos para administradores
          this.programacionesFiltradas = [...this.programaciones];
        }
      },
      error: (err: any) => console.error('Error al cargar la agenda', err)
    });
  }

  guardarProgramacion(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (!this.formData.busId || !this.formData.rutaId || !this.formData.fecha || !this.formData.horaSalida) {
      this.mensajeError = 'Por favor complete todos los campos obligatorios.';
      return;
    }

    const payloadEnvio = { ...this.formData };
    payloadEnvio.busId = Number(payloadEnvio.busId);
    payloadEnvio.rutaId = Number(payloadEnvio.rutaId);

    if (payloadEnvio.horaSalida && payloadEnvio.horaSalida.length === 5) {
      payloadEnvio.horaSalida = `${payloadEnvio.horaSalida}:00`;
    }

    this.programacionService.crear(payloadEnvio).subscribe({
      next: (res: any[]) => {
        this.mensajeExito = `¡Programación asignada con éxito! Se procesaron registros correctamente.`;
        this.resetForm();
        this.cargarProgramaciones(); 
      },
      error: (err: any) => {
        console.error('Error capturado en el frontend:', err);
        
        if (err.error && err.error.message) {
          this.mensajeError = Array.isArray(err.error.message) 
            ? err.error.message[0] 
            : err.error.message;
        } else if (err.status === 409) {
          this.mensajeError = 'Conflicto: El bus ya tiene itinerario en ese rango.';
        } else {
          this.mensajeError = 'Error al registrar la programación.';
        }
      }
    });
  }

  resetForm(): void {
    this.formData = {
      busId: 0,
      rutaId: 0,
      fecha: '',
      horaSalida: '',
      margenToleranciaMinutos: 0,
      tipoRecurrencia: 'none'
    };
  }

  // ==========================================
  // METODOS DE FILTRADO PARA CIUDADANOS
  // ==========================================

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD sin desfases de zona horaria
   */
  private obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  /**
   * Formatea una hora en formato 24h (14:30) a formato 12h (2:30 PM)
   */
  formatearHora(horaString: string): string {
    if (!horaString) return 'N/A';
    
    try {
      const [horas, minutos] = horaString.split(':').map(Number);
      const esPM = horas >= 12;
      const horas12 = horas % 12 || 12;
      
      return `${horas12.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')} ${esPM ? 'PM' : 'AM'}`;
    } catch {
      return horaString;
    }
  }

  /**
   * Filtra programaciones según la temporalidad solicitada
   * @param temporalidad 'hoy' para mostrar solo programaciones de hoy, 'futuro' para hoy y posteriores
   */
  filtrarPor(temporalidad: 'hoy' | 'futuro'): void {
    const fechaHoy = this.obtenerFechaHoy();
    
    if (temporalidad === 'hoy') {
      // Mostrar solo programaciones de hoy
      this.programacionesFiltradas = this.programaciones.filter(p => {
        const fechaProgramacion = p.fecha?.split('T')[0];
        return fechaProgramacion === fechaHoy;
      });
    } else if (temporalidad === 'futuro') {
      // Mostrar programaciones de hoy en adelante
      this.programacionesFiltradas = this.programaciones.filter(p => {
        const fechaProgramacion = p.fecha?.split('T')[0];
        return fechaProgramacion && fechaProgramacion >= fechaHoy;
      });
    }
  }
}