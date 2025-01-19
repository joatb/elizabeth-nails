import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { SharedModule } from '../modules/shared.module';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss'],
  imports: [SharedModule, FullCalendarModule],
})
export class CalendarPage {

  calendarOptions: CalendarOptions = {
    timeZone: 'Europe/Madrid',
    initialView: 'timeGridWeek',
    locale: esLocale,
    navLinks: true,
    titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
    headerToolbar: {
      start: 'title', // will normally be on the left. if RTL, will be on the right
      center: '',
      end: 'prev,next listWeek dayGridMonth timeGridWeek,timeGridDay' // will normally be on the right. if RTL, will be on the left
    },
    nowIndicator: true,
    plugins: [timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin],
    dateClick: (arg: any) => this.handleDateClick(arg),
    events: [
      { title: 'Mari Angels', start: '2024-12-28 12:00:00', end: '2024-12-28 13:00:00' },
      { title: 'Isabel Romero', start: '2024-12-29 11:00:00', end: '2024-12-29 13:00:00' }
    ],
    eventColor: '#FE7B92',
  };

  eventsPromise?: Promise<EventInput[]>;

  constructor() {}

  handleDateClick(arg: any) {
    alert('date click! ' + arg.dateStr)
  }
}
