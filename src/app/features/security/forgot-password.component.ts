import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ForgotPasswordService } from '../../core/services/forgot-password.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private forgotPasswordService: ForgotPasswordService,
    private recaptchaService: RecaptchaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const email = this.forgotForm.get('email')?.value;

      // Ejecutar reCAPTCHA
      const recaptchaToken = await this.recaptchaService.execute('forgotpassword');

      if (!recaptchaToken) {
        this.errorMessage = 'Error al verificar reCAPTCHA. Intenta de nuevo.';
        this.isLoading = false;
        return;
      }

      this.forgotPasswordService.requestPasswordReset(email, recaptchaToken).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Mensaje genérico por seguridad
          this.successMessage =
            response.message ||
            'Si el email existe en nuestros registros, recibirá instrucciones de recuperación en su bandeja de entrada.';
          this.forgotForm.reset();

          // Redirect al login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          // Mensaje genérico por seguridad - no revelar si el email existe
          this.successMessage =
            'Si el email existe en nuestros registros, recibirá instrucciones de recuperación en su bandeja de entrada.';
        },
      });
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'Error al procesar la solicitud.';
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}


