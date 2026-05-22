import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs';
import { DetalleViajeResponse } from '../models/detalle-viaje.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  private apiUrl = `${environment.apiNestUrl}${environment.apiEndpoints.boletos}`;

  constructor(private http: HttpClient) {}

  obtenerRecorridoViaje(boletoId: number): Observable<DetalleViajeResponse> {
    return this.http.get<DetalleViajeResponse>(`${this.apiUrl}/${boletoId}/recorrido`);
  }
}