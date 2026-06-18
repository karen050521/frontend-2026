import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definimos las interfaces para tener tipado fuerte en Angular
export interface CreatePqrsDto {
  type: 'Petición' | 'Queja' | 'Reclamo' | 'Sugerencia';
  category: 'Conductor' | 'Bus' | 'Ruta' | 'Tarjeta' | 'Otro';
  description: string;
  email: string;
  images?: string[]; // Array de strings en Base64
}

export interface PqrsResponse {
  message: string;
  radicado: string;
  status: string;
  estimatedResponseDate: string;
}

export interface PqrsStatusResponse {
  found: boolean;
  message?: string;
  pqrs?: {
    radicado: string;
    type: string;
    category: string;
    description: string;
    status: string;
    createdAt: string;
    dueDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PqrsService {
  // Ajusta esta URL según el puerto y ruta global donde corra tu NestJS
  private apiUrl = 'http://localhost:3000/pqrs'; 

  constructor(private http: HttpClient) {}

  // 1. Enviar una nueva PQRS
  createPqrs(pqrsData: CreatePqrsDto): Observable<PqrsResponse> {
    return this.http.post<PqrsResponse>(this.apiUrl, pqrsData);
  }

  // 2. Consultar el estado por número de radicado
  getTracking(radicado: string): Observable<PqrsStatusResponse> {
    return this.http.get<PqrsStatusResponse>(`${this.apiUrl}/${radicado}`);
  }
}