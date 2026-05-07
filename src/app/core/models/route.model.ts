/**
 * Interface para representar una ruta de autobús
 */
export interface Route {
  id: string;
  name: string;
  description: string;
  fare: number;
  startPoint?: string;
  endPoint?: string;
  distance?: number;
  estimatedTime?: string;
  stops?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Response del backend al obtener rutas
 */
export interface RoutesResponse {
  data: Route[];
  total: number;
  page?: number;
  limit?: number;
}
