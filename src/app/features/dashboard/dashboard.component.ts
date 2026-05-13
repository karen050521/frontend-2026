import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CitizenDashboardComponent } from './citizen-dashboard/citizen-dashboard.component';
import { ConductorDashboardComponent } from './conductor-dashboard/conductor-dashboard.component';
import { CompanyDashboardComponent } from './company-dashboard/company-dashboard.component';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';

/**
 * DashboardComponent - Dashboard dinámico según rol
 * Renderiza diferentes sub-dashboards basado en el rol del usuario
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CitizenDashboardComponent,
    ConductorDashboardComponent,
    CompanyDashboardComponent,
    AnalyticsDashboardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected isLoading = signal<boolean>(false);
  protected activeTab = signal<
    'solicitudes' | 'historial' | 'favoritos' | 'todas-las-rutas' | 'boletos'
  >('solicitudes');

  // Signal del rol actual
  protected userRole = computed(() => {
    const role = this.authService.activeRole() || localStorage.getItem('user_role') || '';
    return role.toLowerCase().trim();
  });

  // Señales para cada tipo de rol
  protected isCitizen = computed(() => {
    const role = this.userRole();
    return role.includes('ciudadano') || role === '';
  });

  protected isConductor = computed(() => {
    const role = this.userRole();
    return role.includes('conductor');
  });

  protected isCompanyAdmin = computed(() => {
    const role = this.userRole();
    return role.includes('administrador de empresa') || role.includes('company');
  });

  protected isAdmin = computed(() => {
    const role = this.userRole();
    return role.includes('administrador') || role === '69b1f1e630276cc75c84424a';
  });

  protected isAnalyst = computed(() => {
    const role = this.userRole();
    return (
      role.includes('analista') ||
      role.includes('financiero') ||
      role.includes('gerente') ||
      role.includes('marketing')
    );
  });

  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {}

  protected get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    console.log('👤 Dashboard cargado para:', this.currentUser?.name);
    console.log('🔐 Rol activo:', this.userRole());

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'boletos') {
        this.verMisBoletos();
      } else if (tab === 'todas-las-rutas') {
        this.verTodasLasRutas();
      }
    });
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
