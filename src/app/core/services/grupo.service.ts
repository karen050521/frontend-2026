import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/grupo`;

  public crearGrupo(grupo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, grupo);
  }

  public getGruposPorPersona(personaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/persona/${personaId}`);
  }

  // NUEVO: Obtener grupos donde NO estoy
  public getPublicosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicos/disponibles`);
  }

  // NUEVO: Unirse a un grupo
  public unirseAGrupo(grupoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${grupoId}/unirse`, {});
  }

  // AÑADE ESTO:
  public enviarMensaje(mensaje: any): Observable<any> {
    // Ajusta la URL si en tu backend es diferente (ej: ${this.apiUrl}/mensajes)
    return this.http.post<any>(`${this.apiUrl}/mensajes`, mensaje);
  }

  // --------------------------------------------------------
  // ADMINISTRACIÓN DE MIEMBROS (HU-010)
  // --------------------------------------------------------

  obtenerMiembros(grupoId: number, search: string = '') {
    let url = `${this.apiUrl}/${grupoId}/miembros`; // <-- Corregido
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    return this.http.get<any[]>(url);
  }

  promoverAdmin(grupoId: number, personaId: string) {
    return this.http.patch(`${this.apiUrl}/${grupoId}/miembros/${personaId}/promover`, {}); // <-- Corregido
  }

  removerMiembro(grupoId: number, personaId: string) {
    return this.http.delete(`${this.apiUrl}/${grupoId}/miembros/${personaId}`); // <-- Corregido
  }

  bloquearMiembro(grupoId: number, personaId: string) {
    return this.http.patch(`${this.apiUrl}/${grupoId}/miembros/${personaId}/bloquear`, {}); // <-- Corregido
  }

  obtenerLogsMembresia(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${grupoId}/membresia-logs`);
  }
  
}