import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  readonly toastsState = this.toasts.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3500): void {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    
    console.log(`🔔 Toast [${type.toUpperCase()}]:`, message, { id, duration });
    
    this.toasts.update(toasts => [...toasts, toast]);
    console.log(`📊 Toasts activos:`, this.toasts().length);

    if (duration > 0) {
      setTimeout(() => {
        console.log(`⏱️ Dismissing toast:`, id);
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, duration?: number): void {
    console.log('✅ Success toast called');
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    console.log('❌ Error toast called');
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    console.log('ℹ️ Info toast called');
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    console.log('⚠️ Warning toast called');
    this.show(message, 'warning', duration);
  }

  dismiss(id: string): void {
    console.log('🗑️ Dismissing toast:', id);
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
