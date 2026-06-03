import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoService } from '../../core/services/grupo.service';
import { PersonaService } from '../../core/services/persona.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service'; // Ajusta la ruta según tu proyecto
@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupos.component.html'
})
export class GruposComponent implements OnInit {
  private readonly grupoService = inject(GrupoService);
  private readonly personaService = inject(PersonaService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  // Modelo de datos para el formulario
  grupoData = {
    nombre: '',
    descripcion: '',
    esPublico: true,
    base64Imagen: '',
    creadorId: ''
  };

  previewImagen: string | null = null;
  miembrosSeleccionados: any[] = [];
  resultadosBusqueda: any[] = [];
  grupos: any[] = [];

  mensajeExito: string = '';
  mensajeError: string = '';

  ngOnInit(): void {
    const usuario = this.authService.currentUser();
    if (usuario && usuario.id) {
      this.grupoData.creadorId = usuario.id;
      this.cargarMisGrupos(usuario.id);
    } else {
      this.mensajeError = 'Sesión no válida. Inicia sesión nuevamente.';
    }
  }

  // Captura y procesa la imagen
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.previewImagen = base64;
        this.grupoData.base64Imagen = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  cargarMisGrupos(personaId: string) {
    this.grupoService.getGruposPorPersona(personaId).subscribe({
      next: (res: any[]) => this.grupos = res,
      error: (err) => console.error('Error al cargar grupos:', err)
    });
  }

buscarPersonas(event: any) {
    const termino = event.target.value;
    if (termino && termino.length > 2) {
      // Pasamos el término y el ID del creador actual para que el Back nos ignore
      this.personaService.buscarPorNombre(termino, this.grupoData.creadorId).subscribe({
        next: (res: any[]) => {
          this.resultadosBusqueda = res;
        },
        error: (err) => console.error('Error en búsqueda:', err)
      });
    } else {
      this.resultadosBusqueda = [];
    }
  }

  agregarMiembro(persona: any) {
    if (!this.miembrosSeleccionados.find(m => m.id === persona.id)) {
      this.miembrosSeleccionados.push(persona);
    }
    this.resultadosBusqueda = [];
  }

  removerMiembro(id: string) {
    this.miembrosSeleccionados = this.miembrosSeleccionados.filter(m => m.id !== id);
  }

crearGrupo() {
    // Validation de Nombre
    if (!this.grupoData.nombre) {
      this.toastService.error('El nombre del grupo es obligatorio');
      return;
    }

    // Validation de Miembros
    if (this.miembrosSeleccionados.length < 2) {
      this.toastService.warning('Debes añadir al menos 2 miembros adicionales');
      return;
    }

    const payload = {
      ...this.grupoData,
      miembrosIds: this.miembrosSeleccionados.map(m => m.id)
    };

    this.grupoService.crearGrupo(payload).subscribe({
      next: () => {
        this.toastService.success('¡Comunidad creada con éxito!');
        this.limpiarFormulario();
        if (this.grupoData.creadorId) this.cargarMisGrupos(this.grupoData.creadorId);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al crear el grupo');
      }
    });
  }

  private limpiarFormulario() {
    const currentId = this.grupoData.creadorId;
    this.grupoData = { 
      nombre: '', 
      descripcion: '', 
      esPublico: true, 
      base64Imagen: '', 
      creadorId: currentId 
    };
    this.previewImagen = null;
    this.miembrosSeleccionados = [];
    this.resultadosBusqueda = [];
    setTimeout(() => this.mensajeExito = '', 3000);
  }
}