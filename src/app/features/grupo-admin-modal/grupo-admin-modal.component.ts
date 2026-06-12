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