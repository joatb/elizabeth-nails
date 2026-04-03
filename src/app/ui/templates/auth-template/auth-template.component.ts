import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "tpl-auth-template",
  standalone: true,
  templateUrl: "./auth-template.component.html",
  styleUrls: ["./auth-template.component.scss"],
  imports: [CommonModule],
})
export class AuthTemplateComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() logoUrl?: string;
  @Input() logoAlt: string = "Logo";
  @Input() centerContent: boolean = true;

  get containerClass(): string {
    return this.centerContent
      ? "auth-template auth-template--center"
      : "auth-template";
  }
}
