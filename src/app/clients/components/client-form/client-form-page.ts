import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../modules/shared.module';
import { ClientsProvider } from '../../../providers/clients.provider';



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
    private clientProvider: ClientsProvider
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
    });
  }

  async submit() {
    if(this.form.valid) {
      await this.clientProvider.createClient(this.form.value);
    }
  }
}
