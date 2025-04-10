import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-client-form',
  templateUrl: 'client-form.page.html',
  imports: [SharedModule, ReactiveFormsModule],
})
export class ClientFormPage {
  @Input() title: string = 'Nuevo cliente';
  @Input() client: any;

  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{9}$')]),
      phone_country: new FormControl('34', [Validators.required, Validators.pattern('^[0-9]{1,3}$')])
    });
  }

  async submit() {
    if (this.form.valid) {
      await this.modalCtrl.dismiss(this.form.value);
      await this.alertService.presentToast('Cliente guardado', 2500);
    } else {
      await this.alertService.presentToast('Datos inválidos', 2500);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
