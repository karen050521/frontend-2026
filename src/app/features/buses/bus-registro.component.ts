import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
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
  protected selectedFile: File | null = null;
  protected generatedQr: string | null = null;
  protected buses: any[] = [];
  protected flotaOpen = false;
  protected modalOpen = false;
  protected modalBus: any = null;
  protected modalState = 'operativo';
  protected estados = ['operativo', 'mantenimiento', 'fuera_de_servicio'];

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

  // ESTA ES LA FUNCIÓN QUE SE TE HABÍA BORRADO:
  obtenerBuses(): void {
    this.busService.listarBuses().subscribe({
      next: (data) => {
        // Filtramos aquí mismo para ocultar los "fuera de servicio"
        this.buses = data.filter((bus) => bus.estado !== 'fuera de servicio');
      },
      error: () => console.error('Error al cargar la lista de buses'),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  save(): void {
    if (this.form.invalid) {
      this.modalService.openError({
        title: 'Formulario incompleto',
        message: 'Por favor rellena todos los campos correctamente.',
      });
      return;
    }

    this.isSaving = true;
    this.busService.registrarBus(this.form.value, this.selectedFile).subscribe({
      next: (res) => {
        // Mostrar modal de éxito y toast consistente con el proyecto
        this.modalService.openInfo({
          title: 'Bus registrado',
          message: '✅ Bus registrado con éxito',
        });
        this.toastService.success('Bus registrado con éxito');
        this.generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${res.codigoQr}`;
        this.form.reset({ estado: 'operativo', anio: 2026 });
        this.selectedFile = null;
        this.isSaving = false;
        this.obtenerBuses();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message || 'Error al registrar el bus';
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
    this.modalState = bus.estado || 'operativo';
    this.modalOpen = true;
  }

  closeEstadoModal(): void {
    this.modalOpen = false;
    this.modalBus = null;
  }

  saveEstado(): void {
    if (!this.modalBus) return;
    const id = this.modalBus.id;
    // Algunos backends validan el valor exacto; convertimos underscores a espacios por seguridad
    const payloadState = (this.modalState || '').includes('_')
      ? this.modalState.replace(/_/g, ' ')
      : this.modalState;

    this.busService.actualizarEstado(id, payloadState).subscribe({
      next: (res: any) => {
        const idx = this.buses.findIndex((b) => b.id === id);
        if (idx >= 0) this.buses[idx].estado = payloadState;
        this.closeEstadoModal();
        this.modalService
          .openInfo({
            title: 'Estado actualizado',
            message: `El estado del bus ${this.buses[idx]?.placa || this.buses[idx]?.plate || id} ha sido actualizado correctamente.`,
          })
          .then(() => {});
        this.toastService.success('Estado actualizado correctamente');
      },
      error: (err: any) => {
        console.error('Error actualizando estado', err);
        const serverMessage =
          err?.error?.message || err?.message || 'Error al actualizar el estado';
        // Si el payload con espacios falló y la versión con underscores es diferente, intentamos con la original
        if (err?.status === 400 && payloadState !== this.modalState) {
          this.busService.actualizarEstado(id, this.modalState).subscribe({
            next: (res2: any) => {
              const idx2 = this.buses.findIndex((b) => b.id === id);
              if (idx2 >= 0) this.buses[idx2].estado = this.modalState;
              this.closeEstadoModal();
              this.modalService
                .openInfo({
                  title: 'Estado actualizado',
                  message: `El estado del bus ${this.buses[idx2]?.placa || this.buses[idx2]?.plate || id} ha sido actualizado correctamente.`,
                })
                .then(() => {});
              this.toastService.success('Estado actualizado correctamente');
            },
            error: (err2: any) => {
              console.error('Segundo intento falló', err2);
              this.modalService.openError({ title: 'Error', message: serverMessage });
            },
          });
          return;
        }

        this.modalService.openError({ title: 'Error al actualizar', message: serverMessage });
      },
    });
  }

  normalizePlate(event: any): void {
    let val = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3, 6);
    this.form.get('placa')?.setValue(val, { emitEvent: false });
  }
}
