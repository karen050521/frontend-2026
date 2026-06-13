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
  private socketBloqueoSub?: Subscription; 
  private socketAbandonoSub?: Subscription; // 🚨 NUEVO: Para desuscribir eventos de abandono remoto

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);

  protected estaBloqueado = signal<boolean>(false); 
  protected estaAbandonado = signal<boolean>(false); // 🚨 CONTROL REACTIVO: Evita el efecto espejo del rol

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

  ngOnInit(): void {
    // 1. ESCUCHAR EL SUBJECT LOCAL (Campana / Actualizaciones del mismo usuario)
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
      }
    });

    // 2. ESCUCHAR LOS MENSAJES QUE LLEGAN POR EL WEBSOCKET (Chat en vivo)
    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMensaje: any) => {
      const grupoActual = this.grupoSeleccionado();
      const user = this.authService.currentUser();

      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        const mensajeMapeado = {
          ...nuevoMensaje,
          esMio: nuevoMensaje.emisorId === user?.id || nuevoMensaje.emisor?.id === user?.id
        };

        const fechaUnionStr = grupoActual?.fechaUnion;
        if (fechaUnionStr) {
          const fechaLimite = new Date(fechaUnionStr);
          const fechaMsg = new Date(nuevoMensaje.fechaEnvio);
          if (fechaMsg < fechaLimite) return;
        }

        this.mensajes.update(list => [...list, mensajeMapeado]);
      }
    });

    // 3. ESCUCHAR CREACIÓN DE GRUPOS REMOTOS
    const socketGrupoSub = this.chatSocketService.escucharNuevosGrupos().subscribe((data: any) => {
      const user = this.authService.currentUser();
      if (user && data.miembrosIds && data.miembrosIds.includes(user.id)) {
        console.log('Fuiste añadido a una nueva comunidad en tiempo real. Actualizando listas...');
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.notiService.triggerRefresh();
      }
    });

    // 4. ESCUCHAR BLOQUEOS EN TIEMPO REAL
    this.socketBloqueoSub = this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && Number(data.grupoId) === Number(grupoActual.id)) {
        this.estaBloqueado.set(true);
        this.mensajes.set([]); 
      }
    });

    // 5. ⚡ NUEVO: ESCUCHAR ABANDONOS EN TIEMPO REAL (Para actualizar contadores si eres admin/miembro)
    this.socketAbandonoSub = this.chatSocketService.escucharUsuarioAbandono().subscribe((data: any) => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();

        this.notiService.triggerRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe(); 
    this.socketBloqueoSub?.unsubscribe(); 
    this.socketAbandonoSub?.unsubscribe();

    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.chatSocketService.salirDeGrupo(grupo.id);
    }
  }

  cargarMisGrupos(userId: string): void {
    this.grupoService.getGruposPorPersona(userId).subscribe(data => this.grupos.set(data));
  }

  cargarGruposPublicos(): void {
    this.grupoService.getPublicosDisponibles().subscribe(data => this.gruposPublicos.set(data));
  }

  get gruposFiltrados() {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.tabActiva() === 'mis-grupos' ? this.grupos() : this.gruposPublicos();
    
    if (!busqueda) return lista;

    return lista.filter(g => 
      (g.nombre && g.nombre.toLowerCase().includes(busqueda)) || 
      (g.descripcion && g.descripcion.toLowerCase().includes(busqueda))
    );
  }

  unirseAGrupo(grupoId: number): void {
    this.grupoService.unirseAGrupo(grupoId).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.tabActiva.set('mis-grupos'); 
        this.notiService.triggerRefresh(); 
      }
    });
  }

seleccionarGrupo(grupo: any): void {
    console.log('Estructura completa del grupo seleccionado:', grupo);
    
    // Sincronizar estados locales de forma estricta para el HTML
    this.estaBloqueado.set(grupo.rol === 'bloqueado');
    this.estaAbandonado.set(grupo.rol === 'abandonado'); 

    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) {
      this.chatSocketService.salirDeGrupo(grupoAnterior.id);
    }

    this.grupoSeleccionado.set(grupo);
    
    // MODIFICACIÓN AQUÍ: Si no está bloqueado, permitimos que se conecte si es un miembro activo
    // O si su rol en la base de datos es 'administrador' (así el admin siempre escucha los eventos en vivo).
    if (!this.estaBloqueado() && (!this.estaAbandonado() || grupo.rol === 'administrador')) {
      const user = this.authService.currentUser();
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id); 
    }
    
    this.cargarMensajes(grupo.id);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      const grupo = this.grupoSeleccionado();
      if (grupo) {
        this.chatSocketService.salirDeGrupo(grupo.id);
      }
      this.grupoSeleccionado.set(null);
    }
  }

  volverAListado(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.chatSocketService.salirDeGrupo(grupo.id);
    }
    this.grupoSeleccionado.set(null);
  }

  abandonarGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    const user = this.authService.currentUser();
    
    if (!grupo || !user?.id) return;

    const seguro = confirm(`¿Estás seguro de que deseas abandonar el grupo "${grupo.nombre}"? Conservarás tu historial de mensajes.`);
    
    if (seguro) {
      this.grupoService.abandonarGrupo(grupo.id).subscribe({
        next: () => {
          alert('Has abandonado el grupo correctamente.');
          
          // 1. Cortar canal en vivo inmediatamente
          this.chatSocketService.salirDeGrupo(grupo.id);
          
          // 2. Mudar estados visuales para congelar UI
          this.estaAbandonado.set(true);
          this.grupoSeleccionado.update(g => g ? { ...g, rol: 'abandonado' } : null);
          
          // 3. Refrescar listas por debajo
          this.cargarMisGrupos(user.id);
          this.cargarGruposPublicos();
          this.notiService.triggerRefresh();
        },
        error: (err) => {
          alert(err.error?.message || 'Hubo un error al intentar abandonar el grupo.');
        }
      });
    }
  }

  reunirseAlGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    const user = this.authService.currentUser();
    if (!grupo || !user?.id) return;

    this.grupoService.unirseAGrupo(grupo.id).subscribe({
      next: () => {
        alert('Te has unido nuevamente al grupo.');
        
        this.estaAbandonado.set(false);
        this.grupoSeleccionado.update(g => g ? { ...g, rol: 'miembro' } : null);
        
        this.chatSocketService.unirseAGrupo(grupo.id, user.id);
        
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.cargarMensajes(grupo.id);
        this.notiService.triggerRefresh();
      },
      error: (err) => {
        alert(err.error?.message || 'Hubo un error al intentar unirse al grupo.');
      }
    });
  }

cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    
    // 1. 🚀 PASO CLAVE: Capturamos el ID del usuario logueado
    const personaId = user?.id; 

    // 2. Pasamos el personaId como segundo parámetro al servicio para corregir el 'undefined'
    this.mensajeService.getHistorialGrupo(grupoId, personaId).subscribe((data: any[]) => {
      if (this.estaBloqueado()) {
        this.mensajes.set([]);
        return;
      }
      
      // 3. 🚨 REMOVEMOS el filtro manual de 'fechaUnion' que borraba el chat viejo.
      // El backend ya hace el filtrado perfecto y seguro con la base de datos, 
      // así que mapeamos directamente la respuesta del servidor.
      this.mensajes.set(data.map(m => ({ 
        ...m, 
        esMio: m.emisorId === user?.id || m.emisor?.id === user?.id 
      })));
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
}