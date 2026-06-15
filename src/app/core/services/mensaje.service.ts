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

getHistorialGrupo(grupoId: number, personaId?: string): Observable<any[]> {
    // Si viene el personaId, lo añadimos como Query Param (?personaId=xxx)
    const url = personaId 
      ? `${this.apiUrl}/grupo/${grupoId}?personaId=${personaId}`
      : `${this.apiUrl}/grupo/${grupoId}`;
      
    return this.http.get<any[]>(url);
  }

  enviarMensajeGrupo(emisorId: string, grupoId: number, contenido: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-grupo`, { emisorId, grupoId, contenido });
  }

  getHistorialPrivado(emisorId: string, receptorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/privado/${emisorId}/${receptorId}`);
  }
}