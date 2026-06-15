import { Component, signal, inject, effect, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { PersonaService } from '../../../core/services/persona.service'; 
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
  private readonly personaService = inject(PersonaService); 
  
  private refreshSub?: Subscription; 
  private socketSub?: Subscription; 
  private confirmacionLecturaSub?: Subscription; 
  private socketPrivadoSub?: Subscription; 

  protected isOpen = signal(false);
  protected tabActiva = signal<'mis-grupos' | 'descubrir' | 'personas'>('mis-grupos');
  protected filtroBusqueda = signal('');
  protected mensajeActual = ''; 
  
  protected grupos = signal<any[]>([]); 
  protected gruposPublicos = signal<any[]>([]); 
  protected grupoSeleccionado = signal<any>(null);
  protected mensajes = signal<any[]>([]);

  // 🛡️ Conservamos tus estados de seguridad intactos
  protected estaBloqueado = signal<boolean>(false); 
  protected estaAbandonado = signal<boolean>(false); 

  // variables HU-ENTR-3-004 (Mensaje Directo e Ubicación)
  protected busquedaPersonas = signal('');
  protected personasEncontradas = signal<any[]>([]);
  protected personaSeleccionada = signal<any>(null);
  protected ubicacionAdjunta = signal<{ lat: number; lng: number } | null>(null);

  // variables HU-ENTR-3-005 (Multi-selección para Conductores)
  protected gruposSeleccionadosMulti = signal<number[]>([]); 
  protected modoDifusionMulti = signal<boolean>(false);

  protected readonly srvUrl = environment.apiNestUrl;
  protected isAdminModalOpen = signal(false);

  // 🔐 CONTROL DE ROLES ALINEADO A TU DASHBOARD
  protected userRole = computed(() => {
    const role = this.authService.activeRole() || localStorage.getItem('user_role') || '';
    return role.toLowerCase().trim();
  });

  protected isCitizen = computed(() => {
    const role = this.userRole();
    return role.includes('ciudadano') || role === '';
  });

  protected isConductor = computed(() => {
    const role = this.userRole();
    return role.includes('conductor');
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        if (this.isCitizen()) {
          this.cargarGruposPublicos();
        }
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();

    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        if (this.isCitizen()) this.cargarGruposPublicos();
      }
    });

    // Escuchar mensajes de grupos comunes
    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMensaje: any) => {
      const grupoActual = this.grupoSeleccionado();
      if (grupoActual && nuevoMensaje.grupoId === grupoActual.id) {
        const esMio = nuevoMensaje.emisorId === user?.id || nuevoMensaje.emisor?.id === user?.id;
        this.mensajes.update(list => [...list, { ...nuevoMensaje, esMio }]);

        if (!esMio && this.isOpen() && !this.estaAbandonado()) {
          this.chatSocketService.emitirMensajeLeido(nuevoMensaje.id, nuevoMensaje.emisorId);
        }
      }
    });

    // ✅ SOLUCIÓN AL ERROR TS2551: Usamos el método en plural correcto
    this.socketPrivadoSub = this.chatSocketService.escucharMensajesPrivados().subscribe((nuevoMsg: any) => {
      const personaActual = this.personaSeleccionada();
      if (personaActual && (nuevoMsg.emisorId === personaActual.id || nuevoMsg.receptorId === personaActual.id)) {
        const esMio = nuevoMsg.emisorId === user?.id;
        this.mensajes.update(list => [...list, { ...nuevoMsg, esMio }]);

        if (!esMio && this.isOpen()) {
          this.chatSocketService.emitirMensajeLeido(nuevoMsg.id, nuevoMsg.emisorId);
        }
      }
    });

    // Confirmación de marcas de lectura (Doble check)
    this.confirmacionLecturaSub = this.chatSocketService.escucharConfirmacionLectura().subscribe((data: any) => {
      this.mensajes.update(list => list.map(m => 
        m.id === data.mensajeId ? { ...m, leidoAt: data.leidoAt } : m
      ));
    });

    // Escuchar bloqueos en vivo
    this.chatSocketService.escucharUsuarioBloqueado().subscribe((data: any) => {
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
    this.confirmacionLecturaSub?.unsubscribe();
    this.socketPrivadoSub?.unsubscribe();
    const grupo = this.grupoSeleccionado();
    if (grupo) this.chatSocketService.salirDeGrupo(grupo.id);
  }

  cargarMisGrupos(userId: string): void {
    this.grupoService.getGruposPorPersona(userId).subscribe(data => this.grupos.set(data));
  }

  cargarGruposPublicos(): void {
    this.grupoService.getPublicosDisponibles().subscribe(data => this.gruposPublicos.set(data));
  }

  buscarPersona(termino: string) {
    this.busquedaPersonas.set(termino);
    if (termino.length > 2) {
      const userId = this.authService.currentUser()?.id;
      this.personaService.buscar(termino, userId).subscribe({
        next: (res: any[]) => this.personasEncontradas.set(res),
        error: (err: any) => console.error(err)
      });
    } else {
      this.personasEncontradas.set([]);
    }
  }

  get gruposFiltrados() {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.tabActiva() === 'mis-grupos' ? this.grupos() : this.gruposPublicos();
    if (!busqueda) return lista;
    return lista.filter(g => g.nombre?.toLowerCase().includes(busqueda));
  }

  // HU-ENTR-3-004: Captura de coordenadas GPS opcional
  adjuntarUbicacion(): void {
    if (this.ubicacionAdjunta()) {
      this.ubicacionAdjunta.set(null);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.ubicacionAdjunta.set({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    }
  }

  seleccionarGrupo(grupo: any): void {
    this.personaSeleccionada.set(null);
    this.modoDifusionMulti.set(false);
    this.estaBloqueado.set(grupo.rol === 'bloqueado');
    this.estaAbandonado.set(grupo.rol === 'abandonado');

    const grupoAnterior = this.grupoSeleccionado();
    if (grupoAnterior) this.chatSocketService.salirDeGrupo(grupoAnterior.id);

    this.grupoSeleccionado.set(grupo);
    const user = this.authService.currentUser();
    if (!this.estaBloqueado() && !this.estaAbandonado()) {
      this.chatSocketService.unirseAGrupo(grupo.id, user?.id);
    }
    this.cargarMensajes(grupo.id);
  }

  seleccionarPersona(persona: any): void {
    this.grupoSeleccionado.set(null);
    this.modoDifusionMulti.set(false);
    this.personaSeleccionada.set(persona);
    this.mensajes.set([]);

    const user = this.authService.currentUser();
    if (!user?.id) return;

    // Conectado exitosamente con MensajeService corregido
    this.mensajeService.getHistorialPrivado(user.id, persona.id).subscribe((data: any[]) => {
      this.mensajes.set(data.map(m => {
        const esMio = m.emisorId === user.id;
        if (!esMio && !m.leidoAt) {
          this.chatSocketService.emitirMensajeLeido(m.id, m.emisorId);
        }
        return { ...m, esMio };
      }));
    });
  }

  // HU-ENTR-3-005: Marcar/desmarcar grupos en la difusion
  toggleSeleccionGrupoMulti(grupoId: number): void {
    const actuales = this.gruposSeleccionadosMulti();
    if (actuales.includes(grupoId)) {
      this.gruposSeleccionadosMulti.set(actuales.filter(id => id !== grupoId));
    } else {
      this.gruposSeleccionadosMulti.set([...actuales, grupoId]);
    }
  }

  enviarMensaje(): void {
    const user = this.authService.currentUser();
    let msg = this.mensajeActual.trim();
    if (!user?.id || (!msg && !this.ubicacionAdjunta())) return;

    if (this.ubicacionAdjunta()) {
      const loc = this.ubicacionAdjunta();
      msg += `\n\n📍 Ubicación compartida: https://maps.google.com/?q=${loc?.lat},${loc?.lng}`;
    }

    // Caso A: Difusión Multi-grupo para Conductores (HU-ENTR-3-005)
    if (this.modoDifusionMulti() && this.gruposSeleccionadosMulti().length > 0) {
      this.gruposSeleccionadosMulti().forEach(gId => {
        this.chatSocketService.enviarMensaje(user.id, gId, `[AVISO DE RUTA] ${msg}`);
      });
      this.limpiarCajaTexto();
      this.volverAListado();
      return;
    }

    // Caso B: Chat de grupo regular
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      if (this.estaBloqueado() || this.estaAbandonado()) return;
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msg);
      this.limpiarCajaTexto();
      return;
    }

    // Caso C: Mensaje directo individual (HU-ENTR-3-004)
    const persona = this.personaSeleccionada();
    if (persona) {
      this.chatSocketService.enviarMensajePrivado(user.id, persona.id, msg);
      this.limpiarCajaTexto();
    }
  }

  abandonarGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.grupoService.abandonarGrupo(grupo.id).subscribe({
        next: () => {
          this.estaAbandonado.set(true);
          const user = this.authService.currentUser();
          if (user) this.cargarMisGrupos(user.id);
          this.volverAListado();
        }
      });
    }
  }

  reunirseAlGrupoActual(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      this.grupoService.unirseAGrupo(grupo.id).subscribe({
        next: () => {
          this.estaAbandonado.set(false);
          const user = this.authService.currentUser();
          if (user) {
            this.cargarMisGrupos(user.id);
            this.chatSocketService.unirseAGrupo(grupo.id, user.id);
          }
          this.cargarMensajes(grupo.id);
        }
      });
    }
  }

  limpiarCajaTexto(): void {
    this.mensajeActual = '';
    this.ubicacionAdjunta.set(null);
  }

  volverAListado(): void {
    const grupo = this.grupoSeleccionado();
    if (grupo) this.chatSocketService.salirDeGrupo(grupo.id);
    this.grupoSeleccionado.set(null);
    this.personaSeleccionada.set(null);
    this.modoDifusionMulti.set(false);
    this.gruposSeleccionadosMulti.set([]);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) this.volverAListado();
  }

  cargarMensajes(grupoId: number): void {
    const user = this.authService.currentUser();
    this.mensajeService.getHistorialGrupo(grupoId, user?.id).subscribe((data: any[]) => {
      if (this.estaBloqueado()) {
        this.mensajes.set([]);
        return;
      }
      this.mensajes.set(data.map(m => {
        const esMio = m.emisorId === user?.id || m.emisor?.id === user?.id;
        if (!esMio && !m.leidoAt && !this.estaAbandonado()) {
          setTimeout(() => {
            this.chatSocketService.emitirMensajeLeido(m.id, m.emisorId);
          }, 50);
        }
        return { ...m, esMio };
      }));
    });
  }

  unirseAGrupo(grupoId: number): void {
    this.grupoService.unirseAGrupo(grupoId).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) this.cargarMisGrupos(user.id);
        this.tabActiva.set('mis-grupos');
      }
    });
  }
}