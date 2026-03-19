import { Component, EventEmitter, Input, Output, signal, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-assign-roles-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assign-roles-modal.component.html',
  styleUrl: './assign-roles-modal.component.css'
})
export class AssignRolesModalComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Input() roles: Role[] = [];
  @Input() selectedRoleIds: string[] = [];
  @Input() isSaving: boolean = false;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<string[]>();
  @Output() onToggleRole = new EventEmitter<{ roleId: string; checked: boolean }>();

  localSelectedRoles = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.localSelectedRoles.set(new Set(this.selectedRoleIds));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRoleIds'] && !changes['selectedRoleIds'].firstChange) {
      this.localSelectedRoles.set(new Set(this.selectedRoleIds));
    }
  }

  toggleRole(roleId: string): void {
    const selected = this.localSelectedRoles();
    const newSet = new Set(selected);
    
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    
    this.localSelectedRoles.set(newSet);
  }

  isRoleSelected(roleId: string): boolean {
    return this.localSelectedRoles().has(roleId);
  }

  /**
   * Obtiene la URL del avatar del usuario
   */
  getUserAvatarUrl(): string {
    if (!this.user) return 'https://ui-avatars.com/api/?name=User&background=4f46e5';
    
    const name = this.user.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5`;
  }

  save(): void {
    this.onSave.emit(Array.from(this.localSelectedRoles()));
  }

  close(): void {
    this.onClose.emit();
  }
}
