import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          transform: 'translateX(400px)',
          opacity: 0
        }),
        animate('300ms ease-out', 
          style({ 
            transform: 'translateX(0)',
            opacity: 1
          })
        )
      ]),
      transition(':leave', [
        animate('300ms ease-in',
          style({
            transform: 'translateX(400px)',
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts = this.toastService.toastsState;

  dismiss(id: string): void {
    console.log('👆 Dismissing toast on click:', id);
    this.toastService.dismiss(id);
  }


  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '●';
    }
  }
}

