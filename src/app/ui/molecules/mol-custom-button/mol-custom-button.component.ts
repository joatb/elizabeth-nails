import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

/**
 * Configuración para cada botón personalizado.
 */
export type CustomButtonConfig = {
  label?: string;
  icon?: string;
  color?: string;
  action: string;
};

/**
 * Molécula: mol-custom-button
 *
 * Componente standalone que renderiza una lista de botones personalizados y emite
 * la acción seleccionada cuando se pulsa un botón.
 *
 * - Entrada `buttons`: arreglo de `CustomButtonConfig`
 * - Salida `actionClicked`: emite el identificador `action` del botón pulsado
 *
 * Notas:
 * - Mantener tipado estricto en TypeScript.
 * - No introduce nuevas dependencias.
 */
@Component({
  selector: "mol-custom-button",
  standalone: true,
  templateUrl: "./mol-custom-button.component.html",
  imports: [CommonModule, IonButton, IonIcon],
})
export class MolCustomButtonComponent {
  /**
   * Lista de botones a renderizar.
   */
  @Input() buttons: CustomButtonConfig[] = [];

  /**
   * Evento emitido con la acción asociada al botón pulsado.
   */
  @Output() actionClicked: EventEmitter<string> = new EventEmitter<string>();

  /**
   * Maneja el click de un botón y emite la acción.
   * @param action Identificador de la acción asociada al botón.
   */
  public onClick(action: string): void {
    if (!action) {
      return;
    }
    this.actionClicked.emit(action);
  }
}
