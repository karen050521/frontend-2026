export interface BusDashboard {
  busId: number;
  placa: string;
  latitud: number;
  longitud: number;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  tieneIncidente: boolean;
  pasajerosEnTransito: number;
}

export interface DashboardResponse {
  buses: BusDashboard[];
  totalActivos: number;
  incidentesActivos: number;
  alertasOcupacion: number;
}