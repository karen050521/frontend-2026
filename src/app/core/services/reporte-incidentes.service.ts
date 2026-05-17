import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DataTendencia {
  mes: string;
  tipo: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteIncidentesService {
  // 🏢 Ruta corregida alineada con el @Controller('admin/incidentes') del Back
  private readonly apiUrl = `${environment.apiNestUrl}/admin/incidentes/reportes/tendencia`;    

  constructor(private readonly http: HttpClient) {}

  obtenerTendencia(empresaId?: string): Observable<DataTendencia[]> {
    let params = new HttpParams();
    if (empresaId && empresaId !== 'todas') {
      params = params.set('empresaId', empresaId);
    }

    // 🛡️ Recuperamos el token JWT guardado en el navegador para saltar el Guard del Back
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Enviamos la petición HTTP con los parámetros de la empresa y las credenciales de seguridad
    return this.http.get<DataTendencia[]>(this.apiUrl, { params, headers });
  }
}