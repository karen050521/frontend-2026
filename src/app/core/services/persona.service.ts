import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PersonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiNestUrl}/persona`;

  // Cambiamos el nombre y los parámetros para que coincidan con el Backend
  public buscar(query: string, excluirId?: string): Observable<any[]> {
    const params: any = { query }; // Backend espera 'query'
    if (excluirId) {
      params.excluirId = excluirId;
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params });
  }

  public obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}