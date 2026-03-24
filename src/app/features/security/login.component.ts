import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private recaptchaService: RecaptchaService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Obtener returnUrl y mensajes de los query params
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
      if (params['message']) {
        this.successMessage = params['message'];
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const { email, password } = this.loginForm.value;

      try {
        // Ejecutar reCAPTCHA
        const recaptchaToken = await this.recaptchaService.execute('login');
        console.log('TOKEN GENERADO:', recaptchaToken);

        if (!recaptchaToken) {
          throw new Error('reCAPTCHA token vacío');
        }

        // Enviar login con token
        await this.authService.login(email, password, recaptchaToken);

        this.isLoading = false;

        // Redirigir al returnUrl o a home por defecto
        this.router.navigate([this.returnUrl]);
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
