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
  @Input() showViewModeButton: boolean = false;

  @Input() scheduleButtonId: string = "openModal";
  @Input() configButtonId: string = "openConfigModal";

  @Input() logoutIcon?: any;
  @Input() scheduleIcon?: any;
  @Input() configIcon?: any;
  @Input() viewModeIcon?: any;
  @Input() viewMode: "day" | "employees" = "day";

  @Output() logout = new EventEmitter<void>();
  @Output() viewModeChange = new EventEmitter<"day" | "employees">();

  handleLogout(): void {
    this.logout.emit();
  }

  handleToggleViewMode(): void {
    this.viewModeChange.emit(this.viewMode === "day" ? "employees" : "day");
  }
}
