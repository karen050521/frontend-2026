import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajusta la ruta a tu environment

export interface InicioTurnoDto {
  estadoBusConfirmado: 'operativo' | 'con_observaciones';
  observaciones?: string;
}

// Interfaz para la finalización del turno
export interface FinalizarTurnoDto {
  estado: 'finalizado';
}

// 🚀 CORREGIDO: conductorId cambiado a string para admitir tu UUID largo
export interface CreateTurnoDto {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  conductorId?: string; // 👈 Cambiado de number a string
  busId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/turnos`; // Asegúrate de que apunte a tu API NestJS

  /**
   * Módulo de Gerencia
   * Enviar los datos para crear un nuevo turno de forma manual
   */
  crearTurnoManual(turno: CreateTurnoDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, turno);
  }

  /**
   * Módulo de Conductores
   * Obtener los turnos del conductor autenticado (para listarlos en su pantalla)
   */
  obtenerMisTurnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-turnos`);
  }

  /**
   * Módulo de Conductores
   * Enviar la confirmation para iniciar el turno actual
   */
  iniciarTurno(turnoId: number, datos: InicioTurnoDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${turnoId}/iniciar`, datos);
  }

  /**
   * 🚀 NUEVO: Módulo de Conductores
   * Enviar la solicitud para finalizar la ruta y cerrar la jornada
   */
  finalizarTurno(turnoId: number, datos: FinalizarTurnoDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${turnoId}/finalizar`, datos);
  }
}