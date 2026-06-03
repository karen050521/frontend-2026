import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajustado según tu ejemplo

@Injectable({
  providedIn: 'root',
})
export class PersonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/persona`;

  /**
   * HU-006: Buscar personas por nombre para agregar a la comunidad
   * El permiso en tu sistema: GET /persona/buscar/?
   */
public buscarPorNombre(nombre: string, excluirId?: string): Observable<any[]> {
    const params: any = { nombre };
    if (excluirId) {
      params.excluirId = excluirId;
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * Obtener los detalles de una persona por su UUID
   */
  public obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}