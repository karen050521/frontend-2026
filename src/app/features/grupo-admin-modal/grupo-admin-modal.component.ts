import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoService } from '../../core/services/grupo.service';
import { ChatSocketService } from '../../core/services/chat-socket.service'; // 👈 1. IMPORTAR EL SERVICIO
import { Subscription } from 'rxjs'; // 👈 2. IMPORTAR SUBSCRIPTION PARA EVITAR FUGAS DE MEMORIA

@Component({
  selector: 'app-grupo-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupo-admin-modal.component.html',
  styleUrl: './grupo-admin-modal.component.css'
})
export class GrupoAdminModalComponent implements OnInit, OnDestroy { // 👈 3. AGREGAR ONDESTROY
  @Input({ required: true }) grupoId!: number;
  @Output() closeModal = new EventEmitter<void>();

  private readonly grupoService = inject(GrupoService);
  private readonly chatSocketService = inject(ChatSocketService); // 👈 4. INYECTAR CHATSOCKETSERVICE

  protected miembros = signal<any[]>([]);
  protected cargando = signal(true);
  protected busqueda = '';

  protected tabActiva = signal<'miembros' | 'historial'>('miembros');
  protected logs = signal<any[]>([]);

  private subAbandono?: Subscription; // 👈 5. VARIABLE PARA GUARDAR LA SUSCRIPCIÓN

  ngOnInit(): void {
    this.cargarMiembros();
    this.escucharAbandonoEnTiempoReal(); // 👈 6. INICIAR LA ESCUCHA REAL
  }

  // 👈 7. NUEVO MÉTODO: Sincronización reactiva por WebSockets
  private escucharAbandonoEnTiempoReal(): void {
    this.subAbandono = this.chatSocketService.escucharUsuarioAbandono().subscribe({
      next: (data: any) => {
        // Validamos que el abandono ocurra en este mismo grupo que estamos administrando
        if (Number(data.grupoId) === Number(this.grupoId)) {
          
          // Como usas un Signal, actualizamos su estado removiendo al usuario que se fue
          this.miembros.update(listaActual => 
            listaActual.filter(m => m.persona?.id !== data.personaId)
          );

          // Si el administrador está en la pestaña de historial, recargamos la bitácora automáticamente
          if (this.tabActiva() === 'historial') {
            this.cargarLogs();
          }

          console.log(`⚡ Sincronización WebSocket: ${data.nombrePersona} abandonó el grupo. Removido de pantalla.`);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // 👈 8. LIMPIEZA CLAVE: Dessuscribirse al cerrar el modal para no saturar la memoria
    if (this.subAbandono) {
      this.subAbandono.unsubscribe();
    }
  }

  cargarMiembros(): void {
    this.cargando.set(true);
    this.grupoService.obtenerMiembros(this.grupoId, this.busqueda).subscribe({
      next: (data) => {
        this.miembros.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  filtrarMiembros(): void {
    this.cargarMiembros();
  }

  cambiarTab(tab: 'miembros' | 'historial'): void {
    this.tabActiva.set(tab);
    if (tab === 'historial') {
      this.cargarLogs();
    } else {
      this.cargarMiembros();
    }
  }

  cargarLogs(): void {
    this.cargando.set(true);
    this.grupoService.obtenerLogsMembresia(this.grupoId).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  mapearTextoLog(log: any): string {
    const admin = log.usuarioAccion?.nombre || 'Un administrador';
    const afectado = log.usuarioAfectado?.nombre || 'Usuario';

    switch (log.accion) {
      case 'UNIRSE':
        return `<span class="font-bold text-white">${afectado}</span> se unió al grupo de forma voluntaria.`;
      case 'AÑADIR':
        return `<span class="font-bold text-pink-400">${admin}</span> añadió a <span class="font-bold text-white">${afectado}</span> al grupo.`;
      case 'PROMOVER':
        return `<span class="font-bold text-pink-400">${admin}</span> promovió a <span class="font-bold text-white">${afectado}</span> a Administrador.`;
      case 'REMOVER':
        return `<span class="font-bold text-pink-400">${admin}</span> eliminó a <span class="font-bold text-white">${afectado}</span> del grupo.`;
      case 'BLOQUEAR':
        return `<span class="font-bold text-red-400">${admin}</span> bloqueó de forma permanente a <span class="font-bold text-white">${afectado}</span>.`;
      default:
        return 'Cambio de membresía registrado.';
    }
  }
  
  promover(personaId: string): void {
    if (confirm('¿Seguro que quieres promover a este miembro como administrador?')) {
      this.grupoService.promoverAdmin(this.grupoId, personaId).subscribe(() => this.cargarMiembros());
    }
  }

  remover(personaId: string): void {
    if (confirm('¿Seguro que quieres remover a este miembro del grupo?')) {
      this.grupoService.removerMiembro(this.grupoId, personaId).subscribe(() => this.cargarMiembros());
    }
  }

  bloquear(personaId: string): void {
    if (confirm('¿Seguro que deseas BLOQUEAR a este usuario? No podrá volver a unirse al grupo.')) {
      this.grupoService.bloquearMiembro(this.grupoId, personaId).subscribe(() => this.cargarMiembros());
    }
  }
}