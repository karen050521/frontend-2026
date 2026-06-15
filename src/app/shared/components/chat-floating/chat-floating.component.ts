import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { PersonaService } from '../../../core/services/persona.service'; // 👈 Tu aporte
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
  private readonly personaService = inject(PersonaService); // 👈 Tu aporte
  
  private refreshSub?: Subscription; 
  private socketSub?: Subscription; 
  private socketBloqueoSub?: Subscription; 
  private socketAbandonoSub?: Subscription; 
  private confirmacionLecturaSub?: Subscription; // ✨ NUEVO: Para escuchar cuando lean tus mensajes

  protected isOpen = signal(false);
  // 👈 Tu aporte: Se añade 'personas' a las pestañas y a la lógica
  protected tabActiva = signal<'mis-grupos' | 'descubrir' | 'personas'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);

  protected estaBloqueado = signal<boolean>(false); 
  protected estaAbandonado = signal<boolean>(false); 

  // 👈 Tu aporte: Señales para la búsqueda de personas
  protected busquedaPersonas = signal('');
  protected personasEncontradas = signal<any[]>([]);
  protected personaSeleccionada = signal<any>(null);

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
    // 1. ESCUCHAR ACTUALIZACIONES LOCALES
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
      }
    });

    // 2. ESCUCHAR MENSAJES
    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMensaje: any) => {
      const grupoActual = this.grupoSeleccionado();
      const user = this.authService.currentUser();

      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        const esMio = nuevoMensaje.emisorId === user?.id || nuevoMensaje.emisor?.id === user?.id;
        const mensajeMapeado = {
          ...nuevoMensaje,
          esMio: esMio
        };

        const fechaUnionStr = grupoActual?.fechaUnion;
        if (fechaUnionStr) {
          const fechaLimite = new Date(fechaUnionStr);
          const fechaMsg = new Date(nuevoMensaje.fechaEnvio);
          if (fechaMsg < fechaLimite) return;
        }

        this.mensajes.update(list => [...list, mensajeMapeado]);

        // ✨ NUEVO: Si tienes el chat abierto y no es tu mensaje, le avisas al backend que lo leíste
        if (!esMio && this.isOpen()) {
          this.chatSocketService.emitirMensajeLeido(nuevoMensaje.id, nuevoMensaje.emisorId);
        }
      }
    });

    // 3. NUEVOS GRUPOS
    this.chatSocketService.escucharNuevosGrupos().subscribe((data: any) => {
      const user = this.authService.currentUser();
      if (user && data.miembrosIds && data.miembrosIds.includes(user.id)) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.notiService.triggerRefresh();
      }
    });

    // 4. BLOQUEOS
    this.socketBloqueoSub = this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && Number(data.grupoId) === Number(grupoActual.id)) {
        this.estaBloqueado.set(true);
        this.mensajes.set([]); 
      }
    });

    // 5. ABANDONOS
    this.socketAbandonoSub = this.chatSocketService.escucharUsuarioAbandono().subscribe((data: any) => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.notiService.triggerRefresh();
      }
    });

    // 6. ✨ NUEVO: ESCUCHAR CUANDO ALGUIEN LEE TU MENSAJE PARA PINTAR EL CHECK
    this.confirmacionLecturaSub = this.chatSocketService.escucharConfirmacionLectura().subscribe((data: any) => {
      this.mensajes.update(list => list.map(m => 
        m.id === data.mensajeId ? { ...m, leidoAt: data.leidoAt } : m
      ));
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe(); 
    this.socketBloqueoSub?.unsubscribe(); 
    this.socketAbandonoSub?.unsubscribe();
    this.confirmacionLecturaSub?.unsubscribe(); // Limpiar nueva suscripción

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

  // 👈 Tu aporte: Búsqueda de personas integrando tu lógica
  buscarPersona(termino: string) {
    this.busquedaPersonas.set(termino);
    if (termino.length > 2) {
      const userId = this.authService.currentUser()?.id;
      this.personaService.buscar(termino, userId).subscribe({
        next: (res: any[]) => this.personasEncontradas.set(res),
        error: (err: any) => console.error('Error:', err)
      });
    } else {
      this.personasEncontradas.set([]);
    }
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
    this.personaSeleccionada.set(null); // Limpiar persona si selecciona grupo
    this.estaBloqueado.set(grupo.rol === 'bloqueado');
    this.estaAbandonado.set(grupo.rol === 'abandonado'); 

    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) {
      this.chatSocketService.salirDeGrupo(grupoAnterior.id);
    }

    this.grupoSeleccionado.set(grupo);
    
    if (!this.estaBloqueado() && (!this.estaAbandonado() || grupo.rol === 'administrador')) {
      const user = this.authService.currentUser();
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id); 
    }
    
    this.cargarMensajes(grupo.id);
  }

  // 👈 Tu aporte: Seleccionar a una persona
  seleccionarPersona(persona: any): void { 
    this.grupoSeleccionado.set(null); // Limpiar grupo
    this.personaSeleccionada.set(persona);
    this.mensajes.set([]); // Limpiamos mensajes hasta que conectemos HU-ENTR-3-004
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      const grupo = this.grupoSeleccionado();
      if (grupo) this.chatSocketService.salirDeGrupo(grupo.id);
      this.grupoSeleccionado.set(null);
      this.personaSeleccionada.set(null); // Limpiar al cerrar
    }
  }

  volverAListado(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.chatSocketService.salirDeGrupo(grupo.id);
    }
    this.grupoSeleccionado.set(null);
    this.personaSeleccionada.set(null); // 👈 Añadido para que vuelva al listado
  }

  abandonarGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    const user = this.authService.currentUser();
    if (!grupo || !user?.id) return;

    const seguro = confirm(`¿Estás seguro de que deseas abandonar el grupo "${grupo.nombre}"?`);
    if (seguro) {
      this.grupoService.abandonarGrupo(grupo.id).subscribe({
        next: () => {
          this.chatSocketService.salirDeGrupo(grupo.id);
          this.estaAbandonado.set(true);
          this.grupoSeleccionado.update(g => g ? { ...g, rol: 'abandonado' } : null);
          this.cargarMisGrupos(user.id);
          this.cargarGruposPublicos();
          this.notiService.triggerRefresh();
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
        this.estaAbandonado.set(false);
        this.grupoSeleccionado.update(g => g ? { ...g, rol: 'miembro' } : null);
        this.chatSocketService.unirseAGrupo(grupo.id, user.id);
        this.cargarMisGrupos(user.id);
        this.cargarGruposPublicos();
        this.cargarMensajes(grupo.id);
        this.notiService.triggerRefresh();
      }
    });
  }

  cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    const personaId = user?.id; 

    this.mensajeService.getHistorialGrupo(grupoId, personaId).subscribe((data: any[]) => {
      if (this.estaBloqueado()) {
        this.mensajes.set([]);
        return;
      }
      
      const mensajesMapeados = data.map(m => {
        const esMio = m.emisorId === user?.id || m.emisor?.id === user?.id;
        
        // ✨ NUEVO: Si cargo el historial y encuentro mensajes ajenos que no han sido leídos, marco como leídos.
        if (!esMio && !m.leidoAt && !this.estaAbandonado()) {
          setTimeout(() => {
            this.chatSocketService.emitirMensajeLeido(m.id, m.emisorId);
          }, 50);
        }

        return { ...m, esMio };
      });

      this.mensajes.set(mensajesMapeados);
    });
  }

  enviarMensaje(): void {
    if (this.estaBloqueado() || this.estaAbandonado()) return;
    const user = this.authService.currentUser();
    const msg = this.mensajeActual.trim();
    
    // Si estamos en un grupo...
    const grupo = this.grupoSeleccionado();
    if (msg && grupo && user?.id) {
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msg);
      this.mensajeActual = ''; 
      return;
    }

    // TODO: Si estamos enviando a una persona (HU-ENTR-3-004), lo configuraremos luego.
    const persona = this.personaSeleccionada();
    if (msg && persona && user?.id) {
      console.log('Mensaje directo pendiente de implementar conexión WebSocket:', msg);
      this.mensajeActual = ''; 
    }
  }
}