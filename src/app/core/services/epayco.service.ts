import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface EpaycoPaymentResult {
  idPago: string;
  referencia: string;
  estado: string;
  factura: string;
  valor: string;
}

@Injectable({
  providedIn: 'root',
})
export class EpaycoService {
  private handler: any;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const win: any = window;
      if (win.ePayco) {
        this.handler = win.ePayco.checkout.configure({
          key: environment.epayco.pKey,
          test: environment.epayco.testMode,
        });
      } else {
        console.warn('ePayco checkout.js no está cargado. Verifica index.html');
      }
    }
  }

  openCheckout(data: {
    invoice: string;
    amount: number;
    name: string;
    description: string;
    currency?: string;
    taxBase?: number;
    tax?: number;
    external?: boolean;
    extra1?: string;
    extra2?: string;
    extra3?: string;
    response?: string;
    confirmation?: string;
    onCompleted?: (result: EpaycoPaymentResult) => void;
    onClosingModal?: () => void;
  }) {
    if (!this.handler) {
      console.error(
        'ePayco handler no inicializado. Verifica que checkout.js esté cargado en index.html.',
      );
      return;
    }

    const paymentData: any = {
      invoice: data.invoice,
      currency: (data.currency || 'cop').toLowerCase(),
      name: data.name,
      description: data.description,
      amount: data.amount,
      country: 'co',
      lang: 'es',
      external: data.external !== undefined ? Boolean(data.external) : false,
      method: 'GET',
      extra1: data.extra1 || '',
      extra2: data.extra2 || '',
      extra3: data.extra3 || '',
      response: data.response || `${environment.epayco.baseUrl}/pago-respuesta`,
      confirmation: data.confirmation || `${environment.epayco.baseUrl}/pago-confirmacion`,
    };

    this.handler.onResponse = (response: any) => {
      if (data.onCompleted && response) {
        const result: EpaycoPaymentResult = {
          idPago: response.x_ref_pay || response.x_id_invoice || '',
          referencia: response.x_ref || '',
          estado: String(response.x_cod_response || ''),
          factura: response.x_invoice || '',
          valor: response.x_amount || '',
        };
        data.onCompleted(result);
      }
    };

    if (data.onClosingModal) {
      this.handler.onCloseModal = data.onClosingModal;
    }

    try {
      this.handler.open(paymentData);
    } catch (error) {
      console.error('Error al abrir el checkout de ePayco:', error);
    }
  }
}
