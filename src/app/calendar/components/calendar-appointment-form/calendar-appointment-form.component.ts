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
    formSubmitted = false;
    
    // Variables para infinite scroll y búsqueda
    private currentOffset = 0;
    private readonly limit = 50;
    private isLoadingMore = false;
    private hasMoreClients = true;
    private currentSearchTerm = '';
    
    
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
        startTime: [this.startTime, [Validators.required]],
        endTime: [this.endTime, [Validators.required]],
      });

      await this.loadInitialClients();
    }

    ngOnDestroy() {
      this.eventsSubscription?.unsubscribe();
      this.eventsSubscription = null;
    }
  
    async submit() {
      this.formSubmitted = true;
      if(this.form.valid) {
        const formValue = this.form.value;
        const utcStartTime = this.convertToUTC(formValue.startTime);
        const utcEndTime = this.convertToUTC(formValue.endTime);
        
        this.modalCtrl.dismiss({
          ...formValue,
          startTime: utcStartTime,
          endTime: utcEndTime
        });
      }
    }

    private convertToUTC(dateTime: string): string {
      const date = new Date(dateTime);
      return date.toISOString();
    }

    onClientChange(event: any) {
      this.form.controls['client'].setValue(event.value);
    }

    /**
     * Carga los clientes iniciales
     */
    private async loadInitialClients() {
      try {
        this.clients = await this.clientsPvd.listClients(this.limit, 0);
        this.selectableClientsOptions = this.clients?.documents.map((client) => ({
          id: client.$id,
          name: client.name,
        })) || [];
        
        this.currentOffset = this.limit;
        this.hasMoreClients = this.clients ? this.clients.documents.length === this.limit : false;
      } catch (error) {
        console.error('Error loading initial clients:', error);
        this.selectableClientsOptions = [];
      }
    }

    /**
     * Maneja la búsqueda de clientes
     */
    async onClientSearch(event: { text: string }) {
      const searchTerm = event.text?.trim();
      this.currentSearchTerm = searchTerm;

      if (!searchTerm || searchTerm.length === 0) {
        // Si no hay término de búsqueda, cargar clientes iniciales
        await this.loadInitialClients();
        return;
      }

      try {
        // Buscar clientes por nombre en la base de datos
        const searchResults = await this.clientsPvd.searchClientsByName(searchTerm);
        this.selectableClientsOptions = searchResults.map((client) => ({
          id: client.$id,
          name: client.name,
        }));
        
        // Resetear variables de paginación para búsqueda
        this.currentOffset = 0;
        this.hasMoreClients = false; // Para búsquedas no usamos infinite scroll
      } catch (error) {
        console.error('Error searching clients:', error);
        this.selectableClientsOptions = [];
      }
    }

    /**
     * Maneja la carga de más clientes (infinite scroll)
     */
    async onClientLoadMore(event: { component: any; text: string }) {
      // Si está cargando o hay búsqueda activa, no hacer nada
      if (this.isLoadingMore || this.currentSearchTerm) {
        event.component.endInfiniteScroll();
        return;
      }

      // Si no hay más clientes, deshabilitar infinite scroll
      if (!this.hasMoreClients) {
        event.component.disableInfiniteScroll();
        return;
      }

      this.isLoadingMore = true;

      try {
        const moreClients = await this.clientsPvd.listClients(this.limit, this.currentOffset);
        
        if (moreClients && moreClients.documents.length > 0) {
          const newOptions = moreClients.documents.map((client) => ({
            id: client.$id,
            name: client.name,
          }));
          
          // Concatenar con los items existentes del componente
          const allOptions = event.component.items.concat(newOptions);
          event.component.items = allOptions;
          
          // Actualizar también nuestra variable local
          this.selectableClientsOptions = allOptions;
          this.currentOffset += this.limit;
          
          // Solo deshabilitar si recibimos menos clientes de los esperados
          this.hasMoreClients = moreClients.documents.length === this.limit;
        } else {
          this.hasMoreClients = false;
        }
      } catch (error) {
        console.error('Error loading more clients:', error);
        this.hasMoreClients = false;
      } finally {
        this.isLoadingMore = false;
        
        // Finalizar el infinite scroll según la documentación
        event.component.endInfiniteScroll();
        
        // Solo deshabilitar infinite scroll si no hay más clientes
        if (!this.hasMoreClients) {
          event.component.disableInfiniteScroll();
        }
      }
    }

    async subscribeToEvents() {
      this.eventsSubscription = this.events.getObservable().subscribe(async (event) => {
        if (event.name === 'submit') {
          this.formSubmitted = true;
          if(this.form.valid) {
            const appointment = {
              start_time: this.convertToUTC(this.form.controls['startTime'].value),
              end_time: this.convertToUTC(this.form.controls['endTime'].value),
              note: this.form.controls['note'].value,
              client: this.form.controls['client'].value.id,
            }
            this.submitEvent.emit(appointment);
          }
        }
      });
    }

    isControlInvalid(controlName: string): boolean {
      const control = this.form.get(controlName);
      return !!control && control.invalid && (control.touched || this.formSubmitted);
    }

}
