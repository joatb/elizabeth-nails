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
  selector: "app-service-form",
  templateUrl: "service-form.page.html",
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
})
export class ServiceFormPage implements OnInit {
  @Input() title: string = "Nuevo servicio";
  @Input() service: {
    name: string;
    description: string;
    price: number;
    color: string;
  } | null = null;

  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private alertService: AlertService,
  ) {
    this.form = new FormGroup({
      name: new FormControl("", [Validators.required]),
      description: new FormControl(""),
      price: new FormControl(0, [Validators.required, Validators.min(0)]),
      color: new FormControl("#5e81ac", [Validators.required]),
    });
  }

  ngOnInit(): void {
    if (!this.service) return;

    this.form.patchValue({
      name: this.service.name,
      description: this.service.description,
      price: Number(this.service.price) || 0,
      color: this.normalizeColor(this.service.color),
    });
  }

  async submit() {
    if (this.form.valid) {
      await this.modalCtrl.dismiss({
        ...this.form.value,
        color: this.normalizeColor(this.form.value.color),
      });
      await this.alertService.presentToast("Servicio guardado", 2500);
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
