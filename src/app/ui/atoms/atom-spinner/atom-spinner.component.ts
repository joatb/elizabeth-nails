import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { IonSpinner } from "@ionic/angular/standalone";

type SpinnerSize = "small" | "default" | "large";
type SpinnerName =
  | "lines"
  | "lines-small"
  | "dots"
  | "dots-small"
  | "bubbles"
  | "bubbles-small"
  | "circles"
  | "circles-small"
  | "crescent"
  | "circular"
  | "default";

@Component({
  selector: "atom-spinner",
  standalone: true,
  templateUrl: "./atom-spinner.component.html",
  styleUrl: "./atom-spinner.component.scss",
  imports: [CommonModule, IonSpinner],
})
export class AtomSpinnerComponent {
  @Input() name: SpinnerName = "crescent";
  @Input() color: string = "primary";
  @Input() paused: boolean = false;
  @Input() duration?: number;
  @Input() size: SpinnerSize = "default";
  @Input() pixelSize?: number;
  @Input() ariaLabel: string = "Cargando";

  get resolvedSize(): number {
    if (typeof this.pixelSize === "number" && this.pixelSize > 0) {
      return this.pixelSize;
    }

    switch (this.size) {
      case "small":
        return 16;
      case "large":
        return 32;
      default:
        return 24;
    }
  }
}
