import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, shareReplay, timer } from 'rxjs';
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
}

@Injectable({ providedIn: 'root' })
export class MonitoreoService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getBusesActivosPorRuta(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return this.http.get<{ data: BusEnRuta[] }>(
      `${this.apiUrl}/monitoreo/ruta/${rutaId}/buses-activos`
    );
  }

  getBusesActivosPolling(rutaId: number): Observable<{ data: BusEnRuta[] }> {
    return interval(10000).pipe(
      switchMap(() => this.getBusesActivosPorRuta(rutaId)),
      shareReplay(1)
    );
  }

  getEtaParaParadero(busId: number, paraderoId: number): Observable<{ eta: number; distanciaKm: number }> {
    return this.http.get<{ eta: number; distanciaKm: number }>(
      `${this.apiUrl}/monitoreo/bus/${busId}/eta/${paraderoId}`
    );
  }

  getDashboardGeneralPolling(): Observable<DashboardResponse> {
    return timer(0, 30000).pipe(
      switchMap(() => this.http.get<DashboardResponse>(`${this.apiUrl}/monitoreo/dashboard`)),
      shareReplay(1)
    );
  }
}