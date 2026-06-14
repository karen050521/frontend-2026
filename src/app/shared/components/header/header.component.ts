import { Component, signal, output, inject, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service'; // ✨ IMPORTADO
import { Subscription } from 'rxjs'; // ✨ IMPORTADO

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notiService = inject(NotificacionService); // ✨ INYECTADO

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);
  protected readonly isNotificationsOpen = signal(false); // Controlador para el menú de la campana

  // ✨ SIGNALS PARA LA ALERTA DEL BUS
  protected alertaBus = signal<any>(null);
  protected unreadCount = signal<number>(0);
  private alertaSub?: Subscription;

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly defaultAvatarUrl = 'assets/default-avatar.svg';
  protected readonly avatarUrl = computed(() => {
    const photoUrl = this.currentUser()?.photoUrl;
    return photoUrl && photoUrl.trim().length > 0 ? photoUrl : this.defaultAvatarUrl;
  });

  public readonly menuToggle = output<void>();
  public readonly themeToggle = output<void>();
  public readonly search = output<string>();

  ngOnInit(): void {
    // ✨ ESCUCHAR ALERTA DE BUS EN TIEMPO REAL
    this.alertaSub = this.notiService.alertaBus$.subscribe(alerta => {
      this.alertaBus.set(alerta);
      this.unreadCount.update(c => c + 1);
      this.isNotificationsOpen.set(true); // Abrimos el panel automáticamente para que el usuario lo vea
    });
  }

  ngOnDestroy(): void {
    this.alertaSub?.unsubscribe();
  }

  // ✨ FUNCIÓN PARA CERRAR LA TARJETA AMARILLA
  protected cerrarAlertaBus(): void {
    this.alertaBus.set(null);
    this.unreadCount.update(c => c > 0 ? c - 1 : 0);
  }

  protected toggleMobileMenu(): void { this.isMobileMenuOpen.update((v) => !v); }
  protected onThemeToggle(): void { this.themeToggle.emit(); }
  protected onMenuToggle(): void { this.menuToggle.emit(); }
  protected onSearch(query: string): void { this.search.emit(query); }
  protected toggleUserMenu(): void { this.isUserMenuOpen.update((v) => !v); }
  protected closeUserMenu(): void { this.isUserMenuOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.relative');
    if (!clickedInside && this.isUserMenuOpen()) this.closeUserMenu();
  }

  protected onLogin(): void {
    this.authService.autoLogin();
    this.closeUserMenu();
  }

  protected goToDashboard(): void { this.router.navigate(['/dashboard']); }
  
  protected onLogout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.router.navigate(['/login']);
  }

  protected getAvatarUrl(): string { return this.avatarUrl(); }
  protected onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes(this.defaultAvatarUrl)) img.src = this.defaultAvatarUrl;
  }
}