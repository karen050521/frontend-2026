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

  // QUITAMOS las inyecciones de grupoService y personaService de aquí.
  // Un servicio solo debe inyectar lo que REALMENTE usa (como HttpClient).

  /**
   * Crea un nuevo grupo (Comunidad)
   */
  public crearGrupo(grupo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, grupo);
  }

  /**
   * Obtiene los grupos a los que pertenece una persona
   */
  public getGruposPorPersona(personaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/persona/${personaId}`);
  }
}