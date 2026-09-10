import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { LucideAngularModule } from "lucide-angular";

// Mismo breakpoint usado en full-calendar.scss para el resto del calendario.
const MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";

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
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    LucideAngularModule,
  ],
})
export class CalendarToolbarComponent implements OnInit, OnDestroy {
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
  @Input() moreIcon?: any;
  @Input() viewMode: "day" | "employees" = "day";

  @Output() logout = new EventEmitter<void>();
  @Output() viewModeChange = new EventEmitter<"day" | "employees">();

  readonly moreButtonId = "openMoreMenu";
  isMobile = false;

  private mobileMediaQuery?: MediaQueryList;
  private readonly handleMobileQueryChange = (ev: MediaQueryListEvent): void => {
    this.isMobile = ev.matches;
  };

  ngOnInit(): void {
    this.mobileMediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    this.isMobile = this.mobileMediaQuery.matches;
    this.mobileMediaQuery.addEventListener("change", this.handleMobileQueryChange);
  }

  ngOnDestroy(): void {
    this.mobileMediaQuery?.removeEventListener("change", this.handleMobileQueryChange);
  }

  handleLogout(): void {
    this.logout.emit();
  }

  handleToggleViewMode(): void {
    this.viewModeChange.emit(this.viewMode === "day" ? "employees" : "day");
  }
}
