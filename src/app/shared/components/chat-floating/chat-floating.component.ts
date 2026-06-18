import { Component, signal, inject, effect, OnInit, OnDestroy, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { GrupoService } from '../../../core/services/grupo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ChatSocketService } from '../../../core/services/chat-socket.service';
import { PersonaService } from '../../../core/services/persona.service';
import { ToastService } from '../../../core/services/toast.service';
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
  private readonly toastService = inject(ToastService);
  private socketExpulsadoSub?: Subscription;

  private refreshSub?: Subscription;
  private socketSub?: Subscription;
  private confirmacionLecturaSub?: Subscription;
  private socketPrivadoSub?: Subscription;
  // ✨ HU-ENTR-3-004: evita re-identificar en cada corrida del effect.
  private usuarioIdentificado = false;
  // Contenedor scrollable de la conversación; para auto-scroll al fondo.
  private readonly mensajesContainer = viewChild<ElementRef<HTMLDivElement>>('mensajesContainer');

  protected isOpen = signal(false);
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

  // Actualizamos el tipo de tabActiva para incluir 'bandeja'
  protected tabActiva = signal<'mis-grupos' | 'descubrir' | 'personas' | 'bandeja'>('bandeja'); // Ponemos 'bandeja' por defecto o la que prefieras
  
 // ✨ NUEVAS SEÑALES PARA LA HU-ENTR-3-007
  protected mensajesBandeja = signal<any[]>([]);
  protected cargandoBandeja = signal<boolean>(false);

  // 👈 NUEVO: El contador ahora depende exclusivamente de los puntos rosa activos del Front-end
  protected contadorNoLeidosGlobal = computed(() => {
    return this.mensajesBandeja().filter(msg => !msg.leido).length;
  });

  protected mensajeRespondidoId = signal<number | null>(null);
  protected respuestaDirectaTexto = signal<string>('');
  
  // Filtros interactivos
  protected filtroTipoBandeja = signal<'todos' | 'individual' | 'grupal'>('todos');
  protected filtroEstadoBandeja = signal<'todos' | 'leidos' | 'no_leidos'>('todos');
  protected filtroFechaBandeja = signal<string>('');
  
  
  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        // ✨ HU-ENTR-3-004: unir el socket a su sala personal 'user_{id}' apenas
        // hay usuario. chat-floating se monta global en app.html, así que esto
        // cubre a TODO autenticado (emisor y receptor) sin depender de Monitoreo.
        // Sin esto, el DM en tiempo real y el doble-check del emisor quedan mudos.
        if (!this.usuarioIdentificado) {
          this.chatSocketService.identificarUsuario(user.id);
          this.usuarioIdentificado = true;
        }
        this.cargarMisGrupos(user.id);
        if (this.isCitizen()) {
          this.cargarGruposPublicos();
        }
      }
    });

    // 2. NUEVO EFECTO SEPARADO: Se dispara automáticamente cuando cambia 
    // la pestaña activa o los filtros de la bandeja
    effect(() => {
      const user = this.authService.currentUser();
      this.grupos();
      if (user && user.id && this.tabActiva() === 'bandeja') {
        this.cargarBandejaDeEntrada(user.id);
      }
    });

    // Auto-scroll al fondo cada vez que cambia la lista de mensajes
    // (envío, recepción en tiempo real o carga de historial).
    effect(() => {
      this.mensajes(); // dependencia reactiva
      this.scrollAlFondo();
    });

  }

  private scrollAlFondo(): void {
    // Espera al render del nuevo mensaje antes de medir scrollHeight.
    setTimeout(() => {
      const el = this.mensajesContainer()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

ngOnInit(): void {
    // ⚠️ NO capturar el usuario aquí: en el arranque (re-login tras reiniciar)
    // currentUser() puede ser null y el closure quedaría con user=null para
    // siempre → esMio=false (burbuja gris, sin ✓✓). Leerlo FRESCO en cada
    // callback, igual que seleccionarPersona y el listener de expulsión.
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.cargarMisGrupos(user.id);
        if (this.isCitizen()) this.cargarGruposPublicos();
      }
    });

    // 🌟 ESCUCHAR MENSAJES GRUPALES EN TIEMPO REAL
    this.socketSub = this.chatSocketService.escucharMensajes().subscribe((nuevoMsg: any) => {
      const user = this.authService.currentUser();
      const grupoActual = this.grupoSeleccionado();
      const misGruposIds = this.grupos().map(g => Number(g.id));
      
      // 🛡️ FILTRO CRÍTICO: Si el mensaje es de un grupo que ya abandoné (no está en misGruposIds), lo ignoro
      if (!misGruposIds.includes(Number(nuevoMsg.grupoId))) {
        return;
      }

      if (grupoActual && Number(nuevoMsg.grupoId) === Number(grupoActual.id)) {
        const esMio = nuevoMsg.emisorId === user?.id || nuevoMsg.emisor?.id === user?.id;

        const yaExiste = this.mensajes().some(m => m.id === nuevoMsg.id);
        if (!yaExiste) {
          this.mensajes.update(list => [...list, { ...nuevoMsg, esMio }]);
        }

        if (!esMio && this.isOpen() && !this.estaAbandonado()) {
          this.chatSocketService.emitirMensajeLeido(nuevoMsg.id, nuevoMsg.emisorId);
        }
      }
    });

    // Escuchar mensajes privados
    this.socketPrivadoSub = this.chatSocketService.escucharMensajesPrivados().subscribe((nuevoMsg: any) => {
      const user = this.authService.currentUser();
      const personaActual = this.personaSeleccionada();
      if (personaActual && (nuevoMsg.emisorId === personaActual.id || nuevoMsg.receptorId === personaActual.id)) {
        const esMio = nuevoMsg.emisorId === user?.id;

        const yaExiste = this.mensajes().some(m => m.id === nuevoMsg.id);
        if (!yaExiste) {
          this.mensajes.update(list => [...list, { ...nuevoMsg, esMio }]);
        }

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

    // Escuchar cuando el usuario es removido/expulsado de un grupo
    this.socketExpulsadoSub = this.chatSocketService.escucharUsuarioAbandono().subscribe((data: any) => {
      const grupoActual = this.grupoSeleccionado();
      const miUsuarioId = this.authService.currentUser()?.id;
      
      if (data.personaId === miUsuarioId && grupoActual && Number(data.grupoId) === Number(grupoActual.id)) {
        alert(`Fuiste removido del grupo "${grupoActual.nombre}" por un administrador.`);
        this.estaAbandonado.set(true);
        this.mensajes.set([]);
        if (miUsuarioId) this.cargarMisGrupos(miUsuarioId);
        this.volverAListado();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.socketSub?.unsubscribe(); 
    this.confirmacionLecturaSub?.unsubscribe();
    this.socketPrivadoSub?.unsubscribe();
    this.socketExpulsadoSub?.unsubscribe();
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

  // CÓMO DEBE QUEDAR AHORA:
  get gruposFiltrados() {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.tabActiva() === 'mis-grupos' ? this.grupos() : this.gruposPublicos();
    if (!busqueda) return lista;
    
    // Aquí le devolvemos la búsqueda por descripción
    return lista.filter(g => 
      g.nombre?.toLowerCase().includes(busqueda) || 
      g.descripcion?.toLowerCase().includes(busqueda)
    );
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
    const texto = this.mensajeActual.trim();
    const loc = this.ubicacionAdjunta();
    if (!user?.id || (!texto && !loc)) return;

    // Para grupos/difusión NO hay columna de ubicación, así que la adjuntamos
    // como texto (comportamiento previo). El DM sí la manda estructurada.
    let msgGrupo = texto;
    if (loc) {
      msgGrupo += `\n\n📍 Ubicación compartida: https://maps.google.com/?q=${loc.lat},${loc.lng}`;
    }

    // Caso A: Difusión Multi-grupo para Conductores (HU-ENTR-3-005)
    if (this.modoDifusionMulti() && this.gruposSeleccionadosMulti().length > 0) {
      this.gruposSeleccionadosMulti().forEach(gId => {
        this.chatSocketService.enviarMensaje(user.id, gId, `[AVISO DE RUTA] ${msgGrupo}`);
      });
      this.limpiarCajaTexto();
      this.volverAListado();
      return;
    }

    // Caso B: Chat de grupo regular
    const grupo = this.grupoSeleccionado();
    if (grupo) {
      if (this.estaBloqueado() || this.estaAbandonado()) return;

      const mensajeLocal = {
        id: Date.now(),
        contenido: msgGrupo,
        emisorId: user.id,
        emisorNombre: (user as any).nombre || 'Yo',
        fechaEnvio: new Date(),
        esMio: true,
        leidoAt: null
      };
      this.mensajes.update(list => [...list, mensajeLocal]);
      this.chatSocketService.enviarMensaje(user.id, grupo.id, msgGrupo);
      this.limpiarCajaTexto();
      return;
    }

    // Caso C: Mensaje directo individual (HU-ENTR-3-004).
    // Enviamos texto puro + ubicación estructurada. NO añadimos un mensaje
    // optimista: el gateway hace echo de 'recibirMensajePrivado' al emisor con
    // el id REAL persistido (necesario para que el doble-check ✓✓ funcione).
    const persona = this.personaSeleccionada();
    if (persona) {
      this.chatSocketService.enviarMensajePrivado(user.id, persona.id, texto, loc);
      this.limpiarCajaTexto();
    }
  }


// ✨ HU-ENTR-3-004: parsea Mensaje.ubicacion (texto JSON {lat,lng})
protected parseUbicacion(m: any): { lat: number; lng: number } | null {
  if (!m?.ubicacion) return null;
  try {
    const u = typeof m.ubicacion === 'string'
      ? JSON.parse(m.ubicacion)
      : m.ubicacion;

    const lat = Number(u?.lat);
    const lng = Number(u?.lng);

    return Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : null;
  } catch {
    return null;
  }
}

abandonarGrupoActual(): void {
  const confirmar = window.confirm('¿Estás seguro de que deseas abandonar este grupo?');
  if (!confirmar) return;

  const grupo = this.grupoSeleccionado();
  if (grupo) {
    this.grupoService.abandonarGrupo(grupo.id).subscribe({
      next: () => {
        window.alert('Has abandonado el grupo exitosamente.');

        this.chatSocketService.salirDeGrupo(grupo.id);

        this.estaAbandonado.set(true);
        this.mensajes.set([]);

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

  // ✨ NUEVO: Cargar Bandeja unificada con filtros de la HU-ENTR-3-007
// ✨ NUEVO: Cargar Bandeja unificada filtrando drásticamente grupos abandonados
  protected cargarBandejaDeEntrada(userId: string): void {
    this.cargandoBandeja.set(true);
    
    const filtros: any = {};
    if (this.filtroTipoBandeja() !== 'todos') filtros.tipo = this.filtroTipoBandeja();
    if (this.filtroEstadoBandeja() !== 'todos') filtros.estado = this.filtroEstadoBandeja();
    if (this.filtroFechaBandeja()) filtros.fecha = this.filtroFechaBandeja();

    this.mensajeService.getBandejaEntrada(userId, filtros).subscribe({
      next: (res) => {
        // 🛡️ OBTENEMOS LOS IDS DE LOS GRUPOS A LOS QUE SÍ PERTENECES ACTUALMENTE
        const misGruposIds = this.grupos().map(g => Number(g.id));

        // 🚀 FILTRO RADICAL: Si el mensaje es de tipo 'grupal', obligatoriamente el grupoId debe estar en tus grupos activos
        const mensajesFiltrados = res.mensajes.filter((msg: any) => {
          if (msg.tipo === 'grupal') {
            return misGruposIds.includes(Number(msg.grupoId));
          }
          return true; // Los mensajes individuales (directos) pasan siempre
        });

        // Guardamos solo los mensajes válidos en la señal de la bandeja
        this.mensajesBandeja.set(mensajesFiltrados);
        this.cargandoBandeja.set(false);
      },
      error: (err) => {
        console.error('Error al mapear bandeja:', err);
        this.cargandoBandeja.set(false);
      }
    });
  }

  // ✨ NUEVO: Al hacer click en un mensaje de la bandeja de entrada
abrirMensajeDesdeBandeja(msg: any): void {
    // 1. Apagamos el punto rosa localmente en el Front-end para que baje el contador de inmediato
    this.mensajesBandeja.update(list => 
      list.map(m => m.id === msg.id ? { ...m, leido: true } : m)
    );

    // 2. Notificamos al servidor que fue leído
    if (!msg.leido && msg.id) {
      this.chatSocketService.emitirMensajeLeido(msg.id, msg.emisorId);
    }

    // 3. CASO GRUPAL: Mapear, abrir chat con historial completo por WebSockets y permitir responder
    if (msg.tipo === 'grupal' && msg.grupoId) {
      this.personaSeleccionada.set(null);
      this.modoDifusionMulti.set(false);
      
      // Cambiamos la pestaña activa a 'mis-grupos' para que se acople perfectamente con tu diseño HTML
      this.tabActiva.set('mis-grupos'); 

      const grupoFormateado = {
        id: Number(msg.grupoId),
        nombre: msg.grupoNombre,
        rol: msg.rol || 'miembro'
      };

      this.seleccionarGrupo(grupoFormateado);
      return;
    }

    // 4. CASO INDIVIDUAL: Mapear, abrir chat cargando todo el historial privado para responder directo
    if (msg.tipo === 'individual' && msg.emisorId) {
      this.grupoSeleccionado.set(null);
      this.modoDifusionMulti.set(false);
      
      // Cambiamos la pestaña activa a 'personas' para que se acople con tu diseño HTML
      this.tabActiva.set('personas');

      const personaFormateada = {
        id: String(msg.emisorId),
        nombre: msg.emisor
      };

      this.seleccionarPersona(personaFormateada);
    }
  }

  protected limpiarFiltrosBandeja(): void {
    this.filtroTipoBandeja.set('todos');
    this.filtroEstadoBandeja.set('todos');
    this.filtroFechaBandeja.set('');
  }

  enviarRespuestaDirecta(msg: any): void {
    const texto = this.respuestaDirectaTexto().trim();
    const user = this.authService.currentUser();
    if (!texto || !user?.id) return;

    if (msg.tipo === 'grupal' && msg.grupoId) {
      this.chatSocketService.enviarMensaje(user.id, Number(msg.grupoId), texto);
    } else if (msg.tipo === 'individual' && msg.emisorId) {
      this.chatSocketService.enviarMensajePrivado(user.id, String(msg.emisorId), texto);
    }

    // Apagar el punto rosa localmente
    this.mensajesBandeja.update(list => 
      list.map(m => m.id === msg.id ? { ...m, leido: true } : m)
    );
    if (!msg.leido && msg.id) {
      this.chatSocketService.emitirMensajeLeido(msg.id, msg.emisorId);
    }

    // Limpiar y cerrar la cajita
    this.respuestaDirectaTexto.set('');
    this.mensajeRespondidoId.set(null);
    this.toastService.success('Mensaje enviado');
  }

}