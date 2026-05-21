import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { EpaycoService } from '../../core/services/epayco.service';
import { BoletoService } from '../../core/services/boleto.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recarga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recarga.component.html',
  styleUrl: './recarga.component.css',
})
export class RecargaComponent implements OnInit {
  private readonly tokenStorageKey = 'authToken';
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiNestUrl}/metodo-pago-ciudadano`;

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isPaying = signal<boolean>(false);
  protected readonly tarjetas = signal<any[]>([]);
  protected readonly tarjetaIdSeleccionada = signal<number | null>(null);

  protected readonly montosPredefinidos = [10000, 20000, 50000, 100000];
  protected readonly monto = signal<number | null>(null);

  protected readonly tarjetaSeleccionada = computed(() => {
    const id = this.tarjetaIdSeleccionada();
    if (!id) return null;
    return this.tarjetas().find((t) => Number(t.id) === Number(id)) || null;
  });

  protected readonly saldoActual = computed(() => {
    const t = this.tarjetaSeleccionada();
    return Number(t?.saldo ?? 0);
  });

  protected readonly saldoProyectado = computed(() => {
    const m = Number(this.monto() ?? 0);
    return this.saldoActual() + (Number.isFinite(m) ? m : 0);
  });

  protected readonly montoValido = computed(() => {
    const m = Number(this.monto());
    return Number.isFinite(m) && m >= 5000 && m <= 500000;
  });

  constructor(
    private readonly router: Router,
    private readonly toast: ToastService,
    private readonly epayco: EpaycoService,
    private readonly boletoService: BoletoService,
  ) {}

  ngOnInit(): void {
    this.cargarTarjetas();
  }

  protected cargarTarjetas(): void {
    const token = localStorage.getItem(this.tokenStorageKey) || '';
    if (!token) {
      this.toast.error('Sesión inválida o expirada. Inicie sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.boletoService.getMisTarjetas(token).subscribe({
      next: (tarjetas) => {
        this.tarjetas.set(tarjetas || []);
        const primera = (tarjetas || [])[0];
        if (primera?.id) this.tarjetaIdSeleccionada.set(Number(primera.id));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('No se pudieron cargar tus tarjetas');
      },
    });
  }

  protected seleccionarMontoRapido(valor: number): void {
    this.monto.set(valor);
  }

  protected onMontoPersonalizadoInput(raw: any): void {
    const n = Number(raw);
    this.monto.set(Number.isFinite(n) ? n : null);
  }

  protected pagarRecarga(): void {
    if (!this.tarjetaSeleccionada()) {
      this.toast.warning('Selecciona una tarjeta');
      return;
    }
    if (!this.montoValido()) {
      this.toast.warning('Ingresa un monto válido (entre $5.000 y $500.000)');
      return;
    }
    if (this.isPaying()) return;

    const tarjeta = this.tarjetaSeleccionada();
    const monto = Number(this.monto());
    const token = localStorage.getItem(this.tokenStorageKey) || '';

    this.isPaying.set(true);
    console.log('Iniciando recarga con tarjetaId:', tarjeta?.id, 'y monto:', monto) 
    this.http
      .post<any>(
        `${this.baseUrl}/iniciar-recarga`,
        { tarjetaId: tarjeta.id, monto },
        { headers: { Authorization: `Bearer ${token}` } },
        
      )
      .subscribe({
        next: (referencia) => {
          this.epayco.openCheckout({
            invoice: referencia.referencia,
            amount: monto,
            name: 'Recarga de saldo - KALA',
            description: `Recarga de $${monto} a tu tarjeta ${tarjeta?.identificadorInstrumento || 'KALA'}`,
            currency: 'cop',
            taxBase: 0,
            tax: 0,
            external: false,
            extra1: String(tarjeta?.id ?? ''),
            extra2: `RECARGA-${Date.now()}`,
            extra3: String(monto),
            onCompleted: (result) => {
              if (String(result.estado) === '1') {
                this.toast.success('Pago aprobado. El saldo se actualizará automáticamente.');
                this.isPaying.set(false);
                this.monto.set(null);
                setTimeout(() => this.cargarTarjetas(), 3000);
              } else {
                this.isPaying.set(false);
                this.toast.error('Pago no aprobado o cancelado');
              }
            },
            onClosingModal: () => {
              this.isPaying.set(false);
            },
          });
        },
        error: (err) => {
          this.isPaying.set(false);
          console.error('Error generando referencia:', err);
          this.toast.error('No se pudo iniciar la recarga. Intente nuevamente.');
        },
      });
  }
}
