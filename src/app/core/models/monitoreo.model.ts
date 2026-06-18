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

// Bus para el mapa del supervisor (posición leída de la BD: ubicaciones_bus o bus.gps).
export interface BusMapa {
  busId: number;
  placa: string;
  latitud: number;
  longitud: number;
  estado: 'normal' | 'incidente';
  pasajerosCalculados: number;
  capacidadMaxima: number | null;
  velocidad: number;
}

// Contrato unificado que devuelve GET /monitoreo/dashboard (back-logic).
// `buses` pinta el mapa desde la BD; el socket 'actualizacionFlotaGlobal' actualiza en vivo encima.
export interface DashboardResponse {
  buses: BusMapa[];
  pasajerosEnTransito: number;
  busesOperando: number;
  totalActivos: number; // alias de busesOperando
  incidentes: IncidenteDashboard[];
  incidentesActivos: number;
  alertasOcupacion: number;
}
