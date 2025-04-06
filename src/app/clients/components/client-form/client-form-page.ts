import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';


@Component({
  selector: 'app-client-form',
  templateUrl: 'client-form.page.html',
  imports: [SharedModule, ReactiveFormsModule]
})
export class ClientFormPage implements OnInit {
  form!: FormGroup;

  @Input() title: string = 'Nuevo cliente';
  @Input() client: any;
  
  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
    });
  }

  async submit() {
    if(this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }
}
