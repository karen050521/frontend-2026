import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Definimos la interfaz aquí mismo para que TypeScript la reconozca de inmediato
export interface CitaPayload {
  tipoAtencion: string;
  tipoConsulta: string;
  inicio: string;
  fin: string;
  motivo: string;
  emailCiudadano: string;
}

@Injectable({ providedIn: 'root' })
export class CitaN8nService {
  private http = inject(HttpClient);
  private readonly N8N_ENDPOINT = 'http://localhost:5678/webhook/crear-cita';

  agendarCita(datosCita: CitaPayload): Observable<any> {
    return this.http.post(this.N8N_ENDPOINT, datosCita).pipe(
      catchError(error => {
        console.error('Error al conectar con N8N:', error);
        return throwError(() => new Error('Servicio de citas temporalmente no disponible'));
      })
    );
  }
}