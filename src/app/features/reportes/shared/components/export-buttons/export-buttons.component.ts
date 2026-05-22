import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesApiService } from '../../services/reportes-api.service';
import { PeriodoMeses, FiltrosDemografico } from '../../models/reportes.models';

@Component({
  selector: 'app-export-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <!-- CSV -->
      <button
        (click)="exportar('csv')"
        [disabled]="exportandoCSV()"
        class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
      >
        @if (exportandoCSV()) {
          <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-emerald-400"></span>
        } @else {
          <span>📥</span>
        }
        CSV
      </button>

      <!-- Excel -->
      <button
        (click)="exportar('excel')"
        [disabled]="exportandoExcel()"
        class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300 disabled:opacity-40"
      >
        @if (exportandoExcel()) {
          <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-purple-400"></span>
        } @else {
          <span>📊</span>
        }
        Excel
      </button>
    </div>
  `,
})
export class ExportButtonsComponent {
  readonly tipo = input<'ingresos' | 'demografico'>('ingresos');
  readonly meses = input<PeriodoMeses>(6);
  readonly filtrosDemografico = input<FiltrosDemografico>({});
  readonly exportError = output<string>();

  protected readonly exportandoCSV = signal(false);
  protected readonly exportandoExcel = signal(false);

  constructor(private readonly api: ReportesApiService) {}

  protected exportar(formato: 'csv' | 'excel'): void {
    const esCSV = formato === 'csv';
    if (esCSV) this.exportandoCSV.set(true);
    else this.exportandoExcel.set(true);

    const obs$ = this.resolverObservable(formato);
    const nombre = this.resolverNombre(formato);

    obs$.subscribe({
      next: (blob) => {
        this.api.descargarBlob(blob, nombre);
        if (esCSV) this.exportandoCSV.set(false);
        else this.exportandoExcel.set(false);
      },
      error: (err) => {
        if (esCSV) this.exportandoCSV.set(false);
        else this.exportandoExcel.set(false);
        this.exportError.emit('Error al exportar. Intenta nuevamente.');
        console.error(err);
      },
    });
  }

  private resolverObservable(formato: 'csv' | 'excel') {
    if (this.tipo() === 'ingresos') {
      return formato === 'csv'
        ? this.api.exportarIngresosCSV(this.meses())
        : this.api.exportarIngresosExcel(this.meses());
    }
    return formato === 'csv'
      ? this.api.exportarDemograficoCSV(this.filtrosDemografico())
      : this.api.exportarDemograficoExcel(this.filtrosDemografico());
  }

  private resolverNombre(formato: 'csv' | 'excel'): string {
    const ext = formato === 'csv' ? 'csv' : 'xlsx';
    const base = this.tipo() === 'ingresos'
      ? `ingresos-metodo-pago-${this.meses()}meses`
      : 'distribucion-etaria';
    return `${base}.${ext}`;
  }
}
