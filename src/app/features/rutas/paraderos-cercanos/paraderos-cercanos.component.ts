import { Component, signal, effect, ElementRef, ViewChild, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ParaderoService } from '../../../core/services/paradero.service';
import { Paradero } from '../../../core/models/ruta.model';@Component({
    selector: 'app-paraderos-cercanos',
    imports: [CommonModule],
    templateUrl: './paraderos-cercanos.component.html',
    styleUrls: ['./paraderos-cercanos.component.css']
})
export class ParaderosCercanosComponent implements OnInit, OnDestroy {
  @ViewChild('mapaContainer', { static: true }) mapaContainer!: ElementRef;
  private paraderoService = inject(ParaderoService);
  
  paraderos = signal<Paradero[]>([]);
  cargando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  private map: L.Map | null = null;
  private marcadoresLayer = L.layerGroup();
  
  // CORRECCIÓN APLICADA AQUÍ:
  private marcadorUsuario: L.Marker | L.CircleMarker | null = null;
  private watchId: number | null = null;

  private busIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  constructor() {
    effect(() => {
      const lista = this.paraderos();
      if (lista.length > 0) this.dibujarMarcadores(lista);
    });
  }

  ngOnInit() {
    this.inicializarMapa();
    this.iniciarGPS();
  }

  private inicializarMapa() {
    this.map = L.map(this.mapaContainer.nativeElement).setView([4.6097, -74.0817], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.marcadoresLayer.addTo(this.map);
  }

  private iniciarGPS() {
    if (!navigator.geolocation) {
      this.errorMsg.set('Tu navegador no soporta geolocalización.');
      return;
    }

    this.cargando.set(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        this.actualizarMarcadorUsuario(lat, lng);
        this.buscarParaderos(lat, lng);
        this.activarVigilanteDeRutas(); 
      },
      (err) => {
        this.cargando.set(false);
        this.errorMsg.set('Por favor, permite el acceso a tu ubicación GPS para buscar paraderos.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private buscarParaderos(lat: number, lng: number) {
    this.paraderoService.findNearby({ lat, lng }).subscribe({
      // CORRECCIÓN APLICADA AQUÍ (Tipados estrictos)
      next: (data: Paradero[]) => {
        this.paraderos.set(data);
        this.cargando.set(false);
      },
      error: (e: any) => {
        this.errorMsg.set('Error obteniendo paraderos cercanos.');
        this.cargando.set(false);
      }
    });
  }

  private activarVigilanteDeRutas() {
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
         const lat = pos.coords.latitude;
         const lng = pos.coords.longitude;
         this.actualizarMarcadorUsuario(lat, lng);
         this.buscarParaderos(lat, lng);
      },
      (err) => console.error("Error en watchPosition", err),
      { enableHighAccuracy: true }
    );
  }

  private actualizarMarcadorUsuario(lat: number, lng: number) {
    if (!this.map) return;
    
    if (this.marcadorUsuario) {
      this.marcadorUsuario.setLatLng([lat, lng]);
    } else {
      this.marcadorUsuario = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(this.map).bindPopup('Tu ubicación actual');
    }
    this.map.setView([lat, lng], 15);
  }

  private dibujarMarcadores(paraderos: Paradero[]) {
    this.marcadoresLayer.clearLayers();

    paraderos.forEach((p) => {
      const lat = +p.latitud; 
      const lng = +p.longitud;

      const popupHtml = `
        <div class="font-sans">
          <strong class="text-sm">${p.nombre}</strong><br>
          <span class="text-xs text-gray-600">A ${p.distancia_metros} metros de ti.</span>
        </div>
      `;

      L.marker([lat, lng], { icon: this.busIcon })
        .bindPopup(popupHtml)
        .addTo(this.marcadoresLayer);
    });
  }

  enfocarParadero(paradero: Paradero) {
    if (this.map) {
      this.map.flyTo([+paradero.latitud, +paradero.longitud], 17, {
        animate: true,
        duration: 1.5
      });
    }
  }

  ngOnDestroy() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    if (this.map) this.map.remove();
  }
}