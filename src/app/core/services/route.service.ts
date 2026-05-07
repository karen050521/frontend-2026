import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Route, RoutesResponse } from '../models/route.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${environment.apiBaseUrl}/routes`;
  }

  /**
   * Obtiene todas las rutas
   */
  getAllRoutes(): Observable<RoutesResponse> {
    return this.http.get<RoutesResponse>(this.apiUrl);
  }

  /**
   * Busca rutas por nombre
   * @param searchTerm - Término de búsqueda (nombre de ruta)
   */
  searchRoutes(searchTerm: string): Observable<RoutesResponse> {
    let params = new HttpParams();
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }
    return this.http.get<RoutesResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene una ruta por ID
   * @param id - ID de la ruta
   */
  getRouteById(id: string): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene rutas con filtros avanzados
   * @param filters - Objeto con filtros (nombre, precio máximo, etc.)
   */
  getRoutesWithFilters(filters: {
    search?: string;
    maxFare?: number;
    minFare?: number;
    page?: number;
    limit?: number;
  }): Observable<RoutesResponse> {
    let params = new HttpParams();

    if (filters.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.maxFare !== undefined) {
      params = params.set('maxFare', filters.maxFare.toString());
    }
    if (filters.minFare !== undefined) {
      params = params.set('minFare', filters.minFare.toString());
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<RoutesResponse>(this.apiUrl, { params });
  }
}
