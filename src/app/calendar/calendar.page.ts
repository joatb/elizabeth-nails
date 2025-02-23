import { Component, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
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

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss'],
  imports: [SharedModule, FullCalendarModule],
})
export class CalendarPage implements OnInit{

  component = 'CalendarPage';
  schedules: Models.DocumentList<Models.Document> | null = null;
  calendarOptions?: CalendarOptions;

  eventsPromise?: Promise<EventInput[]>;

  showModalBackButton: boolean = false;

  @ViewChild('nav') private nav!: IonNav;
  @ViewChild('modal') private modal!: IonModal;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private actionSheetCtrl: ActionSheetController,
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
        { title: 'Mari Angels', start: '2024-12-28 12:00:00', end: '2024-12-28 13:00:00' },
        { title: 'Isabel Romero', start: '2024-12-29 11:00:00', end: '2024-12-29 13:00:00' },
        {
          title: 'Special Business Hours',
          start: '2025-02-16 08:00:00',
          end: '2025-02-16 14:00:00',
          rendering: 'background'
        }
      ],
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
      ]
    };
  }

  async ngOnInit() {
    this.schedules = await this.schedulesPvd.listSchedules();
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
      this.modal.dismiss();
    }
  }

  async handleDateClick(arg: any) {
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
          text: 'Habilitar/Deshabilitar',
          data: {
            action: 'share',
            role: 'destructive',
            handler: () => {
            
            }
          },
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
