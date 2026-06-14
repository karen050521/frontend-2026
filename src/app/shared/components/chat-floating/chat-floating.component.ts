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
  styleUrl: './chat-floating.component.css'
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

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir' | 'personas'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);
  protected estaBloqueado = signal<boolean>(false); 

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
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
      }
    });
  }

  // ✨ CORRECCIÓN: Definición del getter que causaba el error
  get gruposFiltrados() {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.tabActiva() === 'mis-grupos' ? this.grupos() : this.gruposPublicos();
    
    if (!busqueda) return lista;

    return lista.filter(g => 
      (g.nombre && g.nombre.toLowerCase().includes(busqueda)) || 
      (g.descripcion && g.descripcion.toLowerCase().includes(busqueda))
    );
  }

  ngOnInit(): void {
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
      }
    });

    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMensaje: any) => {
      const grupoActual = this.grupoSeleccionado();
      const user = this.authService.currentUser();

      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        const mensajeMapeado = {
          ...nuevoMensaje,
          esMio: nuevoMensaje.emisorId === user?.id || nuevoMensaje.emisor?.id === user?.id
        };
        this.mensajes.update(list => [...list, mensajeMapeado]);
      }
    });

    this.socketPrivSub = this.chatSocketService.escucharMensajesPrivados().subscribe((data: any) => {
      if (this.personaSeleccionada() && this.personaSeleccionada().id === data.emisorId) {
        this.historialMensajesPrivados.update(h => [...h, { esMio: false, contenido: data.contenido }]);
      }
    });

    this.socketBloqueoSub = this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && Number(data.grupoId) === Number(grupoActual.id)) {
        this.estaBloqueado.set(true);
        this.mensajes.set([]); 
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe(); 
    this.socketPrivSub?.unsubscribe();
    this.socketBloqueoSub?.unsubscribe(); 
  }

  cargarMisGrupos(userId: string): void {
    this.grupoService.getGruposPorPersona(userId).subscribe(data => this.grupos.set(data));
  }

  cargarGruposPublicos(): void {
    this.grupoService.getPublicosDisponibles().subscribe(data => this.gruposPublicos.set(data));
  }

  // ✨ CORRECCIÓN: Definición del método que causaba el error
  unirseAGrupo(grupoId: number): void {
    this.grupoService.unirseAGrupo(grupoId).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) {
          this.cargarMisGrupos(user.id);
          this.cargarGruposPublicos();
        }
        this.tabActiva.set('mis-grupos'); 
        this.notiService.triggerRefresh(); 
      }
    });
  }

  seleccionarGrupo(grupo: any): void {
    this.mensajes.set([]);
    this.estaBloqueado.set(grupo.rol === 'bloqueado');
    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) this.chatSocketService.salirDeGrupo(grupoAnterior.id);

    this.grupoSeleccionado.set(grupo);
    if (!this.estaBloqueado()) {
      const user = this.authService.currentUser();
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id); 
    }
    this.cargarMensajes(grupo.id);
  }

  cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    this.mensajeService.getHistorialGrupo(grupoId).subscribe((data: any[]) => {
      this.mensajes.set(data.map(m => ({ 
        ...m, 
        esMio: m.emisorId === user?.id || m.emisor?.id === user?.id 
      })));
    });
  }

  enviarMensaje(): void {
    if (this.estaBloqueado()) return;
    const user = this.authService.currentUser();
    const msg = this.mensajeActual.trim();
    const grupo = this.grupoSeleccionado();
    if (msg && grupo && user?.id) {
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msg);
      this.mensajeActual = ''; 
    }
  }

  buscarPersona(termino: string) {
    this.busquedaPersonas.set(termino);
  }

  enviarMensajePrivado() {
    const msg = this.mensajePrivadoActual().trim();
    const persona = this.personaSeleccionada();
    const user = this.authService.currentUser();
    if (!msg || !persona || !user) return;

    this.chatSocketService.enviarMensajePrivado(user.id, persona.id, msg);
    this.historialMensajesPrivados.update(h => [...h, { esMio: true, contenido: msg }]);
    this.mensajePrivadoActual.set('');
  }

  toggleChat(): void { this.isOpen.update(v => !v); }
  volverAListado(): void {
    this.grupoSeleccionado.set(null);
    this.personaSeleccionada.set(null);
  }
}