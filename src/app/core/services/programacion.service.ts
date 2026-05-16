import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateProgramacionDto {
  busId: number;
  rutaId: number;
  fecha: string;
  horaSalida: string;
  margenToleranciaMinutos?: number;
  tipoRecurrencia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgramacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/programacion`;

  // Crear una nueva programación (o lote de recurrentes)
  crear(dto: CreateProgramacionDto): Observable<any[]> {
    return this.http.post<any[]>(this.baseUrl, dto);
  }

  // Listar todas las programaciones para la tabla de consulta del Gerente
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // Obtener detalles de una programación específica si es necesario
  findOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}