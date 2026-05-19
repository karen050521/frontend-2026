import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IncidenteBusService,
  CreateIncidenteBusDto,
} from '../../core/services/incidente-bus.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-incidente-bus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidente-bus.component.html',
  styleUrl: './incidente-bus.component.css',
})
export class IncidenteBusComponent implements OnInit {
  private readonly incidenteService = inject(IncidenteBusService);
  private readonly toastService = inject(ToastService);
  private readonly http = inject(HttpClient);

  // Signals del Formulario
  public readonly tipo = signal<'mecanico' | 'accidente' | 'retraso' | 'otro'>('mecanico');
  public readonly gravedad = signal<'bajo' | 'medio' | 'alto' | 'critico'>('bajo');
  public readonly descripcion = signal<string>('');
  public readonly fotosBase64 = signal<string[]>([]);
  public readonly procesando = signal<boolean>(false);

  // 🛡️ Guardián de estado del turno en el Front
  public readonly tieneTurnoActivo = signal<boolean>(false);
  public readonly validandoTurno = signal<boolean>(true);

  ngOnInit(): void {
    this.verificarTurnoDelConductor();
  }

  /**
   * Valida inmediatamente al entrar a la vista si el usuario tiene permiso operacional de reportar
   */
  private verificarTurnoDelConductor(): void {
    this.validandoTurno.set(true);

    this.http.get<any>(`${environment.apiNestUrl}/turnos/mi-turno-activo`).subscribe({
      next: (turno) => {
        // Si el backend responde con un turno válido y está en_curso
        if (turno && turno.estado === 'en_curso') {
          this.tieneTurnoActivo.set(true);
        } else {
          this.tieneTurnoActivo.set(false);
          this.toastService.warning(
            '⚠️ Operación Denegada: Debes iniciar tu jornada en "Mi Jornada" antes de reportar un incidente.',
          );
        }
        this.validandoTurno.set(false);
      },
      error: (err) => {
        console.log('🛑 ERROR DETECTADO EN EL COMPONENTE:', err);

        // 1. Primero estabilizamos el estado de la pantalla
        this.tieneTurnoActivo.set(false);
        this.validandoTurno.set(false);

        // 2. Le damos un respiro de 50ms a Angular para que pinte el candado
        // y luego dispare el Toast de forma limpia
        setTimeout(() => {
          this.toastService.warning(
            '👋 ¡Hola! Recuerda que debes iniciar tu jornada antes de poder reportar un incidente.',
          );
        }, 50);
      },
    });
  }

  protected onFotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);

    if (this.fotosBase64().length + files.length > 5) {
      this.toastService.error('⚠️ No puedes adjuntar más de 5 fotografías en total.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          this.fotosBase64.update((current) => [...current, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  protected eliminarFoto(index: number): void {
    this.fotosBase64.update((current) => current.filter((_, i) => i !== index));
  }

  protected procesarReporte(): void {
    // 🛡️ Doble chequeo estricto antes de disparar el GPS
    if (!this.tieneTurnoActivo()) {
      this.toastService.error(
        '❌ Bloqueo de Seguridad: No posees un turno activo "en_curso" mapeado en el sistema.',
      );
      return;
    }

    if (!this.descripcion().trim()) {
      this.toastService.error('Por favor, ingresa una descripción detallada del incidente.');
      return;
    }

    this.procesando.set(true);

    if (!navigator.geolocation) {
      this.toastService.error('Tu navegador no soporta geolocalización o está desactivada.');
      this.procesando.set(false);
      return;
    }

    this.toastService.info('Obteniendo ubicación GPS precisa...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload: CreateIncidenteBusDto = {
          tipo: this.tipo(),
          gravedad: this.gravedad(),
          descripcion: this.descripcion().trim(),
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          base64Fotos: this.fotosBase64(),
        };

        // 📡 TELEMETRÍA EN CONSOLA: Imprimimos el payload exacto antes de transmitirlo
        console.log(
          '📡 Transmitiendo reporte de incidente y coordenadas satelitales al servidor:',
          {
            tipo: payload.tipo,
            gravedad: payload.gravedad,
            descripcion: payload.descripcion,
            coordenadas: { lat: payload.latitud, lng: payload.longitud },
            totalFotosAdjuntas: payload.base64Fotos?.length || 0,
          },
        );

        this.incidenteService.reportarIncidente(payload).subscribe({
          next: (res) => {
            this.toastService.success(res.message || '✅ Incidente registrado con éxito.');
            this.limpiarFormulario();
          },
          error: (err) => {
            console.error('Error al registrar incidente:', err);
            const errorMsg = err.error?.message || 'No se pudo procesar el reporte de incidente.';
            this.toastService.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
            this.procesando.set(false);
          },
        });
      },
      (error) => {
        this.procesando.set(false);
        this.toastService.error('❌ Error al intentar conectar con el satélite o red GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  private limpiarFormulario(): void {
    this.tipo.set('mecanico');
    this.gravedad.set('bajo');
    this.descripcion.set('');
    this.fotosBase64.set([]);
    this.procesando.set(false);
  }
}
