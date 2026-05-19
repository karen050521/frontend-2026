

export interface CoordenadaRuta {
  ordenSecuencial: number;
  latitud: number;
  longitud: number;
}

export interface ParaderoValidacion {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface ValidacionViaje {
  tipo: 'abordaje' | 'descenso' | string; 
  horaExacta: string; // Nota: JSON transfiere las fechas como String ISO (ej. "2026-05-19T10:00:00Z")
  paradero: ParaderoValidacion;
}

export interface DetalleViajeResponse {
  boletoId: number;
  ruta: {
    nombre: string;
    coordenadasMapa: CoordenadaRuta[];
  };
  validaciones: ValidacionViaje[];
  tiempoTotalMinutos: number;
  operacion: {
    busPlaca: string;
    conductorNombre: string;
  };
}