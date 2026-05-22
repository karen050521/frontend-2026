import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IncidenteAdminService,
  IncidenteHistorialDto,
  EstadisticasBusDto,
} from '../../core/services/incidente-admin.service';
import { IncidenteBusService } from '../../core/services/incidente-bus.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-incidente-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidente-admin.component.html',
  styleUrl: './incidente-admin.component.css',
})
export class IncidenteAdminComponent {
  private readonly adminService = inject(IncidenteAdminService);
  private readonly busService = inject(IncidenteBusService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  // 🚍 Control de búsqueda en la interfaz por Placa
  public readonly placaBusqueda = signal<string>('');

  // Guardamos un objeto simulado con la placa para el HTML, pero mantenemos el ID real
  public readonly busSeleccionado = signal<{ placa: string; id: number } | null>(null);
  public readonly busIdSeleccionado = signal<number | null>(null);

  // Filtros reactivos (Signals)
  public readonly filtroTipo = signal<string>('');
  public readonly filtroEstado = signal<string>('');

  // Estados de datos sincronizados con la API
  public readonly incidentes = signal<IncidenteHistorialDto[]>([]);
  public readonly estadisticas = signal<EstadisticasBusDto | null>(null);

  // UI States de renderizado
  public readonly cargando = signal<boolean>(false);
  public readonly cargandoStats = signal<boolean>(false);
  public readonly incidenteSeleccionado = signal<IncidenteHistorialDto | null>(null);
  public readonly alertasGerente = signal<any[]>([]);
  public readonly cargandoAlertas = signal<boolean>(false);

  // Formulario de seguimiento interno
  public readonly nuevoComentario = signal<string>('');
  public readonly procesandoSeguimiento = signal<boolean>(false);

  constructor() {
    // 🔄 Efecto reactivo automático: Si cambian los filtros y hay un ID de bus válido, recargamos la lista
    effect(
      () => {
        const busId = this.busIdSeleccionado();
        if (busId) {
          this.cargarHistorialIncidentes(busId);
        }
      },
      { allowSignalWrites: true },
    );

    // Cargar alertas para gerente solo si el usuario tiene rol admin/gerente
    try {
      if (this.esAdmin() || this.esGerente()) {
        // ID de la empresa KALA según lo indicado (5)
        this.cargarAlertasGerente(5);
      }
    } catch (e) {
      // no bloquear inicio si falla el chequeo de roles
    }
  }

  // =====================
  // Control de roles (similar a programacion)
  // =====================
  private obtenerRolActual(): string {
    try {
      return (this.authService as any).activeRole?.() || localStorage.getItem('user_role') || '';
    } catch {
      return localStorage.getItem('user_role') || '';
    }
  }

  esAdmin(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    return rol.includes('admin') || rol.includes('administrador');
  }

  esGerente(): boolean {
    const rol = this.obtenerRolActual().toLowerCase();
    return rol.includes('gerente');
  }

  // =====================
  // Cargar alertas
  // =====================
  private cargarAlertasGerente(empresaId: number): void {
    this.cargandoAlertas.set(true);
    this.busService.obtenerAlertasGerente(empresaId).subscribe({
      next: (data) => {
        this.alertasGerente.set(Array.isArray(data) ? data : []);
        this.cargandoAlertas.set(false);
      },
      error: (err) => {
        console.error('Error cargando alertas gerente:', err);
        this.toastService.error('No se pudieron obtener las alertas de gerente.');
        this.cargandoAlertas.set(false);
      },
    });
  }

  /**
   * Dispara la auditoría evaluando la entrada del buscador.
   * Si ingresas un número de ID directo o extrae el identificador requerido.
   */
  protected buscarPorPlaca(): void {
    const entrada = this.placaBusqueda().trim().toUpperCase();

    if (!entrada) {
      this.toastService.error('Por favor, ingresa una placa o ID de autobús válido.');
      return;
    }

    // Extraemos el ID numérico si la entrada contiene caracteres como "BUS-002" -> obtenemos el 2.
    // Si solo es un número (ej: "2"), lo toma directamente.
    const numeroExtraido = entrada.replace(/\D/g, '');
    const idNum = Number(numeroExtraido || entrada);

    if (!idNum || isNaN(idNum)) {
      this.toastService.error(
        'No se pudo determinar el ID numérico a partir de la placa ingresada.',
      );
      return;
    }

    // Seteamos los estados reactivos mapeando la placa estética y el ID real para el Backend
    this.busSeleccionado.set({ placa: entrada, id: idNum });
    this.busIdSeleccionado.set(idNum);
    this.incidenteSeleccionado.set(null); // Limpiamos detalles anteriores

    // Cargamos historial y calculamos estadísticas locales basadas en los incidentes mostrados
    this.cargarHistorialIncidentes(idNum);
  }

  /**
   * Carga la lista de incidentes desde el Backend aplicando los filtros de forma limpia
   */
  private cargarHistorialIncidentes(busId: number): void {
    this.cargando.set(true);

    // Obtenemos los valores limpios de las Signals
    const tipoValor = this.filtroTipo()?.trim();
    const estadoValor = this.filtroEstado()?.trim();

    // 🛡️ BLINDAJE: Si el combo está en "" (Todos), pasamos undefined para que el Backend NO filtre por un texto vacío
    const filtros: any = {};
    if (tipoValor && tipoValor !== '') filtros.tipo = tipoValor;
    if (estadoValor && estadoValor !== '') filtros.estado = estadoValor;

    this.adminService.obtenerHistorialPorBus(busId, filtros).subscribe({
      next: (data) => {
        console.log('Datos recibidos del historial:', data); // 👈 Revisa esto en tu consola para ver cómo vienen los tipos de tu BD
        if (data && Array.isArray(data)) {
          // Ordenamos por fecha de forma descendente
          const ordenados = data.sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
          );
          this.incidentes.set(ordenados);

          // Calcular estadísticas locales basadas únicamente en los incidentes mostrados
          const total = ordenados.length;
          const porTipo: Record<string, number> = {};
          ordenados.forEach((it) => {
            const key = (it.tipo || 'otro').toString().toLowerCase();
            porTipo[key] = (porTipo[key] ?? 0) + 1;
          });
          const resueltos = ordenados.filter((i) => i.estado === 'resuelto').length;
          const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100).toString() : '0';

          this.estadisticas.set({ totalIncidentes: total, porTipo, tasaResolucion });
        } else {
          this.incidentes.set([]);
          this.estadisticas.set({ totalIncidentes: 0, porTipo: {}, tasaResolucion: '0' });
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.toastService.error('No se pudo recuperar el historial de incidentes.');
        this.cargando.set(false);
        this.incidentes.set([]); // Evitamos estados inconsistentes
      },
    });
  }

