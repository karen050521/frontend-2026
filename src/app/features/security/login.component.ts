import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { ToastService } from '../../core/services/toast.service';
import { UserRoleService, RoleRef } from '../../core/services/user-role.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SelectRoleModalComponent } from '../../shared/components/select-role-modal/select-role-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SelectRoleModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  verificationForm: FormGroup;
  isLoading: boolean = false;
  isVerifyingCode: boolean = false;
  isVerificationModalOpen: boolean = false;
  isRoleSelectionModalOpen = signal<boolean>(false);
  userRoles = signal<RoleRef[]>([]);
  isSelectingRole = signal<boolean>(false);
  oauthLoading: { [key: string]: boolean } = { google: false, github: false, microsoft: false };
  errorMessage: string = '';
  verificationErrorMessage: string = '';
  successMessage: string = '';
  returnUrl: string = '/dashboard';
  maskedVerificationEmail: string = '';
  twoFactorTimeLeftLabel: string = '05:00';
  private twoFactorTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseAuthService: FirebaseAuthService,
    private recaptchaService: RecaptchaService,
    private toastService: ToastService,
    private userRoleService: UserRoleService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.verificationForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{6}$/),
          Validators.minLength(6),
          Validators.maxLength(6),
        ],
      ],
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
      this.setupTwoFactorUiState();
    }
  }

  ngOnDestroy(): void {
    this.stopTwoFactorTimer();

    // Si sale de la pantalla con sesión 2FA pendiente, invalida sesión parcial.
    if (this.authService.hasPendingTwoFactorVerification()) {
      this.authService.cancelPendingTwoFactorSession();
      this.authService.clearTwoFactorStateAndSession();
    }
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
        this.setupTwoFactorUiState();
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
      this.stopTwoFactorTimer();
      this.isVerificationModalOpen = false;
      
      // Obtener roles del usuario autenticado
      await this.loadUserRolesAndNavigate();
    } catch (error: any) {
      const backendMessage = error?.error?.message || error?.message || '';
      const attemptsRemaining = Number(error?.error?.attemptsRemaining);
      const isAttemptsExhausted =
        attemptsRemaining === 0 || backendMessage.toLowerCase().includes('intentos agotados');

      if (error?.status === 401 && isAttemptsExhausted) {
        this.verificationErrorMessage = 'Intentos agotados. Debes iniciar sesión nuevamente.';
        this.toastService.error('Intentos agotados. Debes iniciar sesión nuevamente.');

        await this.authService.cancelPendingTwoFactorSession();
        this.authService.clearTwoFactorStateAndSession();
        this.verificationForm.reset();
        this.stopTwoFactorTimer();
        this.isVerificationModalOpen = false;

        this.router.navigate(['/login'], {
          queryParams: {
            message: 'Intentos agotados. Debes iniciar sesión nuevamente.',
          },
        });
        return;
      }

      if (error?.status === 401 && Number.isFinite(attemptsRemaining) && attemptsRemaining > 0) {
        this.authService.setTwoFactorAttemptsRemaining(attemptsRemaining);
        this.verificationErrorMessage = `Código incorrecto. Intentos restantes: ${attemptsRemaining}`;
        this.toastService.warning(this.verificationErrorMessage);
        return;
      }

      this.verificationErrorMessage =
        backendMessage || 'Código inválido o expirado. Inténtalo nuevamente.';
    } finally {
      this.isVerifyingCode = false;
    }
  }

  /**
   * Carga los roles del usuario autenticado y navega según corresponda
   */
  private async loadUserRolesAndNavigate(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser || !currentUser.id) {
        // Sin usuario, navegar directamente
        this.router.navigate([this.returnUrl]);
        return;
      }

      const tokenRole = this.authService.getTokenRole();
      if (tokenRole) {
        this.authService.setCurrentRole(tokenRole);
      }

      // Obtener roles del usuario
      this.userRoleService.getUserRoles(currentUser.id).subscribe({
        next: (userRoles) => {
          const roles = userRoles.map(ur => ur.role).filter((role): role is RoleRef => !!role);
          
          if (roles.length === 0) {
            // Sin roles, navegar directamente
            this.router.navigate([this.returnUrl]);
            return;
          }

          if (roles.length === 1) {
            // Un solo rol, persistirlo y navegar directamente
            const onlyRole = roles[0];
            this.persistSelectedRole(onlyRole.id || onlyRole.name || '');
            this.router.navigate([this.returnUrl]);
            return;
          }

          // Múltiples roles: mostrar modal de selección
          this.userRoles.set(roles);
          this.isRoleSelectionModalOpen.set(true);
        },
        error: (error) => {
          console.error('Error al obtener roles del usuario:', error);
          // En caso de error, usar el rol del token como fallback para no dejar el dashboard vacío
          if (tokenRole) {
            this.authService.setCurrentRole(tokenRole);
          }
          this.router.navigate([this.returnUrl]);
        },
      });
    } catch (error) {
      console.error('Error en loadUserRolesAndNavigate:', error);
      const tokenRole = this.authService.getTokenRole();
      if (tokenRole) {
        this.authService.setCurrentRole(tokenRole);
      }
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Maneja la selección de rol del modal
   * Redirección DINÁMICA según rol
   */
  onRoleSelected(roleName: string): void {
    const normalizedRole = this.persistSelectedRole(roleName);

    console.log('🔐 Rol seleccionado:', normalizedRole);

    const redirectPath = this.getRedirectPathForRole(normalizedRole);

    this.isRoleSelectionModalOpen.set(false);

    console.log('📍 Navegando a:', redirectPath);
    this.router.navigate([redirectPath]);
  }

  /**
   * Persiste el rol elegido usando el nombre real del rol, no el id del registro.
   */
  private persistSelectedRole(roleIdOrName: string): string {
    const normalizedLookup = roleIdOrName.toLowerCase().trim();
    const selectedRole = this.userRoles().find((role) => {
      const roleId = role.id?.toLowerCase().trim();
      const roleName = role.name?.toLowerCase().trim();
      return roleId === normalizedLookup || roleName === normalizedLookup;
    });

    const roleName = (selectedRole?.name || roleIdOrName).toLowerCase().trim();
    localStorage.setItem('user_role', roleName);
    this.authService.setCurrentRole(roleName);
    return roleName;
  }

  /**
   * Resuelve la ruta de destino a partir del rol normalizado.
   */
  private getRedirectPathForRole(normalizedRole: string): string {
    if (normalizedRole.includes('administrador de empresa')) {
      this.toastService.success('✅ Accediendo como Administrador de Empresa');
      return '/registro-bus';
    }

    if (normalizedRole.includes('conductor')) {
      this.toastService.success('✅ Accediendo como Conductor');
      return '/dashboard';
    }

    if (normalizedRole.includes('administrador') || normalizedRole === '69b1f1e630276cc75c84424a') {
      this.toastService.success('✅ Accediendo como Administrador del Sistema');
      return '/admin/user-role';
    }

    if (
      normalizedRole.includes('analista') ||
      normalizedRole.includes('financiero') ||
      normalizedRole.includes('gerente') ||
      normalizedRole.includes('marketing')
    ) {
      this.toastService.success('✅ Accediendo a Analytics');
      return '/analytics';
    }

    if (normalizedRole.includes('ciudadano')) {
      this.toastService.success('✅ Accediendo como Ciudadano');
      return '/dashboard';
    }

    this.toastService.warning('⚠️ Rol no reconocido. Accediendo a dashboard por defecto');
    return '/dashboard';
  }

  /**
   * Cierra el modal de selección de roles
   */
  onRoleSelectionClosed(): void {
    this.isRoleSelectionModalOpen.set(false);
  }

  async cancelVerification(): Promise<void> {
    await this.authService.cancelPendingTwoFactorSession();
    this.stopTwoFactorTimer();
    this.isVerificationModalOpen = false;
    this.authService.clearTwoFactorStateAndSession();
    this.verificationForm.reset();
    this.verificationErrorMessage = '';
    this.router.navigate(['/login']);
  }

  onVerificationCodeInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const numericValue = (inputElement.value || '').replace(/\D/g, '').slice(0, 6);
    this.verificationForm.get('code')?.setValue(numericValue, { emitEvent: false });
    inputElement.value = numericValue;
  }

  onVerificationCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericValue = pastedText.replace(/\D/g, '').slice(0, 6);
    this.verificationForm.get('code')?.setValue(numericValue);
  }

  async resendTwoFactorCode(): Promise<void> {
    if (this.loginForm.invalid) {
      this.toastService.info('Para reenviar el código, vuelve a ingresar tus credenciales.');
      await this.cancelVerification();
      return;
    }

    this.toastService.info('Enviando un nuevo código de verificación...');
    await this.onSubmit();
  }

  private setupTwoFactorUiState(): void {
    this.maskedVerificationEmail = this.maskEmail(this.resolveTwoFactorEmail());

    let expiresAt = this.authService.getTwoFactorExpiresAt();
    if (!expiresAt || expiresAt <= Date.now()) {
      expiresAt = Date.now() + 5 * 60 * 1000;
      this.authService.setTwoFactorExpiresAt(expiresAt);
    }

    this.startTwoFactorTimer(expiresAt);
  }

  private resolveTwoFactorEmail(): string {
    const pendingEmail = this.authService.getPendingTwoFactorEmail();
    if (pendingEmail) {
      return pendingEmail;
    }

    const formEmail = this.loginForm.get('email')?.value;
    return typeof formEmail === 'string' ? formEmail : '';
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return 'em***@***.com';
    }

    const [localPart, domainPart] = email.split('@');
    const safeLocal =
      localPart.length <= 2 ? `${localPart[0] || 'e'}***` : `${localPart.slice(0, 2)}***`;
    const domainName = domainPart.split('.')[0] || '***';
    const tld = domainPart.includes('.') ? domainPart.slice(domainPart.indexOf('.')) : '.com';
    const safeDomain =
      domainName.length <= 2 ? `${domainName[0] || '*'}***` : `${domainName.slice(0, 2)}***`;

    return `${safeLocal}@${safeDomain}${tld}`;
  }

  private startTwoFactorTimer(expiresAtMs: number): void {
    this.stopTwoFactorTimer();

    const updateCountdown = () => {
      const millisecondsLeft = expiresAtMs - Date.now();

      if (millisecondsLeft <= 0) {
        this.twoFactorTimeLeftLabel = '00:00';
        this.handleTwoFactorExpired();
        return;
      }

      const totalSeconds = Math.floor(millisecondsLeft / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.twoFactorTimeLeftLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    updateCountdown();
    this.twoFactorTimerId = setInterval(updateCountdown, 1000);
  }

  private stopTwoFactorTimer(): void {
    if (this.twoFactorTimerId) {
      clearInterval(this.twoFactorTimerId);
      this.twoFactorTimerId = null;
    }
  }

  private async handleTwoFactorExpired(): Promise<void> {
    this.stopTwoFactorTimer();
    this.verificationErrorMessage = 'El código expiró. Debes iniciar sesión nuevamente.';
    this.toastService.warning(this.verificationErrorMessage);
    await this.authService.cancelPendingTwoFactorSession();
    this.authService.clearTwoFactorStateAndSession();
    this.isVerificationModalOpen = false;
    this.verificationForm.reset();
    this.router.navigate(['/login'], {
      queryParams: {
        message: 'El código expiró. Inicia sesión para solicitar uno nuevo.',
      },
    });
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

  /**
   * Redirige a la página de recuperación de contraseña
   */
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
