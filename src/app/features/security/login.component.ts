import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
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
  oauthLoading: { [key: string]: boolean } = { google: false, github: false, microsoft: false };
  errorMessage: string = '';
  successMessage: string = '';
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseAuthService: FirebaseAuthService,
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

  /**
   * Login tradicional con email y contraseña
   */
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

  /**
   * Login con Google
   */
  async loginWithGoogle() {
    this.oauthLoading['google'] = true;
    this.errorMessage = '';

    try {
      await this.firebaseAuthService.loginWithGoogle();
      // El usuario se sincroniza automáticamente con AuthService
      // Redirigir después del login exitoso
      setTimeout(() => {
        this.router.navigate([this.returnUrl]);
      }, 500);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al autenticarse con Google';
    } finally {
      this.oauthLoading['google'] = false;
    }
  }

  /**
   * Login con GitHub
   */
  async loginWithGithub() {
    this.oauthLoading['github'] = true;
    this.errorMessage = '';

    try {
      await this.firebaseAuthService.loginWithGithub();
      // El usuario se sincroniza automáticamente con AuthService
      // Redirigir después del login exitoso
      setTimeout(() => {
        this.router.navigate([this.returnUrl]);
      }, 500);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al autenticarse con GitHub';
    } finally {
      this.oauthLoading['github'] = false;
    }
  }

  /**
   * Login con Microsoft
   */
  async loginWithMicrosoft() {
    this.oauthLoading['microsoft'] = true;
    this.errorMessage = '';

    try {
      await this.firebaseAuthService.loginWithMicrosoft();
      // El usuario se sincroniza automáticamente con AuthService
      // Redirigir después del login exitoso
      setTimeout(() => {
        this.router.navigate([this.returnUrl]);
      }, 500);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al autenticarse con Microsoft';
    } finally {
      this.oauthLoading['microsoft'] = false;
    }
  }
}
