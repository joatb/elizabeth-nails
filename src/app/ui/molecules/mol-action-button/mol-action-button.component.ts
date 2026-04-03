import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AtomButtonComponent } from "../../atoms";

type ButtonSize = "small" | "default" | "large";
type ButtonFill = "clear" | "outline" | "solid" | "default";
type ButtonExpand = "block" | "full";
type ButtonShape = "round" | "default";
type ButtonType = "button" | "submit" | "reset";
type IconSlot = "start" | "end" | "icon-only";

@Component({
  selector: "mol-action-button",
  standalone: true,
  imports: [CommonModule, AtomButtonComponent],
  templateUrl: "./mol-action-button.component.html",
})
export class MolActionButtonComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() iconSlot: IconSlot = "start";
  @Input() color: string = "primary";
  @Input() size: ButtonSize = "default";
  @Input() fill: ButtonFill = "solid";
  @Input() expand?: ButtonExpand;
  @Input() shape: ButtonShape = "default";
  @Input() disabled: boolean = false;
  @Input() type: ButtonType = "button";

  @Output() action = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled) {
      this.action.emit();
    }
  }
}
