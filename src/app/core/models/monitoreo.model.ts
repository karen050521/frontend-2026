// HU-3-002: incidente activo (no resuelto) que muestra el panel del supervisor.
export interface IncidenteDashboard {
  id: number;
  busId: number;
  placa: string;
  descripcion: string;
  gravedad: 'bajo' | 'medio' | 'alto' | 'critico';
  estado: 'pendiente' | 'en_revision' | 'resuelto';
  fecha: string;
}

// Contrato unificado que devuelve GET /monitoreo/dashboard (back-logic).
// El mapa se alimenta del socket 'actualizacionFlotaGlobal'; estos son los KPIs (polling 30s).
export interface DashboardResponse {
  pasajerosEnTransito: number;
  busesOperando: number;
  totalActivos: number; // alias de busesOperando
  incidentes: IncidenteDashboard[];
  incidentesActivos: number;
  alertasOcupacion: number;
}
