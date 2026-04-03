import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "atom-timeline-dot",
  standalone: true,
  templateUrl: "./atom-timeline-dot.component.html",
  styleUrls: ["./atom-timeline-dot.component.scss"],
  imports: [CommonModule],
})
export class AtomTimelineDotComponent {
  @Input() size: number = 14;
  @Input() color: string = "var(--ion-color-primary)";
  @Input() borderColor: string = "#fff";
  @Input() shadowColor: string = "rgba(var(--ion-color-primary-rgb), 0.2)";
}
