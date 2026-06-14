import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {
  private socket!: Socket;
  // Usamos un Subject para transmitir los mensajes nuevos en tiempo real al componente
  private mensajeNuevoSubject = new Subject<any>();

  constructor() {
    this.conectarSocket();
  }

  private conectarSocket() {
    // Se conecta usando la URL base de NestJS definida en tus environments
    this.socket = io(environment.apiNestUrl, {
      transports: ['websocket'], // Forzamos el uso de WebSockets
      autoConnect: true
    });

    // Escuchamos el evento que configuramos en NestJS
    this.socket.on('recibirMensaje', (mensaje: any) => {
      this.mensajeNuevoSubject.next(mensaje);
    });

    this.socket.on('connect', () => {
      console.log('Conectado al servidor de WebSockets');
    });
  }

  // Permite al usuario entrar a la sala virtual de un grupo específico
  unirseAGrupo(grupoId: number, personaId?: string): void {
    this.socket.emit('unirseAGrupo', { grupoId, personaId });
  }

  // Permite al usuario salir de la sala del grupo al cerrar el chat
  salirDeGrupo(grupoId: number): void {
    this.socket.emit('salirDeGrupo', { grupoId });
  }

  // Envía el mensaje a través del socket en lugar de HTTP
  enviarMensaje(emisorId: string, grupoId: number, contenido: string): void {
    this.socket.emit('enviarMensaje', { emisorId, grupoId, contenido });
  }

  // Expone el Subject como un Observable para que el componente TS se suscriba
  escucharMensajes(): Observable<any> {
    return this.mensajeNuevoSubject.asObservable();
  }

  // 1. Método para avisar al backend que se creó un grupo con ciertos miembros
  emitirNuevoGrupo(miembrosIds: string[]): void {
    this.socket.emit('notificarNuevoGrupo', { miembrosIds });
  }

  // 2. Método para escuchar cuando el backend avisa que alguien creó un grupo
  escucharNuevosGrupos(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('grupoCreadoRemoto', (data: any) => {
        observer.next(data);
      });
    });
  }

  // ⚡ NUEVO: Escuchar cuando el backend emite que el usuario fue bloqueado en un grupo
  escucharUsuarioBloqueado(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('usuarioBloqueado', (data: any) => {
        observer.next(data);
      });
    });
  }

  // Limpieza al destruir el servicio si fuera necesario
  desconectar(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // ✨ NUEVO: Escuchar cuando el backend avisa que el bus está llegando
  escucharAlertaBus(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('alertaBusProximo', (data: any) => {
        observer.next(data);
      });
    });
  }

  // ✨ NUEVO: Enviar mensaje directo a otra persona (HU-ENTR-3-004)
  enviarMensajePrivado(emisorId: string, receptorId: string, contenido: string): void {
    this.socket.emit('enviarMensajePrivado', { emisorId, receptorId, contenido });
  }

  // ✨ NUEVO: Escuchar mensajes directos entrantes en tiempo real
  escucharMensajesPrivados(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('recibirMensajePrivado', (data: any) => {
        observer.next(data);
      });
    });
  }

  // ✨ INTEGRADO: Escuchar actualizaciones de ubicación de buses (HU-ENTR-3-001)
  escucharActualizaciones(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('actualizacionBus', (data: any) => {
        observer.next(data);
      });
    });
  }
}