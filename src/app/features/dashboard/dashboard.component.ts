import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { AllRoutesComponent } from './all-routes/all-routes.component';
import { BoletosComponent } from '../boletos/boletos.component';

/**
 * DashboardComponent - Dashboard principal para usuarios (consumidores)
 * Vista para solicitar servicios (buses, etc.)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ToastContainerComponent, AllRoutesComponent, BoletosComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  protected isLoading = signal<boolean>(false);
  protected activeTab = signal<'solicitudes' | 'historial' | 'favoritos' | 'todas-las-rutas' | 'boletos'>('solicitudes');

  constructor(
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  protected get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    console.log('👤 Dashboard cargado para:', this.currentUser?.name);
  }

  /**
   * Inicia una nueva solicitud de bus
   */
  protected iniciarSolicitud(): void {
    console.log('🚌 Iniciando nueva solicitud...');
    this.toastService.info('Funcionalidad próximamente disponible');
  }

  /**
   * Abre el historial
   */
  protected abrirHistorial(): void {
    this.activeTab.set('historial');
  }

  /**
   * Abre favoritos
   */
  protected abrirFavoritos(): void {
    this.activeTab.set('favoritos');
  }

  /**
   * Cambia a tab de solicitudes
   */
  protected irASolicitudes(): void {
    this.activeTab.set('solicitudes');
  }

  /**
   * Abre todas las rutas
   */
  protected verTodasLasRutas(): void {
    this.activeTab.set('todas-las-rutas');
  }

  /**
   * Abre la sección de boletos
   */
  protected verMisBoletos(): void {
    this.activeTab.set('boletos');
  }

  /**
   * Obtiene nombre del usuario
   */
  protected getNombreUsuario(): string {
    return this.currentUser?.name?.split(' ')[0] || 'Usuario';
  }

  /**
   * Obtiene saludo según hora del día
   */
  protected getSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días';
    if (hora < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }
}
