import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';

import { ParaderoService } from '../../../core/services/paradero.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-crear-paradero',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-paradero.component.html',
  styleUrl: './crear-paradero.component.css',
})
export class CrearParaderoComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private paraderoService = inject(ParaderoService);
  private toast = inject(ToastService);

  @ViewChild('mapaContainer', { static: true })
  mapaContainer!: ElementRef<HTMLDivElement>;

  paraderoForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    latitud: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitud: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    tipo: ['Parada'],
  });

  isSaving = false;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngOnInit(): void {
    this.paraderoForm.get('latitud')?.valueChanges.subscribe(() => this.syncMarker());
    this.paraderoForm.get('longitud')?.valueChanges.subscribe(() => this.syncMarker());
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!this.mapaContainer?.nativeElement || this.map) return;

    this.map = L.map(this.mapaContainer.nativeElement).setView([4.8133, -75.6961], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng.lat, e.latlng.lng);
    });

    this.map.invalidateSize();
  }

  private setMarker(lat: number, lng: number): void {
    if (!this.map) return;

    this.paraderoForm.patchValue(
      { latitud: parseFloat(lat.toFixed(7)), longitud: parseFloat(lng.toFixed(7)) },
      { emitEvent: false },
    );

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true })
        .addTo(this.map)
        .bindPopup('Paradero seleccionado')
        .openPopup();

      this.marker.on('dragend', (e: L.DragEndEvent) => {
        const pos = (e.target as L.Marker).getLatLng();
        this.setMarker(pos.lat, pos.lng);
      });
    }

    this.map.setView([lat, lng], Math.max(this.map.getZoom(), 15));
  }

  private syncMarker(): void {
    const lat = this.paraderoForm.get('latitud')?.value;
    const lng = this.paraderoForm.get('longitud')?.value;
    if (lat != null && lng != null && this.map) {
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { draggable: true })
          .addTo(this.map)
          .bindPopup('📍 Paradero seleccionado');

        this.marker.on('dragend', (e: L.DragEndEvent) => {
          const pos = (e.target as L.Marker).getLatLng();
          this.setMarker(pos.lat, pos.lng);
        });
      }
      this.map.setView([lat, lng], Math.max(this.map.getZoom(), 15));
    }
  }

  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.toast.error('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.setMarker(pos.coords.latitude, pos.coords.longitude);
        this.toast.success('Ubicación obtenida.');
      },
      () => {
        this.toast.error('No se pudo obtener tu ubicación. Haz clic en el mapa.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  onSubmit(): void {
    if (this.paraderoForm.invalid) {
      this.paraderoForm.markAllAsTouched();
      this.toast.warning('Completa los campos requeridos y selecciona una ubicación en el mapa.');
      return;
    }

    if (this.isSaving) return;

    this.isSaving = true;
    const dto = {
      nombre: this.paraderoForm.get('nombre')!.value,
      descripcion: this.paraderoForm.get('descripcion')!.value || undefined,
      latitud: this.paraderoForm.get('latitud')!.value,
      longitud: this.paraderoForm.get('longitud')!.value,
      tipo: this.paraderoForm.get('tipo')!.value,
    };

    this.paraderoService.crearParadero(dto).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Paradero guardado exitosamente.');
        this.paraderoForm.reset({ tipo: 'Parada' });
        if (this.marker) {
          this.marker.remove();
          this.marker = null;
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Error al guardar paradero:', err);
        this.toast.error(
          err?.error?.message ||
            'Error al guardar el paradero. Verifica que el backend esté corriendo.',
        );
      },
    });
  }

  onLimpiar(): void {
    this.paraderoForm.reset({ tipo: 'Parada' });
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }
}
