import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: "org-calendar-toolbar",
  standalone: true,
  templateUrl: "./calendar-toolbar.component.html",
  styleUrls: ["./calendar-toolbar.component.scss"],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    LucideAngularModule,
  ],
})
export class CalendarToolbarComponent {
  @Input() title: string = "Calendario";

  @Input() showLogoutButton: boolean = true;
  @Input() showScheduleButton: boolean = true;
  @Input() showConfigButton: boolean = true;

  @Input() scheduleButtonId: string = "openModal";
  @Input() configButtonId: string = "openConfigModal";

  @Input() logoutIcon?: any;
  @Input() scheduleIcon?: any;
  @Input() configIcon?: any;

  @Output() logout = new EventEmitter<void>();

  handleLogout(): void {
    this.logout.emit();
  }
}
