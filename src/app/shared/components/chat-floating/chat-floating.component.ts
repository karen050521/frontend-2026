import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service'; // 1. IMPORTAR

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-floating.component.html',
  styleUrl: './chat-floating.component.css'
})
export class ChatFloatingComponent {
  private readonly authService = inject(AuthService);
  private readonly mensajeService = inject(MensajeService);
  private readonly grupoService = inject(GrupoService);
  private readonly notiService = inject(NotificacionService); // 2. INYECTAR
  private refreshSub?: any; // Para guardar la suscripción

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);

constructor() {
  // Mantené tu efecto original tal cual para el login
  effect(() => {
    const user = this.authService.currentUser();
    if (user && user.id) {
      this.cargarMisGrupos(user.id);
      this.cargarGruposPublicos();
    }
  });
}

ngOnInit(): void {
  // 2. ESCUCHAR EL SUBJECT: Aquí es donde arreglamos que salga el grupo nuevo
  this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
    const user = this.authService.currentUser();
    if (user && user.id) {
      this.cargarMisGrupos(user.id);
      this.cargarGruposPublicos();
    }
  });
}

// 3. Limpiar al destruir para que no se dupliquen procesos
ngOnDestroy(): void {
  this.refreshSub?.unsubscribe();
}

  cargarMisGrupos(userId: string): void {
    this.grupoService.getGruposPorPersona(userId).subscribe(data => this.grupos.set(data));
  }

  cargarGruposPublicos(): void {
    this.grupoService.getPublicosDisponibles().subscribe(data => this.gruposPublicos.set(data));
  }

// Filtrar grupos en tiempo real según el buscador (Nombre o Descripción)
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

        // 3. LLAMAR A LA NOTIFICACIÓN AQUÍ
        this.notiService.triggerRefresh(); 
      }
    });
  }

  seleccionarGrupo(grupo: any): void {
    this.grupoSeleccionado.set(grupo);
    this.cargarMensajes(grupo.id);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) this.grupoSeleccionado.set(null);
  }

cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    const grupoActual = this.grupoSeleccionado();

    this.mensajeService.getHistorialGrupo(grupoId).subscribe((data: any[]) => {
      const fechaUnionStr = grupoActual?.fechaUnion;
      let mensajesFiltrados = data;

      if (fechaUnionStr) {
        const fechaLimite = new Date(fechaUnionStr);
        
        mensajesFiltrados = data.filter(m => {
          // Usamos fechaEnvio que es el nombre real de tu entidad Mensaje
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
    const user = this.authService.currentUser();
    const msg = this.mensajeActual.trim();
    const grupo = this.grupoSeleccionado();
    if (msg && grupo && user?.id) {
      this.mensajeService.enviarMensajeGrupo(user.id, grupo.id, msg).subscribe(() => {
        this.mensajeActual = '';
        this.cargarMensajes(grupo.id);
      });
    }
  }
}