import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CitaN8nService {
  private http = inject(HttpClient);
  // Esta es la dirección de tu N8N, actuando como el backend de citas
  private readonly N8N_ENDPOINT = 'http://localhost:5678/webhook/crear-cita';

  agendarCita(datosCita: any): Observable<any> {
    return this.http.post(this.N8N_ENDPOINT, datosCita);
  }
}