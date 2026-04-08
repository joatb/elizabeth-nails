import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonText,
} from "@ionic/angular/standalone";

/**
 * Tipo para acciones secundarias del FAB.
 */
export type MolFabAction = {
  icon?: string;
  color?: string;
  action: string;
  label?: string;
};

@Component({
  selector: "mol-fab-button",
  standalone: true,
  imports: [CommonModule, IonFab, IonFabButton, IonFabList, IonIcon],
  templateUrl: "./mol-fab-button.component.html",
})
export class MolFabButtonComponent {
  /**
   * Icono principal del FAB.
   */
  @Input() icon?: string;

  /**
   * Etiqueta opcional que acompaña al FAB principal.
   */
  @Input() label?: string;

  /**
   * Color del FAB principal (valor compatible con Ionic colors).
   */
  @Input() color: string = "primary";

  /**
   * Posición vertical del FAB: 'top' | 'bottom'
   */
  @Input() vertical: "top" | "bottom" = "bottom";

  /**
   * Posición horizontal del FAB: 'start' | 'center' | 'end'
   */
  @Input() horizontal: "start" | "center" | "end" = "end";

  /**
   * Acciones secundarias a mostrar en el fab-list.
   */
  @Input() actions: MolFabAction[] = [];

  /**
   * Evento emitido cuando se pulsa una acción secundaria.
   * Emite el identificador `action` configurado en el item.
   */
  @Output() action = new EventEmitter<string>();

  /**
   * Evento emitido cuando se pulsa el botón principal.
   */
  @Output() main = new EventEmitter<void>();

  /**
   * Handler interno para cuando el usuario pulsa el botón principal.
   */
  public handleMainClick(): void {
    this.main.emit();
  }

  /**
   * Handler para acciones secundarias.
   * @param act Identificador de la acción
   */
  public handleActionClick(act: string): void {
    if (!act) {
      return;
    }
    this.action.emit(act);
  }

  /**
   * Construye un atributo aria-label seguro para accesibilidad.
   */
  public getAriaLabelForMain(): string {
    if (this.label && this.label.trim().length > 0) {
      return this.label;
    }
    if (this.icon && this.icon.trim().length > 0) {
      return this.icon;
    }
    return "Acción";
  }
}
