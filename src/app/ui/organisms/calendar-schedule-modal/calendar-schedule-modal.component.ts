import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
// IonModal and IonContent provided via SharedModule (IonicModule); evitar import standalone para prevenir selectores duplicados
import { ModalTemplateComponent } from "../../templates/modal-template/modal-template.component";
import { CalendarScheduleComponent } from "../calendar-schedule-grid/calendar-schedule.component";
import { SharedModule } from "../../../modules/shared.module";

@Component({
  selector: "org-calendar-schedule-modal",
  standalone: true,
  templateUrl: "./calendar-schedule-modal.component.html",
  styleUrls: ["./calendar-schedule-modal.component.scss"],
  imports: [
    SharedModule,
    CommonModule,
    ModalTemplateComponent,
    CalendarScheduleComponent,
  ],
})
export class CalendarScheduleModalComponent {
  @Input() title: string = "Horarios";
  @Input() triggerId: string = "openModal";

  @Output() closed = new EventEmitter<void>();

  @ViewChild("modal") private modal!: any;

  async handleClose(): Promise<void> {
    // Simplificado: cerrar el modal directamente y notificar al padre.
    await this.modal.dismiss();
    this.closed.emit();
  }
}
