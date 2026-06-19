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
  // ✨ NUEVO: HU-ENTR-3-007 - Obtener bandeja de entrada con filtros
  getBandejaEntrada(
    personaId: string, 
    filtros: { tipo?: string; estado?: string; fecha?: string } = {}
  ): Observable<{ mensajes: any[]; contadorNoLeidos: number }> {
    let params: any = {};
    
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.fecha) params.fecha = filtros.fecha;

    return this.http.get<{ mensajes: any[]; contadorNoLeidos: number }>(
      `${this.apiUrl}/bandeja-entrada/${personaId}`, 
      { params }
    );
  }

  // ✨ NUEVO: HU-ENTR-3-007 - Marcar mensaje como leído individualmente
  marcarComoLeido(mensajeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${mensajeId}/invertir-o-leer` ? `${this.apiUrl}/${mensajeId}/leer` : `${this.apiUrl}/${mensajeId}/leer`, {});
  }

  // ✨ HU-3-005: lista de quién leyó un mensaje de grupo (emisor/admin)
  getLecturas(mensajeId: number): Observable<{ personaId: string; nombre: string; fechaLeida: string }[]> {
    return this.http.get<{ personaId: string; nombre: string; fechaLeida: string }[]>(
      `${this.apiUrl}/${mensajeId}/lecturas`
    );
  }

  // ✨ HU-3-005: borrado por admin (soft-delete). personaId valida rol en back.
  eliminarMensaje(mensajeId: number, personaId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${mensajeId}?personaId=${personaId}`);
  }

}