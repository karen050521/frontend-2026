import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  verificationForm: FormGroup;
  isLoading: boolean = false;
  isVerifyingCode: boolean = false;
  isVerificationModalOpen: boolean = false;
  errorMessage: string = '';
  verificationErrorMessage: string = '';
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

    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
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

    // Si hay sesión pendiente de 2FA, mantener modal abierto incluso tras recarga
    if (this.authService.hasPendingTwoFactorVerification()) {
      this.isVerificationModalOpen = true;
    }
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
        const loginResponse = await this.authService.login(email, password, recaptchaToken);

        this.isLoading = false;
        this.successMessage = loginResponse.message || '';
        this.verificationErrorMessage = '';
        this.verificationForm.reset();
        this.isVerificationModalOpen = true;
      } catch (error: any) {
        this.isLoading = false;

        if (error.message?.includes('reCAPTCHA')) {
          this.errorMessage = 'Error al verificar reCAPTCHA. Inténtalo de nuevo.';
        } else {
          this.errorMessage =
            error?.error?.message || error?.message || 'Email o contraseña incorrectos';
        }
      }
    }
  }

  async submitVerificationCode(): Promise<void> {
    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isVerifyingCode = true;
    this.verificationErrorMessage = '';

    const code = this.verificationForm.get('code')?.value;
    try {
      await this.authService.verifyLoginCode(code);
      this.isVerificationModalOpen = false;
      this.router.navigate([this.returnUrl]);
    } catch (error: any) {
      this.verificationErrorMessage =
        error?.error?.message ||
        error?.message ||
        'Código inválido o expirado. Inténtalo nuevamente.';
    } finally {
      this.isVerifyingCode = false;
    }
  }

  cancelVerification(): void {
    this.isVerificationModalOpen = false;
    this.authService.logout();
    this.verificationForm.reset();
    this.verificationErrorMessage = '';
  }
}
