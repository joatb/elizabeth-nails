import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

type StatValue = string | number;

@Component({
  selector: "mol-stat-item",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./mol-stat-item.component.html",
  styleUrls: ["./mol-stat-item.component.scss"],
})
export class MolStatItemComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: StatValue;
  @Input() helperText?: string;
  @Input() valueColor?: string;
}
