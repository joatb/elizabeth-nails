import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton } from "@ionic/angular/standalone";
import { LucideAngularModule, Trash } from "lucide-angular";
import { AtomTimelineDotComponent } from "../../atoms/atom-timeline-dot/atom-timeline-dot.component";

type DayEventClient = {
  name: string;
  phone_country: string;
  phone: string;
};

export type DayEventItem = {
  start_time: string | Date;
  end_time: string | Date;
  client: DayEventClient;
  note?: string | null;
  $id?: string;
};

@Component({
  selector: "mol-day-event-item",
  standalone: true,
  templateUrl: "./mol-day-event-item.component.html",
  styleUrls: ["./mol-day-event-item.component.scss"],
  imports: [CommonModule, IonButton, LucideAngularModule, AtomTimelineDotComponent],
})
export class MolDayEventItemComponent {
  @Input({ required: true }) event!: DayEventItem;
  @Input() showDelete: boolean = true;

  @Output() delete = new EventEmitter<DayEventItem>();

  readonly Trash = Trash;

  handleDelete(): void {
    this.delete.emit(this.event);
  }
}
