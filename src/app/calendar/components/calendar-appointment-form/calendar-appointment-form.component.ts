import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonNav, ModalController } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';
import { IonicSelectableComponent } from 'ionic-selectable';
import { ClientsProvider } from '../../../providers/clients/clients.provider';
import { Models } from 'appwrite';
import { Client } from '../../../providers/clients/models/client';
import { Subscription } from 'rxjs';
import { EventService } from '../../../services/event.service';


@Component({
  selector: 'app-calendar-appointment-form',
  templateUrl: 'calendar-appointment-form.component.html',
  styleUrl: 'calendar-appointment-form.component.scss',
  imports: [SharedModule, ReactiveFormsModule, IonicSelectableComponent],
})
export class CalendarAppointmentFormComponent {

    form!: FormGroup;
    @Input() startTime: string = '';
    @Input() endTime: string = '';
    @Output() submitEvent = new EventEmitter<any>();    ;

    protected clients: Models.DocumentList<Client> | null = null;
    protected selectableClientsOptions: Array<{id: string, name: string}> = [];
    private eventsSubscription: Subscription | null = null;
    
    
    constructor(
      private fb: FormBuilder,
      private modalCtrl: ModalController,
      private clientsPvd: ClientsProvider,
      private events: EventService,
    ) {}

    ionViewDidEnter(){
      this.subscribeToEvents();
    }
    ionViewDidLeave(){
      this.eventsSubscription?.unsubscribe();
      this.eventsSubscription = null;
    }
  
    async ngOnInit() {
      this.subscribeToEvents();
      this.form = this.fb.group({
        note: [''],
        client: ['', [Validators.required]],
      });

      this.clients = await this.clientsPvd.listClients();

      this.selectableClientsOptions = this.clients?.documents.map((client) => {
        return {
          id: client.$id,
          name: client.name,
        };
      }
      ) || [];
    }

    ngOnDestroy() {
      this.eventsSubscription?.unsubscribe();
      this.eventsSubscription = null;
    }
  
    async submit() {
      if(this.form.valid) {
        this.modalCtrl.dismiss(this.form.value);
      }
    }

    onClientChange(event: any) {
      this.form.controls['client'].setValue(event.value);
    }

    async subscribeToEvents() {
      this.eventsSubscription = this.events.getObservable().subscribe(async (event) => {
        if (event.name === 'submit') {
          const appointment = {
            start_time: this.startTime,
            end_time: this.endTime,
            note: this.form.controls['note'].value,
            client: this.form.controls['client'].value.id,
          }
          this.submitEvent.emit(appointment);
        }
      });
    }
}
