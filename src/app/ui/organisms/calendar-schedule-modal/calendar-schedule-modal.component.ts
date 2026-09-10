import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
// IonModal and IonContent provided via SharedModule (IonicModule); evitar import standalone para prevenir selectores duplicados
import { Subscription } from "rxjs";
import { ModalTemplateComponent } from "../../templates/modal-template/modal-template.component";
import { CalendarScheduleComponent } from "../calendar-schedule-grid/calendar-schedule.component";
import { SharedModule } from "../../../modules/shared.module";
import { EventService } from "../../../services/event.service";

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
export class CalendarScheduleModalComponent implements OnInit, OnDestroy {
  @Input() title: string = "Horarios";
  @Input() triggerId: string = "openModal";

  @Output() closed = new EventEmitter<void>();

  @ViewChild("modal") private modal!: any;

  private eventsSubscription: Subscription | null = null;

  constructor(private events: EventService) {}

  ngOnInit(): void {
    // El botón que abre este modal vive dentro de un ion-popover (menú
    // "Ajustes"), cuyo contenido no existe en el DOM hasta que se abre —
    // el [trigger]/id de Ionic no llega a engancharse porque en el momento
    // en que este modal se inicializa, ese elemento con el id aún no existe.
    // Se abre entonces vía EventService, igual que ya hace el botón "+".
    this.eventsSubscription = this.events.getObservable().subscribe((event) => {
      if (event?.name === "open-schedule-modal") {
        void this.modal?.present();
      }
    });
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async handleClose(): Promise<void> {
    // Simplificado: cerrar el modal directamente y notificar al padre.
    await this.modal.dismiss();
    this.closed.emit();
  }
}
