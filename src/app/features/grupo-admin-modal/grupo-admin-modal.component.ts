import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoService } from '../../core/services/grupo.service';

@Component({
  selector: 'app-grupo-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupo-admin-modal.component.html',
  styleUrl: './grupo-admin-modal.component.css'
})
export class GrupoAdminModalComponent implements OnInit {
  @Input({ required: true }) grupoId!: number;
  @Output() closeModal = new EventEmitter<void>();

  private readonly grupoService = inject(GrupoService);

  protected miembros = signal<any[]>([]);
  protected cargando = signal(true);
  protected busqueda = '';

  protected tabActiva = signal<'miembros' | 'historial'>('miembros');
  protected logs = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarMiembros();
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