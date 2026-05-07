import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouteService } from '../../../core/services/route.service';
import { Route } from '../../../core/models/route.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-all-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-routes.component.html',
  styleUrls: ['./all-routes.component.css'],
})
export class AllRoutesComponent implements OnInit, OnDestroy {
  protected routes = signal<Route[]>([]);
  protected isLoading = signal<boolean>(true);
  protected searchQuery = signal<string>('');
  protected filteredRoutes = signal<Route[]>([]);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private routeService: RouteService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAllRoutes();

    // Configurar el debounce para la búsqueda
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.performSearch(query);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todas las rutas del backend
   */
  protected loadAllRoutes(): void {
    this.isLoading.set(true);
    this.routeService
      .getAllRoutes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.routes.set(response.data || []);
          this.filteredRoutes.set(response.data || []);
          this.isLoading.set(false);
          this.toastService.success('Rutas cargadas correctamente');
        },
        error: (error) => {
          console.error('Error cargando rutas:', error);
          this.isLoading.set(false);
          this.toastService.error('Error al cargar las rutas');
        },
      });
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  protected onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  /**
   * Realiza la búsqueda
   */
  private performSearch(query: string): void {
    if (!query || query.trim() === '') {
      // Si la búsqueda está vacía, mostrar todas las rutas
      this.filteredRoutes.set(this.routes());
      return;
    }

    // Buscar usando el servicio
    this.routeService
      .searchRoutes(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filteredRoutes.set(response.data || []);
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.toastService.error('Error al buscar rutas');
        },
      });
  }

  /**
   * Limpia la búsqueda
   */
  protected clearSearch(): void {
    this.searchQuery.set('');
    this.filteredRoutes.set(this.routes());
  }

  /**
   * Formatea la tarifa como moneda
   */
  protected formatCurrency(fare: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(fare);
  }
}
