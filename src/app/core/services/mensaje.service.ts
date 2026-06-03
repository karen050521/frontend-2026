import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/mensajes`;

  getHistorialGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/grupo/${grupoId}`);
  }

  enviarMensajeGrupo(emisorId: string, grupoId: number, contenido: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-grupo`, { emisorId, grupoId, contenido });
  }
}