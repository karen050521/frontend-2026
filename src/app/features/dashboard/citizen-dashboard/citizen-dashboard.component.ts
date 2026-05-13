import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../../core/services/route.service';
import { BusService } from '../../../core/services/bus.service';
import { ToastService } from '../../../core/services/toast.service';
import { BoletosComponent } from '../../boletos/boletos.component';
import { Route } from '../../../core/models/route.model';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BoletosComponent],
  templateUrl: './citizen-dashboard.component.html',
  styleUrl: './citizen-dashboard.component.css',
})
export class CitizenDashboardComponent implements OnInit {
  protected routes = signal<Route[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected searchParaderos = signal<string>('');
  protected saldo = signal<number>(45250); // Saldo en pesos COP
  protected recentTrips = signal<any[]>([]);
  protected activeTab = signal<'rutas' | 'boletos'>('rutas');

  constructor(
    private routeService: RouteService,
    private busService: BusService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadRoutes();
    this.loadRecentTrips();
  }

  /**
   * Carga las rutas disponibles
   */
  protected loadRoutes(): void {
    this.isLoadingRoutes.set(true);
    this.routeService.getAllRoutes().subscribe({
      next: (response) => {
        this.routes.set(response.data || []);
        this.isLoadingRoutes.set(false);
      },
      error: (error) => {
        console.error('Error cargando rutas:', error);
        this.toastService.error('No se pudieron cargar las rutas');
        this.isLoadingRoutes.set(false);
      },
    });
  }

  /**
   * Busca rutas por paradero
   */
  protected buscarParadero(): void {
    if (!this.searchParaderos().trim()) {
      this.toastService.warning('Ingresa un paradero para buscar');
      return;
    }

    this.isLoadingRoutes.set(true);
    this.routeService.searchRoutes(this.searchParaderos()).subscribe({
      next: (response) => {
        this.routes.set(response.data || []);
        this.isLoadingRoutes.set(false);
        this.toastService.success('Búsqueda realizada');
      },
      error: (error) => {
        console.error('Error buscando paradero:', error);
        this.toastService.error('Error en la búsqueda');
        this.isLoadingRoutes.set(false);
      },
    });
  }

  /**
   * Carga los viajes recientes del usuario
   */
  protected loadRecentTrips(): void {
    // Placeholder: simular datos de viajes recientes
    this.recentTrips.set([
      {
        id: 1,
        route: 'Centro - Aeropuerto',
        date: '2024-05-12',
        fare: 8500,
        status: 'Completado',
      },
      {
        id: 2,
        route: 'Norte - Sur',
        date: '2024-05-11',
        fare: 6200,
        status: 'Completado',
      },
    ]);
  }

  /**
   * Inicia recarga de saldo
   */
  protected iniciarRecarga(): void {
    this.toastService.info('Módulo de recarga próximamente disponible');
  }

  /**
   * Formatea moneda
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  }

  /**
   * Compra un boleto
   */
  protected comprarBoleto(route: Route): void {
    this.toastService.info(`Boleto para ${route.name} - Redirigiendo...`);
  }

  /**
   * Cambia la pestaña activa
   */
  protected switchTab(tab: 'rutas' | 'boletos'): void {
    this.activeTab.set(tab);
  }
}
