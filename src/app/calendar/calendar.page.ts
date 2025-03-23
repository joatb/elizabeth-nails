import { Component, OnInit, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarApi, CalendarOptions, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ActionSheetController } from '@ionic/angular';
import { IonNav, IonModal } from '@ionic/angular/standalone';
import { Models } from 'appwrite';
import { dateFormatter } from '../../shared/date-formatter/date-formatter';
import { SharedModule } from '../modules/shared.module';
import { SchedulesProvider } from '../providers/schedules.provider';
import { AuthService } from '../services/auth.service';
import { CalendarScheduleComponent } from './components/calendar-schedule/calendar-schedule.component';
import { EventService } from '../services/event.service';
import tippy from 'tippy.js';
import { AppointmentsProvider } from '../providers/appointments.provider';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss'],
  imports: [SharedModule, FullCalendarModule],
})
export class CalendarPage implements OnInit{

  component = 'CalendarPage';
  schedules: Models.DocumentList<Models.Document> | null = null;
  appointments: Models.DocumentList<Models.Document> | null = null;
  calendarOptions?: CalendarOptions;

  eventsPromise?: Promise<EventInput[]>;

  showModalBackButton: boolean = false;

  @ViewChild('nav') private nav!: IonNav;
  @ViewChild('modal') private modal!: IonModal;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  private calendarApi!: CalendarApi;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private appointmentsPvd: AppointmentsProvider,
    private actionSheetCtrl: ActionSheetController,
    private events: EventService
  ) {
    this.calendarOptions = {
      timeZone: 'Europe/Madrid',
      initialView: 'dayGridMonth',
      locale: esLocale,
      navLinks: true,
      titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      headerToolbar: {
        start: 'title', // will normally be on the left. if RTL, will be on the right
        center: '',
        end: 'prev,next dayGridMonth,timeGridDay', // will normally be on the right. if RTL, will be on the left
      },
      nowIndicator: true,
      plugins: [timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin],
      dateClick: (arg: any) => this.handleDateClick(arg),
      events: [
        { title: 'Mari Angels', start: '2025-03-23 12:00:00', end: '2025-03-23 13:00:00', extendedProps: { description: 'Uñas rojas' } },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        { title: 'Isabel Romero', start: '2025-03-23 13:00:00', end: '2025-03-23 14:00:00' },
        {
          title: 'Special Business Hours',
          start: '2025-02-16 08:00:00',
          end: '2025-02-16 14:00:00',
          rendering: 'background'
        }
      ],
      dayMaxEventRows: true,
      eventColor: '#FE7B92',
      businessHours: [ // specify an array instead
        {
          daysOfWeek: [ 1, 2, 3 ], // Monday, Tuesday, Wednesday
          startTime: '08:00', // 8am
          endTime: '18:00' // 6pm
        },
        {
          daysOfWeek: [ 4, 5 ], // Thursday, Friday
          startTime: '10:00', // 10am
          endTime: '16:00' // 4pm
        }
      ],
      eventDidMount: (info) => {
        tippy(info.el, {
          content: info.event.extendedProps['description'],
          trigger: 'mouseenter',
          allowHTML: true,
        });
      },
    };
  }

  ngAfterViewInit() {
    this.calendarApi = this.calendarComponent.getApi();
    if (this.calendarOptions) {
      this.calendarOptions.datesSet = () => {
        this.fetchAppointments();
      };
    }
    this.initialize();
  }


  async ngOnInit() {
    this.subscribeEvents();
  }

  async initialize(){
    this.fetchAppointments();
    this.fetchSchedules();
  }

  reload() {
    this.initialize();
  }

  async fetchSchedules() {
    let businessHours = [];
    this.schedules = await this.schedulesPvd.listSchedules();

    // Add business hours to calendar
    this.schedules.documents.forEach(schedule => {
      businessHours.push({
        daysOfWeek: schedule['days'],
        startTime: schedule['start_time'],
        endTime: schedule['end_time']
      });
      this.calendarOptions!.businessHours = businessHours;
      console.log(schedule);
    });
  }
  async fetchAppointments() {
    let events: EventInput[] = [];
    let calendarDate = this.calendarApi.getDate();
    this.appointments = await this.appointmentsPvd.listAppointments(calendarDate.getMonth()+1, calendarDate.getFullYear());
    let businessHours = [];

    // Add appointments to events
    this.appointments.documents.forEach(appointment => {
      events.push({
        title: appointment['client'].name,
        start: appointment['start_time'],
        end: appointment['end_time'],
        extendedProps: { description: appointment['note'] }
      });
    });
    this.calendarOptions!.events = events;
  }

  async onWillPresent() {
    this.nav.setRoot(CalendarScheduleComponent, {nav: this.nav});
    const canGoBack = await this.nav.canGoBack();
    this.showModalBackButton = canGoBack;
  }

  async modalClose() {
    const canGoBack = await this.nav.canGoBack();
    if(canGoBack) {
      this.nav.pop();
    } else {
      this.modal.dismiss().then(() => {
        this.reload();
      });
    }
  }

  async handleDateClick(arg: any) {
    console.log(arg);
    if(this.checkIfBussinessDay(new Date(arg.dateStr))) {
      //alert('date click! ' + arg.dateStr)
      const actionSheet = await this.actionSheetCtrl.create({
        header: dateFormatter({value: arg.dateStr}, false),
        buttons: [
          {
            text: 'Añadir cita',
            role: 'destructive',
            handler: () => {
  
            }
          },
          {
            text: 'Habilitar/Deshabilitar (No implementado aún)',
            data: {
              action: 'share',
              role: 'destructive',
              handler: () => {
              
              },
            },
            disabled: true
          },
          {
            text: 'Cancelar',
            role: 'cancel',
          },
        ],
      });
  
      await actionSheet.present();
    }
  }

  checkIfBusinessHours(date: Date) {
    const time = date.toTimeString().split(' ')[0]; // Extract time in HH:MM:SS format
    return this.schedules?.documents.some(schedule => {
      const startTime = schedule['start_time'];
      const endTime = schedule['end_time'];
      return time >= startTime && time <= endTime;
    }) || false;
  }

  checkIfBussinessDay(date: Date) {
    return this.schedules?.documents.some(schedule => {
      return schedule['days'].includes(date.getDay().toString());
    }) || false;
  }

  getNextAvailableDateByDatetime(date: Date) {
    const time = date.toTimeString().split(' ')[0]; // Extract time in HH:MM:SS format
    const day = date.getDay().toString();
    const schedule = this.schedules?.documents.find(schedule => {
      return schedule['days'].includes(day) && time <= schedule['start_time'];
    });
    if(schedule) {
      return new Date(`${date.toDateString()} ${schedule['start_time']}`);
    }
    return null;
  }

getNextAvailableDateByDateTimeRange(date: Date) {
    const time = date.toTimeString().split(' ')[0]; // Extract time in HH:MM:SS format
    const day = date.getDay().toString();
    const schedule = this.schedules?.documents.find(schedule => {
      return schedule['days'].includes(day) && time <= schedule['start_time'];
    });
    if(schedule) {
      return new Date(`${date.toDateString()} ${schedule['start_time']}`);
    }
    return null;
  }

  subscribeEvents() {
    this.events.getObservable().subscribe((event) => {
      if(event.name === 'add.calendar') {
        console.log('add.calendar', event.value);
      }
    });
  }
}
