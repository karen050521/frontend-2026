import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private recaptchaService: RecaptchaService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

async onSubmit() {
  if (this.loginForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    try {
      // Ejecutar reCAPTCHA
      const recaptchaToken = await this.recaptchaService.execute('login');
      console.log("TOKEN GENERADO:", recaptchaToken);

      if (!recaptchaToken) {
        throw new Error('reCAPTCHA token vacío');
      }

      // Enviar login con token
      await this.authService.login(email, password, recaptchaToken);

      this.isLoading = false;
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.isLoading = false;

      if (error.message?.includes('reCAPTCHA')) {
        this.errorMessage = 'Error al verificar reCAPTCHA. Inténtalo de nuevo.';
      } else {
        this.errorMessage = 'Email o contraseña incorrectos';
      }
    }
  }
}
}
