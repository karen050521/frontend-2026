import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleRef } from '../../../core/services/user-role.service';

@Component({
  selector: 'app-select-role-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-role-modal.component.html',
  styleUrl: './select-role-modal.component.css'
})
export class SelectRoleModalComponent {
  @Input() roles: RoleRef[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSelectRole = new EventEmitter<string>();

  selectedRoleId = signal<string | null>(null);

  selectRole(roleId: string | undefined): void {
    if (roleId) {
      this.selectedRoleId.set(roleId);
    }
  }

  confirmSelection(): void {
    const roleId = this.selectedRoleId();
    if (roleId) {
      this.onSelectRole.emit(roleId);
    }
  }

  close(): void {
    this.onClose.emit();
  }

  isDefaultRole(roleName?: string): boolean {
    return roleName?.toLowerCase() === 'usuario';
  }

  getRoleDescription(roleName?: string): string {
    const descriptions: { [key: string]: string } = {
      'usuario': 'Acceso estándar a la aplicación',
      'admin': 'Acceso total con permisos administrativos',
      'moderador': 'Acceso a funciones de moderación',
    };
    return descriptions[roleName?.toLowerCase() || ''] || '';
  }
}