  /**
   * Carga los KPIs matemáticos usando el ID numérico requerido en la ruta del servidor
   */
  private cargarEstadisticas(busId: number): void {
    this.cargandoStats.set(true);
    this.adminService.obtenerEstadisticasPorBus(busId).subscribe({
      next: (stats) => {
        this.estadisticas.set(stats);
        this.cargandoStats.set(false);
      },
      error: () => this.cargandoStats.set(false),
    });
  }

  /**
   * Selecciona un incidente específico para auditar fotos y agregar bitácora
   */
  protected verDetalle(incidente: IncidenteHistorialDto): void {
    this.incidenteSeleccionado.set(incidente);
    this.nuevoComentario.set('');
  }

  /**
   * Procesa los cambios de estado o inserción de comentarios en la bitácora
   */
  protected guardarSeguimiento(nuevoEstado?: string): void {
    const incidenteActual = this.incidenteSeleccionado();
    if (!incidenteActual) return;

    const comentarioTexto = this.nuevoComentario().trim();

    if (!nuevoEstado && !comentarioTexto) {
      this.toastService.error('Escribe un comentario o selecciona un nuevo estado.');
      return;
    }

    this.procesandoSeguimiento.set(true);

    const payload = {
      ...(nuevoEstado && { estado: nuevoEstado }),
      ...(comentarioTexto && { comentario: comentarioTexto }),
    };

    this.adminService.actualizarSeguimiento(incidenteActual.id, payload).subscribe({
      next: (res) => {
        this.toastService.success('Bitácora de seguimiento actualizada correctamente.');
        this.nuevoComentario.set('');

        // Recargamos el panel usando el ID numérico activo
        const idActual = this.busIdSeleccionado();
        if (idActual) {
          this.cargarHistorialIncidentes(idActual);
          this.cargarEstadisticas(idActual);
        }

        // Sincronizamos la UI lateral con el response
        this.incidenteSeleccionado.update((curr) => {
          if (!curr) return null;
          return {
            ...curr,
            estado: res.estado || curr.estado,
            comentarios: res.comentarios || curr.comentarios,
          };
        });

        this.procesandoSeguimiento.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Error al guardar la actualización de seguimiento.');
        this.procesandoSeguimiento.set(false);
      },
    });
  }

  protected auditarDesdeAlerta(alerta: any): void {
    if (!alerta || !alerta.placaBus) return;
    this.placaBusqueda.set(alerta.placaBus);
    // Intentamos iniciar búsqueda por placa (buscarPorPlaca hace extracción numérica)
    this.buscarPorPlaca();
  }
}
