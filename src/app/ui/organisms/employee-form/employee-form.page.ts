import { Component, Input, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ModalController } from "@ionic/angular/standalone";
import { SharedModule } from "../../../modules/shared.module";
import { AlertService } from "../../../services/alert.service";

@Component({
  selector: "app-employee-form",
  templateUrl: "employee-form.page.html",
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
})
export class EmployeeFormPage implements OnInit {
  @Input() title: string = "Nuevo empleado";
  @Input() employee: {
    name: string;
    color: string;
    active: boolean;
  } | null = null;

  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private alertService: AlertService,
  ) {
    this.form = new FormGroup({
      name: new FormControl("", [Validators.required]),
      color: new FormControl("#5e81ac", [Validators.required]),
      active: new FormControl(true),
    });
  }

  ngOnInit(): void {
    if (!this.employee) return;

    this.form.patchValue({
      name: this.employee.name,
      color: this.normalizeColor(this.employee.color),
      active: this.employee.active,
    });
  }

  async submit() {
    if (this.form.valid) {
      await this.modalCtrl.dismiss({
        ...this.form.value,
        color: this.normalizeColor(this.form.value.color),
      });
      await this.alertService.presentToast("Empleado guardado", 2500);
      return;
    }

    await this.alertService.presentToast("Datos inválidos", 2500);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  private normalizeColor(value: string | null | undefined): string {
    if (!value || typeof value !== "string") return "#5e81ac";
    const hex = value.trim();
    if (/^#([A-Fa-f0-9]{6})$/.test(hex)) return hex;
    if (/^#([A-Fa-f0-9]{3})$/.test(hex)) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return "#5e81ac";
  }
}
