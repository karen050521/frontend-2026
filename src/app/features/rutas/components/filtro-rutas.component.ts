import { Component, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-filtro-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-4">
      <input
        type="text"
        [(ngModel)]="termino"
        (ngModelChange)="onBuscar($event)"
        placeholder="Buscar ruta por nombre..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-[#262626] dark:border-[#404040] dark:text-[#fafafa] dark:placeholder-[#a3a3a3]"
      />
    </div>
  `,
})
export class FiltroRutasComponent implements OnDestroy {
  private buscarSubject = new Subject<string>();
  buscar = output<string>();
  termino = '';

  constructor() {
    this.buscarSubject.pipe(debounceTime(500)).subscribe((valor) => {
      this.buscar.emit(valor);
    });
  }

  ngOnDestroy(): void {
    this.buscarSubject.complete();
  }

  onBuscar(valor: string) {
    this.buscarSubject.next(valor);
  }
}
