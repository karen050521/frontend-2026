import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service'; // <-- 1. IMPORTAR NUEVO SERVICIO
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
// Cambiar la ruta hacia la ubicación real en shared/components
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
  private readonly chatSocketService = inject(ChatSocketService); // <-- 2. INYECTAR NUEVO SERVICIO
  
  private refreshSub?: Subscription; 
  private socketSub?: Subscription; // <-- Para controlar la escucha del socket

  private socketBloqueoSub?: Subscription; // 🚨 NUEVO: Para desuscribir el evento de bloqueo

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);

  protected estaBloqueado = signal<boolean>(false); // 🚨 NUEVO SIGNAL: Controla el estado de bloqueo

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

      // Solo añadimos el mensaje si corresponde al grupo que el usuario tiene abierto en pantalla
      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        
        // Mantenemos tu misma lógica exacta para saber si el mensaje es propio o de otro usuario
        const mensajeMapeado = {
          ...nuevoMensaje,
          esMio: nuevoMensaje.emisorId === user?.id || nuevoMensaje.emisor?.id === user?.id
        };

        // Verificamos si aplica el filtro de fechaUnion que programaste
        const fechaUnionStr = grupoActual?.fechaUnion;
        if (fechaUnionStr) {
          const fechaLimite = new Date(fechaUnionStr);
          const fechaMsg = new Date(nuevoMensaje.fechaEnvio);
          if (fechaMsg < fechaLimite) return; // Si es antiguo no se renderiza
        }

        // Actualizamos el signal concatenando el mensaje entrante en tiempo real
        this.mensajes.update(list => [...list, mensajeMapeado]);
      }
    });

    // 3. NUEVO: ESCUCHAR CREACIÓN DE GRUPOS REMOTOS (Para usuarios añadidos por otros)
    const socketGrupoSub = this.chatSocketService.escucharNuevosGrupos().subscribe((data: any) => {
      const user = this.authService.currentUser();
      
      // Si el servidor avisa que se creó un grupo y mi ID está en la lista de miembros...
      if (user && data.miembrosIds && data.miembrosIds.includes(user.id)) {
        console.log('Fuiste añadido a una nueva comunidad en tiempo real. Actualizando listas...');
        
        // Recargamos los signals en vivo para que aparezca el nuevo chat
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        
        // Disparamos opcionalmente tu servicio de notificaciones local por si afecta a otros componentes
        this.notiService.triggerRefresh();
      }
    });

  this.socketBloqueoSub = this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && Number(data.grupoId) === Number(grupoActual.id)) {
        this.estaBloqueado.set(true);
        this.mensajes.set([]); // Limpia la pantalla al ser bloqueado en tiempo real
      }
    });
  
}

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe(); // <-- Limpiamos suscripción al destruir el componente
    this.socketBloqueoSub?.unsubscribe(); 

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
    // Inspecciona este log en la consola del navegador al seleccionar un grupo
    console.log('Estructura completa del grupo seleccionado:', grupo);
    
    this.estaBloqueado.set(grupo.rol === 'bloqueado');

    // Si ya había un grupo seleccionado antes, salimos de su sala de sockets
    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) {
      this.chatSocketService.salirDeGrupo(grupoAnterior.id);
    }

    this.grupoSeleccionado.set(grupo);
    
    // 🚨 MODIFICACIÓN AQUÍ: Solo unirse a la sala de sockets si NO está bloqueado
    if (!this.estaBloqueado()) {
      const user = this.authService.currentUser();
      // Le enviamos el grupoId y tu personaId actual al servicio
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id); 
    }
    
    this.cargarMensajes(grupo.id);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      // Si cierra la burbuja, salimos de la sala del socket para ahorrar recursos
      const grupo = this.grupoSeleccionado();
      if (grupo) {
        this.chatSocketService.salirDeGrupo(grupo.id);
      }
      this.grupoSeleccionado.set(null);
    }
  }

  // Al presionar el botón "VOLVER A GRUPOS" en la UI
  volverAListado(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.chatSocketService.salirDeGrupo(grupo.id);
    }
    this.grupoSeleccionado.set(null);
  }

  cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    const grupoActual = this.grupoSeleccionado();

    this.mensajeService.getHistorialGrupo(grupoId).subscribe((data: any[]) => {
      
      if (this.estaBloqueado()) {
        this.mensajes.set([]);
        return;
      }
      
      const fechaUnionStr = grupoActual?.fechaUnion;
      let mensajesFiltrados = data;

      if (fechaUnionStr) {
        const fechaLimite = new Date(fechaUnionStr);
        mensajesFiltrados = data.filter(m => {
          const fechaMsg = new Date(m.fechaEnvio);
          return fechaMsg >= fechaLimite;
        });
      }

      this.mensajes.set(mensajesFiltrados.map(m => ({ 
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
      // <-- 5. ENVIAR A TRAVÉS DE WEBSOCKET EN VEZ DE HTTP
      // Ya no hacemos el .subscribe() de HTTP. El Gateway procesará todo, guardará en DB y nos lo regresará vía socket.
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msg);
      this.mensajeActual = ''; // Limpiamos el input de inmediato para una experiencia fluida
    }
  }
}