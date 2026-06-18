import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  // Inyección de HttpClient para la sincronización
  private http = inject(HttpClient);

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
    // HU-3-002: el supervisor/gerente de operaciones ve el panel de flota (company-dashboard).
    return (
      role.includes('administrador de empresa') ||
      role.includes('company') ||
      role.includes('operaciones') ||
      role.includes('supervisor')
    );
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

    // --- SINCRONIZACIÓN AUTOMÁTICA CON EL BACKEND ---
    if (this.isCitizen()) {
      this.sincronizarConBackend();
    }
    // ------------------------------------------------

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
   * Envía los datos del usuario logueado al backend de NestJS
   * para asegurar que el ciudadano exista en MySQL.
   */
  private sincronizarConBackend(): void {
    const payload = this.authService.currentUser(); // Obtenemos info del signal de auth
    
    if (payload && payload.email) {
      console.log('🔄 Sincronizando datos de ciudadano...');
      
      // Ajustamos el payload para que el back lo entienda (name vs nombre)
      const syncData = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: 'Ciudadano'
      };

      this.http.post('http://localhost:3000/ciudadano/find-or-create', syncData)
        .subscribe({
          next: (res) => console.log('✅ Sincronización exitosa:', res),
          error: (err) => console.error('❌ Error de sincronización:', err)
        });
    }
  }

  /**
   * Inicia una nueva solicitud de bus
   */
  protected iniciarSolicitud(): void {
    console.log('🚌 Iniciando nueva solicitud...');
    this.toastService.info('Funcionalidad próximamente disponible');
  }

  protected abrirHistorial(): void {
    this.activeTab.set('historial');
  }

  protected abrirFavoritos(): void {
    this.activeTab.set('favoritos');
  }

  protected irASolicitudes(): void {
    this.activeTab.set('solicitudes');
  }

  protected verTodasLasRutas(): void {
    this.activeTab.set('todas-las-rutas');
  }

  protected verMisBoletos(): void {
    this.activeTab.set('boletos');
  }

  protected getNombreUsuario(): string {
    return this.currentUser?.name?.split(' ')[0] || 'Usuario';
  }

  protected getSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días';
    if (hora < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }
}