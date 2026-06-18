import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PqrsService } from '../../core/services/pqrs.service';

@Component({
    selector: 'app-pqrs-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pqrs-form.component.html',
    styleUrls: ['./pqrs-form.component.css']
})
export class PqrsFormComponent implements OnInit {
    pqrsForm!: FormGroup;
    uploadedImages: string[] = [];
    maxImagesError = false;
  
    // Variables para la respuesta exitosa
    successData: { radicado: string; estimatedDate: string } | null = null;
    errorMessage: string | null = null;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private pqrsService: PqrsService
    ) { }

    ngOnInit(): void {
        this.pqrsForm = this.fb.group({
            type: ['', Validators.required],
            category: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(500)]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    // Capturar y procesar las imágenes a Base64
    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        this.maxImagesError = false;

        // Validación estricta: Máximo 3 imágenes en total
        if (files.length + this.uploadedImages.length > 3) {
            this.maxImagesError = true;
            return;
        }

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.uploadedImages.push(e.target.result);
            };
            reader.readAsDataURL(file); // Convierte a data:image/...;base64,...
        });
    }

    // Eliminar una foto de la lista antes de enviar
    removeImage(index: number): void {
        this.uploadedImages.splice(index, 1);
        this.maxImagesError = false;
    }

    // Enviar el formulario al Backend de NestJS
    onSubmit(): void {
        if (this.pqrsForm.invalid) {
            this.pqrsForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.errorMessage = null;
        this.successData = null;

        const payload = {
            ...this.pqrsForm.value,
            images: this.uploadedImages
        };

        this.pqrsService.createPqrs(payload).subscribe({
            next: (res) => {
                this.successData = {
                    radicado: res.radicado,
                    estimatedDate: res.estimatedResponseDate
                };
                this.pqrsForm.reset();
                this.uploadedImages = [];
                this.loading = false;
            },
            error: (err: any) => { // <-- AGREGA EL ": any" AQUÍ
                console.error('Error al radicar PQRS:', err);
                this.errorMessage = 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo más tarde.';
                this.loading = false;
            }
        });
    }
}