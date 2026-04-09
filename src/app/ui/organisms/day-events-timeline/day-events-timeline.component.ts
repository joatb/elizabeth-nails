import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AtomSpinnerComponent } from "../../atoms/atom-spinner/atom-spinner.component";
import {
  DayEventItem,
  MolDayEventItemComponent,
} from "../../molecules/mol-day-event-item/mol-day-event-item.component";
import { MolAddEventButtonComponent } from "../../molecules/mol-add-event-button/mol-add-event-button.component";

@Component({
  selector: "org-day-events-timeline",
  standalone: true,
  templateUrl: "./day-events-timeline.component.html",
  styleUrls: ["./day-events-timeline.component.scss"],
  imports: [
    CommonModule,
    AtomSpinnerComponent,
    MolAddEventButtonComponent,
    MolDayEventItemComponent,
  ],
})
export class DayEventsTimelineComponent {
  @Input() events: DayEventItem[] = [];
  @Input() loading: boolean = false;
  @Input() emptyText: string = "No hay citas para este día.";
  @Input() showAddButton: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() showEdit: boolean = true;

  @Output() addEvent = new EventEmitter<void>();
  @Output() deleteEvent = new EventEmitter<DayEventItem>();
  @Output() editEvent = new EventEmitter<DayEventItem>();

  get hasEvents(): boolean {
    return this.events.length > 0;
  }

  handleAddEvent(): void {
    this.addEvent.emit();
  }

  handleDeleteEvent(event: DayEventItem): void {
    this.deleteEvent.emit(event);
  }

  handleEditEvent(event: DayEventItem): void {
    this.editEvent.emit(event);
  }
}
