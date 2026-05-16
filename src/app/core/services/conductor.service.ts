// src/app/core/services/conductor.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajusta la ruta a tu environment

@Injectable({
  providedIn: 'root'
})
export class ConductorService {
  private readonly http = inject(HttpClient);
  // Apunta directamente al controlador de conductores que acabamos de limpiar en el backend
  private readonly apiUrl = `${environment.apiNestUrl}/conductores`; 

  /**
   * MÓDULO GERENCIA: Trae todos los conductores reales desde la base de datos
   */
  obtenerConductores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}