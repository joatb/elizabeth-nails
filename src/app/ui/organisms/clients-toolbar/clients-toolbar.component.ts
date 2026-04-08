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
  selector: "org-clients-toolbar",
  standalone: true,
  templateUrl: "./clients-toolbar.component.html",
  styleUrls: ["./clients-toolbar.component.scss"],
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
export class ClientsToolbarComponent {
  @Input() title: string = "Clientes";
  @Input() showLogoutButton: boolean = true;
  @Input() logoutIcon?: any;

  @Output() logout = new EventEmitter<void>();

  handleLogout(): void {
    this.logout.emit();
  }
}
