import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordStrength: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        apellido: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    const hasMinLength = value.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial && hasMinLength;
    return !passwordValid ? { invalidPassword: true } : null;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  }

  updatePasswordStrength() {
    const password = this.registerForm.get('password')?.value || '';
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[#?!@$%^&*-]/.test(password);
    const hasMinLength = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecial, hasMinLength].filter(
      Boolean,
    ).length;

    if (strength < 2) this.passwordStrength = 'débil';
    else if (strength < 4) this.passwordStrength = 'media';
    else this.passwordStrength = 'fuerte';
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { nombre, apellido, email, password } = this.registerForm.value;

      const name = `${nombre} ${apellido}`.trim();

      this.authService
        .register(name, email, password)
        .then(() => {
          // Al registrarse con éxito, se hace login automático y se redirige al home
          return this.authService.login(email, password);
        })
        .then(() => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        })
        .catch((error) => {
          this.isLoading = false;
          // Mostrar error amigable (por ejemplo: email ya existe)
          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al registrar. Intenta nuevamente.';
        });
    }
  }

  getStrengthColor(): string {
    switch (this.passwordStrength) {
      case 'débil':
        return 'text-red-500';
      case 'media':
        return 'text-yellow-500';
      case 'fuerte':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  }
}
