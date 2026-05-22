import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { EpaycoService } from '../../core/services/epayco.service';
import { BoletoService } from '../../core/services/boleto.service';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiNestUrl}/metodo-pago-ciudadano`;

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isPaying = signal<boolean>(false);
  protected readonly tarjetas = signal<any[]>([]);
  protected readonly tarjetaIdSeleccionada = signal<number | null>(null);

  protected readonly montosPredefinidos = [10000, 20000, 50000, 100000];
  protected readonly monto = signal<number | null>(null);

  // Estados Pago Directo
  protected readonly metodoDePago = signal<'epayco' | 'directo'>('epayco');
  protected readonly tipoDirecto = signal<'tarjeta' | 'daviplata'>('tarjeta');
  protected readonly numeroTarjeta = signal<string>('');
  protected readonly fechaExpiracion = signal<string>('');
  protected readonly cvv = signal<string>('');
  protected readonly franquicia = signal<string>('');
  protected readonly daviplataDocTipo = signal<string>('CC');
  protected readonly daviplataDocNumero = signal<string>('');

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

  protected readonly comisionEpayco = computed(() => {
    const m = Number(this.monto() ?? 0);
    if (m <= 0) return 0;
    const baseComision = m * 0.0299 + 900;
    const ivaComision = baseComision * 0.19;
    return Math.round(baseComision + ivaComision);
  });

  protected readonly totalAPagar = computed(() => {
    const m = Number(this.monto() ?? 0);
    if (m <= 0) return 0;
    return m + this.comisionEpayco();
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

  /**
   * Recarga por ePayco (pasarela).
   * Si el handler de ePayco no está disponible, cambia automáticamente a pago directo.
   */
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

    // ── Verificar si ePayco está disponible ───────────────────────────────────
    const win: any = window;
    if (!win.ePayco) {
      this.toast.warning('Pasarela ePayco no disponible. Usa el método de Pago Directo.');
      this.metodoDePago.set('directo');
      return;
    }

    const tarjeta = this.tarjetaSeleccionada();
    const monto = Number(this.monto());
    const token = localStorage.getItem(this.tokenStorageKey) || '';

    this.isPaying.set(true);

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
            name: 'Recarga tarjeta transporte',
            description: `Recarga tarjeta transporte #${tarjeta?.identificadorInstrumento || 'KALA'}`,
            currency: 'cop',
            taxBase: 0,
            tax: 0,
            external: false,
            email_billing: this.authService.currentUser()?.email || '',
            extra1: String(tarjeta?.id ?? ''),
            extra2: `RECARGA-${Date.now()}`,
            extra3: String(monto),
            onCompleted: (result) => {
              this.isPaying.set(false);
              if (String(result.estado) === '1') {
                this.toast.success('✅ Pago aprobado. El saldo se actualizará automáticamente.');
                this.monto.set(null);
                setTimeout(() => this.cargarTarjetas(), 1500);
              } else {
                this.toast.error('Pago no aprobado o cancelado');
              }
            },
            onClosingModal: () => {
              // SIEMPRE desbloquear el botón al cerrar el modal (cancelar o finalizar)
              this.isPaying.set(false);
              this.cargarTarjetas();
            },
          });
        },
        error: (err) => {
          // SIEMPRE desbloquear si falla el backend
          this.isPaying.set(false);
          console.error('Error generando referencia:', err);
          const msg = err?.error?.message || err?.error?.mensaje || 'No se pudo iniciar la recarga con ePayco.';
          this.toast.error(msg + ' Intenta con Pago Directo.');
          // Cambiar automáticamente al método directo como fallback
          this.metodoDePago.set('directo');
        },
      });
  }

  /**
   * Pago directo: envía datos de tarjeta o Daviplata al backend.
   * Funciona sin depender de ePayco — es el método global de fallback.
   */
  protected pagarDirecto(): void {
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

    const payload: any = {
      tarjetaId: tarjeta?.id,
      monto,
      tipoPago: this.tipoDirecto(),
    };

    if (this.tipoDirecto() === 'tarjeta') {
      payload.numeroTarjeta = this.numeroTarjeta().replace(/\s+/g, '');
      payload.fechaExpiracion = this.fechaExpiracion();
      payload.cvv = this.cvv();
      payload.franquicia = this.franquicia();
    } else {
      payload.daviplataDocTipo = this.daviplataDocTipo();
      payload.daviplataDocNumero = this.daviplataDocNumero();
    }

    this.isPaying.set(true);

    this.http
      .post<any>(`${this.baseUrl}/pagar-directo`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res) => {
          this.isPaying.set(false);
          if (res.exito && res.estado === 'Aceptada') {
            this.toast.success(`✅ Pago aprobado. Nuevo saldo: $${Number(res.nuevoSaldo).toLocaleString('es-CO')} COP`);
            this.monto.set(null);
            this.limpiarFormularioDirecto();
            setTimeout(() => this.cargarTarjetas(), 800);
          } else if (res.estado === 'Pendiente') {
            this.toast.warning(res.mensaje || 'Transacción pendiente por validación');
          } else if (res.estado === 'Fallida') {
            this.toast.error(res.mensaje || 'Error de comunicación con el centro de autorizaciones');
          } else {
            this.toast.error(res.mensaje || 'Transacción rechazada o fondos insuficientes');
          }
        },
        error: (err) => {
          // SIEMPRE desbloquear el botón
          this.isPaying.set(false);
          console.error('Error al procesar pago directo:', err);
          const errMsg =
            err?.error?.message ||
            err?.error?.mensaje ||
            'No se pudo procesar el pago. Verifica los datos e intenta nuevamente.';
          this.toast.error(errMsg);
        },
      });
  }

  protected autofillTarjeta(numero: string, exp: string, cvv: string, franquicia: string): void {
    this.numeroTarjeta.set(numero);
    this.fechaExpiracion.set(exp);
    this.cvv.set(cvv);
    this.franquicia.set(franquicia);
  }

  protected autofillDaviplata(tipoDoc: string, numDoc: string): void {
    this.daviplataDocTipo.set(tipoDoc);
    this.daviplataDocNumero.set(numDoc);
  }

  private limpiarFormularioDirecto(): void {
    this.numeroTarjeta.set('');
    this.fechaExpiracion.set('');
    this.cvv.set('');
    this.franquicia.set('');
    this.daviplataDocNumero.set('');
  }
}
