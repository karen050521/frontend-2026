import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutaService } from '../../../core/services/ruta.service';
import { BusService } from '../../../core/services/bus.service';
import { ToastService } from '../../../core/services/toast.service';
import { RutaLista } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citizen-dashboard.component.html',
  styleUrl: './citizen-dashboard.component.css',
})
export class CitizenDashboardComponent implements OnInit {
  protected routes = signal<RutaLista[]>([]);
  protected isLoadingRoutes = signal<boolean>(false);
  protected searchParaderos = signal<string>('');
  protected saldo = signal<number>(45250); // Saldo en pesos COP
  protected recentTrips = signal<any[]>([]);

  constructor(
    private rutaService: RutaService,
    private busService: BusService,
    private toastService: ToastService,
    private router: Router,
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
    this.rutaService.obtenerRutas().subscribe({
      next: (response) => {
        this.routes.set(response || []);
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
   * Redirige a la pantalla interactiva de paraderos cercanos
   */
  protected buscarParadero(): void {
    this.router.navigate(['/paraderos-cercanos']);
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
    this.router.navigate(['/recarga']);
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
  protected comprarBoleto(route: RutaLista): void {
    this.toastService.info(`Boleto para ${route.nombre} - Redirigiendo...`);
  }
}
