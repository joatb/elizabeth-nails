import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../../../modules/shared.module";

type LoginSubmitEvent = {
  email: string;
  password: string;
};

@Component({
  selector: "org-login-form",
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: "./login-form.component.html",
  styleUrls: ["./login-form.component.scss"],
})
export class LoginFormComponent {
  @Input() title: string = "Elizabeth Nails";
  @Input() subtitle: string = "Inicia sesión para acceder a tu cuenta";
  @Input() submitLabel: string = "Iniciar Sesión";
  @Input() logoUrl?: string;
  @Input() disabled: boolean = false;

  @Input() email: string = "";
  @Output() emailChange = new EventEmitter<string>();

  @Input() password: string = "";
  @Output() passwordChange = new EventEmitter<string>();

  @Output() loginSubmit = new EventEmitter<LoginSubmitEvent>();

  showPassword: boolean = false;

  get isSubmitDisabled(): boolean {
    return this.disabled || !this.email || !this.password;
  }

  handleEmailChange(value: string): void {
    this.email = value;
    this.emailChange.emit(value);
  }

  handlePasswordChange(value: string): void {
    this.password = value;
    this.passwordChange.emit(value);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  handleSubmit(): void {
    if (this.isSubmitDisabled) {
      return;
    }

    this.loginSubmit.emit({
      email: this.email,
      password: this.password,
    });
  }
}
