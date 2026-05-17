import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusService } from '../../core/services/bus.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-bus-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bus-registro.component.html',
  styleUrls: ['./bus-registro.component.css'],
})
export class BusRegistroComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly busService = inject(BusService);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  protected form!: FormGroup;
  protected isSaving = false;
  protected submitAttempted = false;
  protected selectedFile: File | null = null;
  protected generatedQr: string | null = null;
  protected lastQrPlaca: string | null = null;
  protected buses: any[] = [];
  protected flotaOpen = false;
  protected modalOpen = false;
  protected modalBus: any = null;
  protected modalState = 'operativo';
  protected estados = ['operativo', 'mantenimiento', 'fuera_de_servicio'];
  protected filtroEstado: 'todos' | 'operativo' | 'mantenimiento' | 'fuera_de_servicio' = 'todos';

  ngOnInit(): void {
    this.initForm();
    this.obtenerBuses(); // Aquí ya no fallará
  }

  private initForm(): void {
    this.form = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{3}$/)]],
      modelo: ['', [Validators.required]],
      anio: [2026, [Validators.required, Validators.min(1900)]],
      capacidad_sentados: [0, [Validators.required, Validators.min(0)]],
      capacidad_parados: [0, [Validators.required, Validators.min(0)]],
      estado: ['operativo', [Validators.required]],
    });
  }

  obtenerBuses(estado?: string): void {
    this.busService.listarBuses(estado).subscribe({
      next: (data) => {
        // No filtramos por enRuta aquí: enRuta sólo es indicador visual.
        this.buses = data;
      },
      error: () => console.error('Error al cargar la lista de buses'),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  save(): void {
    this.submitAttempted = true;
    console.log('[BusRegistro] Intento de registro', {
      valid: this.form.valid,
      value: this.form.value,
      hasFile: !!this.selectedFile,
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const invalidFields = this.getInvalidFieldLabels();
      const message =
        invalidFields.length > 0
          ? `Corrige antes de guardar: ${invalidFields.join(', ')}.`
          : 'Revisa los campos del formulario antes de guardar.';

      console.warn('[BusRegistro] Formulario inválido', { invalidFields });
      this.toastService.warning(message);
      return;
    }

    this.isSaving = true;
    const payload = {
      ...this.form.value,
      estado: this.normalizeEstado(this.form.value?.estado),
    };

    this.busService
      .registrarBus(payload, this.selectedFile)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (res) => {
          // Mostrar modal de éxito y toast consistente con el proyecto
          this.modalService.openInfo({
            title: 'Bus registrado',
            message: '✅ Bus registrado con éxito',
          });
          this.toastService.success('Bus registrado con éxito');
          // Construir la URL pública del bus y generar el QR apuntando a ella
          const placaUpper = (res?.placa || payload.placa || '').toString().toUpperCase();
          const publicUrl = `${environment.apiNestUrl || 'http://localhost:3000'}/bus/scan/${placaUpper}`;
          this.lastQrPlaca = placaUpper || null;
          this.generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            publicUrl,
          )}`;
          this.form.reset({ estado: 'operativo', anio: 2026 });
          this.selectedFile = null;
          // Carga inicial sin filtro (Todos)
          this.obtenerBuses();
        },
        error: (err) => {
          console.error('[BusRegistro] Error al registrar bus', err);

          const timeoutMessage =
            err?.name === 'TimeoutError'
              ? 'El servidor tardó demasiado en responder. Verifica que el backend esté activo.'
              : null;

          const msg = timeoutMessage || err?.error?.message || 'Error al registrar el bus';
          this.modalService.openError({ title: 'Error', message: msg });
          this.toastService.error(msg);
        },
      });
  }

  cambiarEstado(bus: any): void {
    this.openEstadoModal(bus);
  }

  openEstadoModal(bus: any): void {
    this.modalBus = bus;
    this.modalState = this.normalizeEstado(bus?.estado);
    this.modalOpen = true;
  }

  closeEstadoModal(): void {
    this.modalOpen = false;
    this.modalBus = null;
  }

  saveEstado(): void {
    if (!this.modalBus) return;
    const id = this.modalBus.id;
    const payloadState = this.normalizeEstado(this.modalState);

    this.busService.actualizarEstado(id, payloadState).subscribe({
      next: () => {
        const idx = this.buses.findIndex((b) => b.id === id);
        if (idx >= 0) this.buses[idx].estado = payloadState;
        this.closeEstadoModal();
        this.modalService
          .openInfo({
            title: 'Estado actualizado',
            message: `El estado del bus ${this.buses[idx]?.placa || this.buses[idx]?.plate || id} ha sido actualizado correctamente.`,
          })
          .then(() => {});
        // Refrescar lista con filtro actual
        this.obtenerBuses(this.filtroEstado === 'todos' ? undefined : this.filtroEstado);
      },
      error: (err: any) => {
        console.error('Error actualizando estado', err);
        const serverMessage =
          err?.error?.message || err?.message || 'Error al actualizar el estado';
        this.modalService.openError({ title: 'Error al actualizar', message: serverMessage });
      },
    });
  }

  private normalizeEstado(value: string | null | undefined): string {
    const normalized = (value || 'operativo')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');

    if (normalized === 'operativo') return 'operativo';
    if (normalized === 'mantenimiento') return 'mantenimiento';
    if (normalized === 'fuera_de_servicio') return normalized;
    if (normalized === 'fuera de servicio') return 'fuera_de_servicio';
    return 'operativo';
  }

  normalizePlate(event: any): void {
    let val = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3, 6);
    this.form.get('placa')?.setValue(val, { emitEvent: false });
  }

  protected showFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return (
      !!control && control.invalid && (control.touched || control.dirty || this.submitAttempted)
    );
  }

  protected getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['pattern']) return 'Formato esperado: AAA-123.';
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}.`;

    return 'Valor inválido.';
  }

  private getInvalidFieldLabels(): string[] {
    const labels: Record<string, string> = {
      placa: 'Placa',
      modelo: 'Modelo',
      anio: 'Año',
      capacidad_sentados: 'Capacidad de sentados',
      capacidad_parados: 'Capacidad de parados',
      estado: 'Estado',
    };

    return Object.keys(this.form.controls)
      .filter((key) => this.form.get(key)?.invalid)
      .map((key) => labels[key] || key);
  }

  seleccionarFiltro(
    filtro: 'todos' | 'operativo' | 'mantenimiento' | 'fuera_de_servicio' | string,
  ): void {
    // Aceptar valores legados como 'fuera de servicio'
    const mapped = filtro === 'fuera de servicio' ? 'fuera_de_servicio' : filtro;
    this.filtroEstado = (mapped as any) || 'todos';
    const estadoParam = this.filtroEstado === 'todos' ? undefined : this.filtroEstado;
    this.obtenerBuses(estadoParam);
  }

  protected buildPublicBusUrl(placa: string | null | undefined): string {
    const p = (placa || '').toString().toUpperCase();
    return `${environment.apiNestUrl || 'http://localhost:3000'}/bus/scan/${p}`;
  }

  protected openPublicBusPage(placa?: string | null): void {
    const url = this.buildPublicBusUrl(placa || this.lastQrPlaca);
    if (url) window.open(url, '_blank');
  }

  protected resolveBusPhotoUrl(bus: any): string | null {
    if (!bus) return null;

    const rawUrl = bus.fotoUrl || bus.foto_url || bus.foto;
    if (!rawUrl) return null;

    const value = rawUrl.toString().trim();
    if (!value) return null;

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const baseUrl = (environment.apiNestUrl || 'http://localhost:3000').replace(/\/$/, '');
    const path = value.replace(/^\/+/, '');

    if (path.startsWith('uploads/')) {
      return `${baseUrl}/${path}`;
    }

    if (path.includes('/')) {
      return `${baseUrl}/${path}`;
    }

    return `${baseUrl}/uploads/${path}`;
  }
}
