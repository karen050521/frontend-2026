import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgotPasswordService } from '../../core/services/forgot-password.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  token = '';
  showPassword = false;
  showPasswordConfirm = false;

  constructor(
    private fb: FormBuilder,
    private forgotPasswordService: ForgotPasswordService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el token de los parámetros de la URL
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Token inválido. Por favor, solicita un nuevo enlace de recuperación.';
      }
    });
    this.initializeForm();
  }

  initializeForm(): void {
    this.resetForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirmPassword') {
      this.showPasswordConfirm = !this.showPasswordConfirm;
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const password = this.resetForm.get('password')?.value;

    this.forgotPasswordService.resetPassword(this.token, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Contraseña restablecida exitosamente. Redirigiendo al login...';
        this.resetForm.reset();

        // Redirect al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 400) {
          this.errorMessage = 'Token inválido, expirado o ya fue utilizado';
        } else {
          this.errorMessage = 'Error al restablecer la contraseña. Intenta de nuevo';
        }
      },
    });
  }
}
