import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  AlertaClima,
  AlertaClimaService,
} from '../../core/services/alerta-clima.service';

@Component({
  selector: 'app-alertas-clima',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alertas-clima.component.html',
  styleUrls: ['./alertas-clima.component.css'],
})
export class AlertasClimaComponent implements OnInit {
  form!: FormGroup;
  alertas: AlertaClima[] = [];
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private alertaService: AlertaClimaService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      horaViaje: ['07:00', Validators.required],
      ciudad: [''],
      canal: ['email', Validators.required],
      telegramChatId: [''],
    });

    // Telegram requiere el chat_id; email no.
    this.form.get('canal')?.valueChanges.subscribe((canal) => {
      const ctrl = this.form.get('telegramChatId');
      if (canal === 'telegram') ctrl?.setValidators([Validators.required]);
      else ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    this.cargar();
  }

  get esTelegram(): boolean {
    return this.form?.get('canal')?.value === 'telegram';
  }

  cargar(): void {
    this.alertaService.misAlertas().subscribe({
      next: (res) => (this.alertas = res),
      error: () => (this.alertas = []),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.alertaService.guardar(this.form.value).subscribe({
      next: () => {
        this.successMessage = 'Alerta de clima activada correctamente.';
        this.loading = false;
        this.cargar();
      },
      error: (err) => {
        console.error('Error guardando alerta de clima:', err);
        this.errorMessage = 'No se pudo guardar la alerta. Intenta de nuevo.';
        this.loading = false;
      },
    });
  }

  desactivar(id: string): void {
    this.alertaService.desactivar(id).subscribe({
      next: () => this.cargar(),
      error: (err) => console.error('Error desactivando alerta:', err),
    });
  }

  probarAhora(): void {
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;
    this.alertaService.probarAhora().subscribe({
      next: (res) => {
        this.successMessage = `Grafo ejecutado: ${res.pendientes} pendiente(s), ${res.enviados} notificada(s). Revisa tu correo/Telegram.`;
        this.loading = false;
        this.cargar();
      },
      error: (err) => {
        console.error('Error ejecutando prueba de clima:', err);
        this.errorMessage = 'No se pudo ejecutar la prueba. Revisa que los servicios estén arriba.';
        this.loading = false;
      },
    });
  }
}
