import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { RutaService } from '../../../core/services/ruta.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-ruta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div class="mb-8">
        <h1 class="text-3xl font-black theme-text-primary tracking-tight">Crear Ruta</h1>
        <p class="theme-text-secondary mt-2">HU-009: Configura una nueva ruta y asigna sus paraderos secuenciales.</p>
      </div>

      <div class="theme-card p-8 rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()" class="space-y-8">
          
          <!-- SECCIÓN: DATOS GENERALES -->
          <div>
            <h2 class="text-xl font-bold text-pink-400 mb-4 border-b border-white/10 pb-2">1. Datos Generales</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <!-- Nombre -->
              <div class="col-span-1 md:col-span-2 lg:col-span-2">
                <label class="block text-sm font-bold theme-text-primary mb-2">Nombre de Ruta *</label>
                <input 
                  type="text" 
                  formControlName="nombre"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                  placeholder="Ej. Ruta A - Troncal"
                >
                @if (rutaForm.get('nombre')?.invalid && rutaForm.get('nombre')?.touched) {
                  <span class="text-red-400 text-xs mt-1 block">El nombre es requerido</span>
                }
              </div>

              <!-- Estado -->
              <div>
                <label class="block text-sm font-bold theme-text-primary mb-2">Estado</label>
                <select 
                  formControlName="estado"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none appearance-none"
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              </div>

              <!-- Descripción -->
              <div class="col-span-1 md:col-span-3">
                <label class="block text-sm font-bold theme-text-primary mb-2">Descripción</label>
                <textarea 
                  formControlName="descripcion"
                  rows="2"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                  placeholder="Detalles del trayecto..."
                ></textarea>
              </div>

              <!-- Tarifa -->
              <div>
                <label class="block text-sm font-bold theme-text-primary mb-2">Tarifa (S/.) *</label>
                <input 
                  type="number" 
                  step="0.10"
                  formControlName="tarifa"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                  placeholder="Ej. 2.50"
                >
                @if (rutaForm.get('tarifa')?.invalid && rutaForm.get('tarifa')?.touched) {
                  <span class="text-red-400 text-xs mt-1 block">Tarifa válida es requerida</span>
                }
              </div>

              <!-- Duración Estimada -->
              <div>
                <label class="block text-sm font-bold theme-text-primary mb-2">Duración (min) *</label>
                <input 
                  type="number" 
                  formControlName="duracionEstimada"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                  placeholder="Ej. 45"
                >
                @if (rutaForm.get('duracionEstimada')?.invalid && rutaForm.get('duracionEstimada')?.touched) {
                  <span class="text-red-400 text-xs mt-1 block">Duración requerida</span>
                }
              </div>

              <!-- Nodo ID -->
              <div>
                <label class="block text-sm font-bold theme-text-primary mb-2">Nodo ID (Opcional)</label>
                <input 
                  type="number" 
                  formControlName="nodoId"
                  class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                  placeholder="ID de nodo"
                >
              </div>
            </div>
          </div>

          <!-- SECCIÓN: PARADEROS (FormArray) -->
          <div>
            <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <h2 class="text-xl font-bold text-violet-400">2. Paraderos Secuenciales</h2>
              <button 
                type="button" 
                (click)="addParadero()"
                class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors text-sm font-bold"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Añadir Paradero
              </button>
            </div>
            
            <p class="text-xs text-gray-400 mb-4">Añade al menos 3 paraderos para conformar una ruta completa.</p>

            <div formArrayName="paraderos" class="space-y-3">
              @for (paradero of paraderos.controls; track $index) {
                <div [formGroupName]="$index" class="flex items-end gap-4 p-4 rounded-xl bg-black/20 border border-white/5 relative group transition-all hover:border-violet-500/30">
                  
                  <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-black border border-violet-500/50">
                    {{ $index + 1 }}
                  </div>

                  <div class="flex-1 ml-4">
                    <label class="block text-xs font-bold text-gray-400 mb-1">ID del Paradero *</label>
                    <input 
                      type="number" 
                      formControlName="paraderoId"
                      class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 theme-text-primary focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none text-sm"
                      placeholder="ID"
                    >
                  </div>

                  <div class="w-32">
                    <label class="block text-xs font-bold text-gray-400 mb-1">Orden *</label>
                    <input 
                      type="number" 
                      formControlName="ordenSecuencial"
                      class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 theme-text-primary focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none text-sm"
                      readonly
                    >
                  </div>

                  <button 
                    type="button" 
                    (click)="removeParadero($index)"
                    class="p-2 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    title="Eliminar paradero"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              }
              
              @if (paraderos.length === 0) {
                <div class="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                  No hay paraderos asignados. Añade paraderos para crear una ruta completa.
                </div>
              }
            </div>
            
            @if (rutaForm.get('paraderos')?.invalid && rutaForm.get('paraderos')?.touched) {
               <div class="text-red-400 text-xs mt-2">Revise la configuración de paraderos. Mínimo 3 sugeridos.</div>
            }
          </div>

          <!-- BOTONES -->
          <div class="pt-6 border-t border-white/10 flex justify-end gap-4">
            <button 
              type="button" 
              class="px-6 py-2.5 rounded-xl font-bold theme-text-primary hover:bg-white/5 transition-colors"
              (click)="rutaForm.reset({ estado: 'activa' })"
              [disabled]="isSaving"
            >
              Limpiar
            </button>
            <button 
              type="submit" 
              [disabled]="rutaForm.invalid || isSaving"
              class="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center min-w-[160px]"
            >
              @if (isSaving) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              } @else {
                Guardar Ruta
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class CrearRutaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rutaService = inject(RutaService);
  private router = inject(Router);

  isSaving = false;

  rutaForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    tarifa: ['', [Validators.required, Validators.min(0)]],
    estado: ['activa'],
    duracionEstimada: ['', [Validators.required, Validators.min(1)]],
    nodoId: [null],
    paraderos: this.fb.array([])
  });

  get paraderos() {
    return this.rutaForm.get('paraderos') as FormArray;
  }

  ngOnInit(): void {
    // Inicializar con 3 paraderos vacíos sugeridos por la HU
    this.addParadero();
    this.addParadero();
    this.addParadero();
  }

  addParadero(): void {
    const nextOrder = this.paraderos.length + 1;
    const paraderoGroup = this.fb.group({
      paraderoId: ['', Validators.required],
      ordenSecuencial: [nextOrder, Validators.required]
    });
    this.paraderos.push(paraderoGroup);
    this.updateOrderSecuencial();
  }

  removeParadero(index: number): void {
    this.paraderos.removeAt(index);
    this.updateOrderSecuencial();
  }

  private updateOrderSecuencial(): void {
    this.paraderos.controls.forEach((control, index) => {
      control.get('ordenSecuencial')?.setValue(index + 1);
    });
  }

  onSubmit(): void {
    if (this.rutaForm.valid) {
      this.isSaving = true;
      const formValue = this.rutaForm.value;
      
      const payload = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        tarifa: Number(formValue.tarifa),
        estado: formValue.estado,
        duracionEstimada: Number(formValue.duracionEstimada),
        nodoId: formValue.nodoId ? Number(formValue.nodoId) : undefined,
        paraderos: formValue.paraderos.map((p: any) => ({
          paraderoId: Number(p.paraderoId),
          ordenSecuencial: Number(p.ordenSecuencial)
        }))
      };

      this.rutaService.crearRutaCompleta(payload).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          alert('Ruta guardada exitosamente en el backend.');
          this.router.navigate(['/rutas']);
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Error al guardar ruta:', err);
          alert('Ocurrió un error al guardar la ruta. Verifica la consola para más detalles.');
        }
      });
      
    } else {
      this.rutaForm.markAllAsTouched();
    }
  }
}
