import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, shareReplay, timer } from 'rxjs';
import { map } from 'rxjs/operators'; // 👈 Importamos map para la normalización de datos
import { environment } from '../../../environments/environment';
import { DashboardResponse } from '../models/monitoreo.model';

export interface BusEnRuta {
  busId: number;
  placa: string;
  latitude: number;
  longitude: number;
  velocidad: number;
  ultimaActualizacion: string;
  paraderoMasCercano: {
    id: number;
    nombre: string;
    distanciaMetros: number;
  };
  tiempoEstimadoLlegada: number;
  estaRetrasado: boolean;
  minutosRetraso: number;
  estado: 'normal' | 'incidente'; // 👈 AGREGADO: Crucial para que el mapa pinte el marcador de color dinámico
  pasajerosActuales?: number;       // 👈 boletos 'activo' a bordo
  capacidadMaxima?: number | null;  // 👈 capacidad de referencia para alerta de ocupación
}

@Injectable({ providedIn: 'root' })
export class MonitoreoService {

  // Monitoreo vive en back-logic (NestJS :3000), no en back-sec (:8181)
  private apiUrl = environment.apiNestUrl;

  constructor(private http: HttpClient) {}

  getBusesActivosPorRuta(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return this.http.get<any>(
      `${this.apiUrl}/monitoreo/ruta/${rutaId}/buses-activos`
    ).pipe(
      // Nos aseguramos de mapear correctamente por si el backend responde con el objeto directo o envuelto
      map(response => {
        const datos = response.data ? response.data : response;
        return {
          data: (Array.isArray(datos) ? datos : []).map(bus => ({
            ...bus,
            // Si el backend no envía el campo 'estado', le asignamos por defecto 'normal'
            estado: bus.estado || 'normal',
            pasajerosActuales: bus.pasajerosActuales ?? 0,
            capacidadMaxima: bus.capacidadMaxima ?? null,
          }))
        };
      })
    );
  }

  getBusesActivosPolling(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return interval(10000).pipe(
      switchMap(() => this.getBusesActivosPorRuta(rutaId)),
      shareReplay(1)
    );
  }

  /**
   * 🗺️ Sincroniza la matemática de Haversine del backend con la interfaz esperada por el Front
   */
  getEtaParaParadero(busId: number, paraderoId: number): Observable<{ eta: number; distanciaKm: number }> {
    return this.http.get<any>(
      `${this.apiUrl}/monitoreo/bus/${busId}/eta/${paraderoId}`
    ).pipe(
      map(res => {
        // Adaptador inteligente: Mapeamos los datos del NestJS (etaMinutos/distanciaMetros) 
        // hacia lo que tus componentes de Angular ya esperan (eta/distanciaKm)
        return {
          eta: res.etaMinutos !== undefined ? res.etaMinutos : (res.eta ?? 0),
          distanciaKm: res.distanciaMetros !== undefined ? (res.distanciaMetros / 1000) : (res.distanciaKm ?? 0)
        };
      })
    );
  }

  getDashboardGeneralPolling(): Observable<DashboardResponse> {
    return timer(0, 30000).pipe(
      switchMap(() => this.http.get<DashboardResponse>(`${this.apiUrl}/monitoreo/dashboard`)),
      shareReplay(1)
    );
  }
}