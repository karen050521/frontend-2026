import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * SearchBarComponent - Componente de búsqueda reutilizable
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona la búsqueda
 * - Open/Closed: Puede extenderse con filtros adicionales
 */

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  protected readonly searchQuery = signal('');
  
  // Output para emitir cambios de búsqueda
  public readonly search = output<string>();

  /**
   * Maneja el cambio en el input de búsqueda
   */
  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search.emit(value);
  }

  /**
   * Limpia la búsqueda
   */
  protected clearSearch(): void {
    this.searchQuery.set('');
    this.search.emit('');
  }
}
