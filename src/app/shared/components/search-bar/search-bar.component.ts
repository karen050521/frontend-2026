import { Component, signal, output, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // Inyecciones
  private readonly notiService = inject(NotificacionService);
  private readonly authService = inject(AuthService);

  // Suscripciones
  private refreshSub?: Subscription;

  // Signals y Estado
  protected readonly searchQuery = signal('');
  protected readonly notificaciones = signal<any[]>([]);
  protected readonly unreadCount = signal(0);
  protected readonly showDropdown = signal(false);
  
  public readonly search = output<string>();

  constructor() {
    // Efecto para carga inicial o cambios de usuario
    effect(() => {
      const user = this.authService.currentUser() as any;
      
      if (user && (user.id || user._id)) {
        const userId = user.id || user._id;
        this.cargarNotificaciones(userId);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Escuchamos el "timbre" del servicio para recargar cuando se una a un grupo
    this.refreshSub = this.notiService.refreshNotifications$.subscribe(() => {
      const user = this.authService.currentUser() as any;
      if (user) {
        const userId = user.id || user._id;
        console.log('🔄 [SearchBar] Recargando notificaciones por evento externo...');
        this.cargarNotificaciones(userId);
      }
    });
  }

  ngOnDestroy(): void {
    // Limpieza de suscripción para evitar memory leaks
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  private cargarNotificaciones(userId: string): void {
    // 1. Obtener conteo de no leídas
    this.notiService.getUnreadCount(userId).subscribe({
      next: (count: number) => {
        this.unreadCount.set(count);
      },
      error: (err) => console.error('❌ Error al contar no leídas:', err)
    });
    
    // 2. Obtener lista de notificaciones
    this.notiService.getNotificaciones(userId).subscribe({
      next: (notis: any[]) => {
        console.log('📋 Notificaciones actualizadas:', notis);
        this.notificaciones.set(notis);
      },
      error: (err) => console.error('❌ Error al obtener notificaciones:', err)
    });
  }

  protected toggleNotificaciones(): void {
    this.showDropdown.update(v => !v);
  }

  protected marcarLeida(noti: any): void {
    if (!noti.leida) {
      const notiId = noti.id || noti._id;
      this.notiService.marcarComoLeida(notiId).subscribe({
        next: () => {
          noti.leida = true;
          this.unreadCount.update(c => Math.max(0, c - 1));
        },
        error: (err) => console.error('❌ Error al marcar como leída:', err)
      });
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search.emit(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.search.emit('');
  }
}