import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton, IonIcon, IonText } from "@ionic/angular/standalone";

type ButtonExpand = "block" | "full";
type ButtonType = "button" | "submit" | "reset";

@Component({
  selector: "mol-add-event-button",
  standalone: true,
  templateUrl: "./mol-add-event-button.component.html",
  styleUrls: ["./mol-add-event-button.component.scss"],
  imports: [CommonModule, IonButton, IonIcon, IonText],
})
export class MolAddEventButtonComponent {
  @Input() label: string = "Añadir cita";
  @Input() icon: string = "add-outline";
  @Input() color: string = "primary";
  @Input() expand: ButtonExpand = "block";
  @Input() disabled: boolean = false;
  @Input() type: ButtonType = "button";

  @Output() action = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled) {
      this.action.emit();
    }
  }
}
