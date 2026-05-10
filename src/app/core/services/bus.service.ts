import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusService {
  private readonly http = inject(HttpClient);
  // Asegúrate de que esta URL termine en /bus
  private readonly baseUrl = `${environment.apiNestUrl}/bus`;

  // 1. Crear (POST) - Ya lo tenías
  registrarBus(data: any, foto?: File | null): Observable<any> {
    const formData = new FormData();
    formData.append('placa', data.placa);
    formData.append('modelo', data.modelo);
    formData.append('anio', data.anio.toString());
    formData.append('capacidad_sentados', data.capacidad_sentados.toString());
    formData.append('capacidad_parados', data.capacidad_parados.toString());
    formData.append('estado', data.estado);
    if (foto) formData.append('foto', foto);
    
    return this.http.post<any>(this.baseUrl, formData);
  }

  // 2. Leer todos (GET) - Para llenar tu cuadrito
  listarBuses(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // 3. Actualizar Estado (PATCH)
  actualizarEstado(id: number, estado: string): Observable<any> {
    // Mandamos el objeto con el campo 'estado' como espera el @Body() en Nest
    return this.http.patch<any>(`${this.baseUrl}/${id}`, { estado });
  }

  // 4. Eliminar (DELETE)
  eliminarBus(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  // Aliases / API conveniencia para nombres solicitados
  findAll(): Observable<any[]> {
    return this.listarBuses();
  }

  /**
   * update: actualiza únicamente el estado del bus
   */
  update(id: number, estado: string): Observable<any> {
    return this.actualizarEstado(id, estado);
  }

  remove(id: number): Observable<any> {
    return this.eliminarBus(id);
  }
}