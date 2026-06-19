import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PqrsService, PqrsStatusResponse } from '../../core/services/pqrs.service';

@Component({
    selector: 'app-pqrs-seguimiento',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pqrs-seguimiento.component.html',
    styleUrls: ['./pqrs-seguimiento.component.css']
})
export class PqrsSeguimientoComponent implements OnInit {
    radicadoInput = '';

    resultado: NonNullable<PqrsStatusResponse['pqrs']> | null = null;
    notFoundMessage: string | null = null;
    errorMessage: string | null = null;
    loading = false;
    searched = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private pqrsService: PqrsService
    ) { }

    ngOnInit(): void {
        const radicado = this.route.snapshot.paramMap.get('radicado');
        if (radicado) {
            this.radicadoInput = radicado;
            this.consultar();
        }
    }

    consultar(): void {
        const radicado = this.radicadoInput.trim();
        if (!radicado) return;

        this.loading = true;
        this.resultado = null;
        this.notFoundMessage = null;
        this.errorMessage = null;
        this.searched = true;

        this.pqrsService.getTracking(radicado).subscribe({
            next: (res) => {
                if (res.found && res.pqrs) {
                    this.resultado = res.pqrs;
                } else {
                    this.notFoundMessage = res.message || 'No encontramos ninguna solicitud con ese número de radicado.';
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error al consultar PQRS:', err);
                this.errorMessage = 'Hubo un error al consultar tu solicitud. Inténtalo de nuevo más tarde.';
                this.loading = false;
            }
        });
    }

    estadoClasses(estado: string | undefined): string {
        const e = (estado || '').toLowerCase();
        if (e.includes('resuelt') || e.includes('cerrad') || e.includes('finaliz')) {
            return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400';
        }
        if (e.includes('proceso') || e.includes('tramite') || e.includes('trámite') || e.includes('atend')) {
            return 'bg-amber-950/40 border-amber-500/30 text-amber-400';
        }
        return 'bg-sky-950/40 border-sky-500/30 text-sky-400';
    }

    irARadicar(): void {
        this.router.navigate(['/pqrs']);
    }
}
