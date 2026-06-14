import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GrupoAdminModalComponent } from '../../../features/grupo-admin-modal/grupo-admin-modal.component';

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule, GrupoAdminModalComponent],
  templateUrl: './chat-floating.component.html',
  styleUrls: ['./chat-floating.component.css']
})
export class ChatFloatingComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly mensajeService = inject(MensajeService);
  private readonly grupoService = inject(GrupoService);
  private readonly notiService = inject(NotificacionService);
  private readonly chatSocketService = inject(ChatSocketService);
  
  private refreshSub?: Subscription; 
  private socketSub?: Subscription; 
  private socketPrivSub?: Subscription;
  private socketBloqueoSub?: Subscription; 
  private socketAbandonoSub?: Subscription;

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir' | 'personas'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);
  protected estaBloqueado = signal<boolean>(false); 
  protected estaAbandonado = signal<boolean>(false);

  protected busquedaPersonas = signal('');
  protected personasEncontradas = signal<any[]>([]);
  protected personaSeleccionada = signal<any>(null);
  protected mensajePrivadoActual = signal('');
  protected historialMensajesPrivados = signal<any[]>([]);

  protected readonly srvUrl = environment.apiNestUrl;
  protected isAdminModalOpen = signal(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.id) { this.cargarMisGrupos(user.id); this.cargarGruposPublicos(); }
    });
  }

  ngOnInit(): void {
    // 1. Notificaciones
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser();
      if (user?.id) { this.cargarMisGrupos(user.id); this.cargarGruposPublicos(); }
    });

    // 2. Mensajes grupales
    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMensaje: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        this.mensajes.update(list => [...list, nuevoMensaje]);
      }
    });

    // 3. Mensajes privados
    this.socketPrivSub = this.chatSocketService.escucharMensajesPrivados().subscribe((data: any) => {
      if (this.personaSeleccionada()?.id === data.emisorId) {
        this.historialMensajesPrivados.update(h => [...h, { esMio: false, contenido: data.contenido }]);
      }
    });

    // 4. Bloqueos
    this.socketBloqueoSub = this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
      if (this.grupoSeleccionado()?.id === Number(data.grupoId)) {
        this.estaBloqueado.set(true);
        this.mensajes.set([]);
      }
    });

    // 5. Abandono
    this.socketAbandonoSub = this.chatSocketService.escucharUsuarioAbandono().subscribe(() => {
      const user = this.authService.currentUser();
      if (user?.id) { this.cargarMisGrupos(user.id); this.cargarGruposPublicos(); this.notiService.triggerRefresh(); }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe();
    this.socketPrivSub?.unsubscribe();
    this.socketBloqueoSub?.unsubscribe();
    this.socketAbandonoSub?.unsubscribe();
  }

  // --- MÉTODOS DE APOYO ---
  cargarMisGrupos(userId: string): void { this.grupoService.getGruposPorPersona(userId).subscribe(data => this.grupos.set(data)); }
  cargarGruposPublicos(): void { this.grupoService.getPublicosDisponibles().subscribe(data => this.gruposPublicos.set(data)); }
  
  unirseAGrupo(grupoId: number): void {
    this.grupoService.unirseAGrupo(grupoId).subscribe(() => {
      const user = this.authService.currentUser();
      if (user) { this.cargarMisGrupos(user.id); this.cargarGruposPublicos(); }
      this.tabActiva.set('mis-grupos');
      this.notiService.triggerRefresh();
    });
  }

  seleccionarGrupo(grupo: any): void {
    this.estaBloqueado.set(grupo.rol === 'bloqueado');
    this.estaAbandonado.set(grupo.rol === 'abandonado');
    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) this.chatSocketService.salirDeGrupo(grupoAnterior.id);
    this.grupoSeleccionado.set(grupo);
    if (!this.estaBloqueado() && (!this.estaAbandonado() || grupo.rol === 'administrador')) {
      const user = this.authService.currentUser();
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id);
    }
    this.cargarMensajes(grupo.id);
  }

  cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    this.mensajeService.getHistorialGrupo(grupoId, user?.id).subscribe(data => {
      this.mensajes.set(data.map(m => ({ ...m, esMio: m.emisorId === user?.id || m.emisor?.id === user?.id })));
    });
  }

  enviarMensaje(): void {
    if (this.estaBloqueado() || this.estaAbandonado()) return;
    const user = this.authService.currentUser();
    const msg = this.mensajeActual.trim();
    const grupo = this.grupoSeleccionado();
    if (msg && grupo && user?.id) {
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msg);
      this.mensajeActual = '';
    }
  }

  enviarMensajePrivado(): void {
    const msg = this.mensajePrivadoActual().trim();
    const persona = this.personaSeleccionada();
    const user = this.authService.currentUser();
    if (!msg || !persona || !user) return;
    this.chatSocketService.enviarMensajePrivado(user.id, persona.id, msg);
    this.historialMensajesPrivados.update(h => [...h, { esMio: true, contenido: msg }]);
    this.mensajePrivadoActual.set('');
  }

  abandonarGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    const user = this.authService.currentUser();
    if (!grupo || !user?.id) return;
    if (confirm(`¿Abandonar ${grupo.nombre}?`)) {
      this.grupoService.abandonarGrupo(grupo.id).subscribe(() => {
        this.chatSocketService.salirDeGrupo(grupo.id);
        this.estaAbandonado.set(true);
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
      });
    }
  }

  get gruposFiltrados() {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.tabActiva() === 'mis-grupos' ? this.grupos() : this.gruposPublicos();
    return busqueda ? lista.filter(g => g.nombre.toLowerCase().includes(busqueda)) : lista;
  }

  toggleChat(): void { this.isOpen.update(v => !v); }
  volverAListado(): void { this.grupoSeleccionado.set(null); this.personaSeleccionada.set(null); }
  buscarPersona(termino: string) { this.busquedaPersonas.set(termino); }
}