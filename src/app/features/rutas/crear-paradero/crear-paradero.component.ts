import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParaderoService } from '../../../core/services/paradero.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-paradero',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div class="mb-8">
        <h1 class="text-3xl font-black theme-text-primary tracking-tight">Crear Paradero</h1>
        <p class="theme-text-secondary mt-2">HU-010: Registra un nuevo paradero en el sistema con sus coordenadas geográficas.</p>
      </div>

      <div class="theme-card p-8 rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <form [formGroup]="paraderoForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nombre -->
            <div class="col-span-1 md:col-span-2">
              <label class="block text-sm font-bold theme-text-primary mb-2">Nombre del Paradero *</label>
              <input 
                type="text" 
                formControlName="nombre"
                class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                placeholder="Ej. Estación Central"
              >
              @if (paraderoForm.get('nombre')?.invalid && paraderoForm.get('nombre')?.touched) {
                <span class="text-red-400 text-xs mt-1 block">El nombre es requerido</span>
              }
            </div>

            <!-- Descripción -->
            <div class="col-span-1 md:col-span-2">
              <label class="block text-sm font-bold theme-text-primary mb-2">Descripción</label>
              <textarea 
                formControlName="descripcion"
                rows="3"
                class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                placeholder="Detalles adicionales sobre la ubicación..."
              ></textarea>
            </div>

            <!-- Latitud -->
            <div>
              <label class="block text-sm font-bold theme-text-primary mb-2">Latitud *</label>
              <input 
                type="number" 
                step="any"
                formControlName="latitud"
                class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                placeholder="Ej. -12.046374"
              >
              @if (paraderoForm.get('latitud')?.invalid && paraderoForm.get('latitud')?.touched) {
                <span class="text-red-400 text-xs mt-1 block">Latitud válida es requerida</span>
              }
            </div>

            <!-- Longitud -->
            <div>
              <label class="block text-sm font-bold theme-text-primary mb-2">Longitud *</label>
              <input 
                type="number" 
                step="any"
                formControlName="longitud"
                class="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 theme-text-primary focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none"
                placeholder="Ej. -77.042793"
              >
              @if (paraderoForm.get('longitud')?.invalid && paraderoForm.get('longitud')?.touched) {
                <span class="text-red-400 text-xs mt-1 block">Longitud válida es requerida</span>
              }
            </div>
          </div>

          <!-- Mapa Preview Placeholder -->
          <div class="w-full h-48 bg-black/30 rounded-xl border border-white/10 flex items-center justify-center flex-col mt-4">
            <svg class="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            <span class="text-gray-500 text-sm font-medium">Vista previa del mapa (Implementar Leaflet)</span>
          </div>

          <div class="pt-6 border-t border-white/10 flex justify-end gap-4">
            <button 
              type="button" 
              class="px-6 py-2.5 rounded-xl font-bold theme-text-primary hover:bg-white/5 transition-colors"
              (click)="paraderoForm.reset()"
              [disabled]="isSaving"
            >
              Limpiar
            </button>
            <button 
              type="submit" 
              [disabled]="paraderoForm.invalid || isSaving"
              class="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center min-w-[180px]"
            >
              @if (isSaving) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              } @else {
                Guardar Paradero
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class CrearParaderoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private paraderoService = inject(ParaderoService);
  private router = inject(Router);

  isSaving = false;
  
  paraderoForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
  });

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.paraderoForm.valid) {
      this.isSaving = true;
      this.paraderoService.crearParadero(this.paraderoForm.value).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          alert('Paradero guardado exitosamente en el backend.');
          this.paraderoForm.reset();
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Error al guardar paradero:', err);
          alert('Ocurrió un error al guardar el paradero. Verifica la consola para más detalles.');
        }
      });
    } else {
      this.paraderoForm.markAllAsTouched();
    }
  }
}
