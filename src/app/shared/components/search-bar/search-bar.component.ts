import { Component, signal, output, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  // Inyecciones
  private readonly notiService = inject(NotificacionService);
  private readonly authService = inject(AuthService);

  // Signals y Estado
  protected readonly searchQuery = signal('');
  protected readonly notificaciones = signal<any[]>([]);
  protected readonly unreadCount = signal(0);
  protected readonly showDropdown = signal(false);
  
  public readonly search = output<string>();

  constructor() {
    // Definimos el efecto aquí para cumplir con el Injection Context
    effect(() => {
      const user = this.authService.currentUser() as any;
      
      console.log('🔍 [SearchBar] Usuario detectado:', user);
      
      if (user && (user.id || user._id)) {
        // Manejamos ambos posibles casos: id o _id
        const userId = user.id || user._id;
        console.log('🔔 [SearchBar] Cargando notificaciones para ID:', userId);
        this.cargarNotificaciones(userId);
      } else {
        console.warn('⚠️ [SearchBar] No se encontró ID en el objeto de usuario');
      }
    }, { allowSignalWrites: true });
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
        console.log('📋 Notificaciones recibidas de la BD:', notis);
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
      // Usamos el ID que venga de la base de datos (id o _id)
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