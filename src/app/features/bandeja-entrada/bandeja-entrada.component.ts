import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajeService } from '../../core/services/mensaje.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bandeja-entrada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bandeja-entrada.component.html',
  styleUrl: './bandeja-entrada.component.css'
})
export class BandejaEntradaComponent implements OnInit {
  private readonly mensajeService = inject(MensajeService);
  private readonly authService = inject(AuthService);

  // Estados Reactivos (Signals)
  protected mensajes = signal<any[]>([]);
  protected contadorNoLeidos = signal<number>(0);
  protected cargando = signal<boolean>(false);

  // Filtros enlazados a la vista
  protected filtroTipo = signal<'todos' | 'individual' | 'grupal'>('todos');
  protected filtroEstado = signal<'todos' | 'leidos' | 'no_leidos'>('todos');
  protected filtroFecha = signal<string>('');

  // Mensaje seleccionado para la lectura interactiva y responder
  protected mensajeSeleccionado = signal<any | null>(null);

  constructor() {
    // Cada vez que un filtro cambie, disparamos automáticamente la recarga
    effect(() => {
      this.cargarBandeja();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Inicialización delegada al effect reactivo
  }

  protected cargarBandeja(): void {
    const usuario = this.authService.currentUser();
    if (!usuario?.id) return;

    this.cargando.set(true);

    const filtrosAplicados: any = {};
    if (this.filtroTipo() !== 'todos') filtrosAplicados.tipo = this.filtroTipo();
    if (this.filtroEstado() !== 'todos') filtrosAplicados.estado = this.filtroEstado();
    if (this.filtroFecha()) filtrosAplicados.fecha = this.filtroFecha();

    this.mensajeService.getBandejaEntrada(usuario.id, filtrosAplicados).subscribe({
      next: (res) => {
        this.mensajes.set(res.mensajes);
        this.contadorNoLeidos.set(res.contadorNoLeidos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la bandeja de entrada:', err);
        this.cargando.set(false);
      }
    });
  }

  protected abrirMensaje(msg: any): void {
    this.mensajeSeleccionado.set(msg);

    // Criterio de Aceptación: Si no está leído, se marca automáticamente
    if (!msg.leido) {
      this.mensajeService.marcarComoLeido(msg.id).subscribe({
        next: () => {
          // Actualización optimista local del estado sin recargar toda la API
          this.mensajes.update(list => 
            list.map(m => m.id === msg.id ? { ...m, leido: true } : m)
          );
          // Decrementar el contador global si corresponde
          this.contadorNoLeidos.update(count => count > 0 ? count - 1 : 0);
        },
        error: (err) => console.error('Error al actualizar lectura:', err)
      });
    }
  }

  protected responderMensaje(msg: any): void {
    // Aquí implementas la acción de responder según tu flujo, 
    // por ejemplo redirigir al chat directo abriendo el ChatFloatingComponent 
    // o abriendo una caja de texto veloz.
    alert(`Redirigiendo para responder a: ${msg.emisor}`);
  }

  protected limpiarFiltros(): void {
    this.filtroTipo.set('todos');
    this.filtroEstado.set('todos');
    this.filtroFecha.set('');
  }
}