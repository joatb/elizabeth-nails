import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

type StatusType = "ok" | "warning" | "error" | "neutral";

@Component({
  selector: "atom-status-indicator",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./atom-status-indicator.component.html",
  styleUrls: ["./atom-status-indicator.component.scss"],
})
export class AtomStatusIndicatorComponent {
  @Input() status: StatusType = "neutral";
  @Input() label?: string;

  get statusClass(): string {
    switch (this.status) {
      case "ok":
        return "status-indicator__dot--ok";
      case "warning":
        return "status-indicator__dot--warning";
      case "error":
        return "status-indicator__dot--error";
      default:
        return "status-indicator__dot--neutral";
    }
  }
}
