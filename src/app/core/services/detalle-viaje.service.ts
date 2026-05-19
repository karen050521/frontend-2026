import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs';
import { DetalleViajeResponse } from '../models/detalle-viaje.model';

@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  private apiUrl = 'http://localhost:3000/api/boletos'; // Ajusta a tu URL

  constructor(private http: HttpClient) {}

  obtenerRecorridoViaje(boletoId: number): Observable<DetalleViajeResponse> {
    return this.http.get<DetalleViajeResponse>(`${this.apiUrl}/${boletoId}/recorrido`);
  }
}