import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import {
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';
import { CalendarApi, CalendarOptions, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { IonModal, IonNav } from '@ionic/angular/standalone';
import { Models } from 'appwrite';
import { LogOut, Clock, EllipsisVertical, CalendarDays } from 'lucide-angular';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { Day } from '../models/day';
import { SharedModule } from '../modules/shared.module';
import { AppointmentsProvider } from '../providers/appointments/appointments.provider';
import { Appointment } from '../providers/appointments/models/appointment';
import { Schedule } from '../providers/schedules/models/schedule';
import { SchedulesProvider } from '../providers/schedules/schedules.provider';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { CalendarAppointmentModalComponent } from './components/calendar-appointment-modal/calendar-appointment-modal';
import { CalendarEventInfoComponent } from './components/calendar-event-info/calendar-event-info.component';
import { CalendarScheduleComponent } from './components/calendar-schedule/calendar-schedule.component';
import { ConfigModalComponent } from '../components/modals/config-modal/config-modal.component';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss'],
  imports: [SharedModule, FullCalendarModule, ConfigModalComponent],
})
export class CalendarPage {
  readonly LogOut =  LogOut;
  readonly Clock =  Clock;
  readonly EllipsisVertical =  EllipsisVertical;
  component = 'CalendarPage';
  schedules: Models.DocumentList<Schedule> | null = null;
  appointments: Models.DocumentList<Appointment> | null = null;
  calendarOptions?: CalendarOptions;

  eventsPromise?: Promise<EventInput[]>;

  showModalBackButton: boolean = false;

  modalTitle: string = 'Horarios';

  @ViewChild('nav') private nav!: IonNav;
  @ViewChild('modal') private modal!: IonModal;
  @ViewChild('monthDatetime') monthDatetime: any;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  private calendarApi!: CalendarApi;

  private eventsSubscription: Subscription | null = null;

  isLoadingEvents: boolean = false;

  isMonthPickerOpen: boolean = false;
  monthPickerValue: string = DateTime.local().startOf('month').toISODate() ?? '';

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private appointmentsPvd: AppointmentsProvider,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private alertService: AlertService,
    private events: EventService,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {
    this.calendarOptions = {
      timeZone: 'local',
      initialView: 'dayGridMonth',
      locale: esLocale,
      navLinks: true,
      titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      headerToolbar: {
        start: 'title',
        center: '',
        end: 'prev todayButton next monthPicker dayGridMonth,timeGridDay',
      },
      customButtons: {
        todayButton: {
          text: 'Mes actual',
          hint: 'Volver al mes actual',
          click: () => this.goToToday()
        },
        monthPicker: {
          text: '📅',
          hint: 'Seleccionar mes',
          click: () => this.openMonthPicker()
        }
      },
      displayEventEnd: true,
      nowIndicator: true,
      plugins: [timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin],
      dateClick: (arg: any) => this.handleDateClick(arg),
      moreLinkClick: (arg: any) => this.handleMoreLinkClick(arg),
      eventClick: (info) => this.handleEventClick(info),
      dayMaxEventRows: true,
      eventColor: 'var(--ion-color-primary)',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
      },
      eventOverlap: false,
      eventConstraint: {
        startTime: '00:00',
        endTime: '24:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      },
      eventDisplay: 'block',
      eventMaxStack: 4
    };
  }

  ngAfterViewInit() {
    this.calendarApi = this.calendarComponent.getApi();
    if (this.calendarOptions) {
      this.calendarOptions.datesSet = () => {
        this.fetchAppointments();
        this.updateTodayButtonVisibility();
      };
    }
    this.initialize();
  }

  ionViewDidEnter() {
    this.subscribeToEvents();
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 1);
  }
  ionViewDidLeave() {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async initialize() {
    await this.fetchAppointments();
    await this.fetchSchedules();
    this.updateTodayButtonVisibility();
  }

  reload() {
    this.initialize();
  }

  async fetchSchedules() {
    let businessHours = [];
    this.schedules = await this.schedulesPvd.listSchedules();

    // Add business hours to calendar
    this.schedules.documents.forEach((schedule) => {
      businessHours.push({
        daysOfWeek: schedule.days,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      });
      this.calendarOptions!.businessHours = businessHours;
    });
  }
  async fetchAppointments() {
    this.isLoadingEvents = true;
    this.cdr.detectChanges();
    let events: EventInput[] = [];
    let calendarDate = this.calendarApi.getDate();
    let year = calendarDate.getFullYear();
    let month = calendarDate.getMonth() + 1;

    // Calculate start (first day of previous month) and end (last day of next month)
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear++;
    }

    // Start date: first day of previous month
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    // End date: last day of next month
    const endDate = new Date(nextYear, nextMonth, 0); // day 0 of following month = last day of nextMonth

    // Single call to provider
    this.appointments = await this.appointmentsPvd.listAppointmentsInRange(startDate, endDate);

    this.appointments.documents.forEach((appointment) => {
      events.push({
        title: appointment.client.name,
        start: appointment.start_time,
        end: appointment.end_time,
        extendedProps: {
          id: appointment.$id,
          description: appointment.note,
          phone_country: appointment.client.phone_country,
          phone: appointment.client.phone
        },
      });
    });
    this.calendarOptions!.events = events;
    this.isLoadingEvents = false;
    this.cdr.detectChanges();
  }

  async onWillPresent() {
    this.nav.setRoot(CalendarScheduleComponent, { nav: this.nav });
    const canGoBack = await this.nav.canGoBack();
    this.showModalBackButton = canGoBack;
  }

  async modalClose() {
    const canGoBack = await this.nav.canGoBack();
    if (canGoBack) {
      this.nav.pop();
    } else {
      this.modal.dismiss().then(() => {
        this.reload();
      });
    }
  }

  async openMonthPicker() {
    const currentDate = this.calendarApi.getDate();
    this.monthPickerValue = DateTime.fromJSDate(currentDate).startOf('month').toISODate() ?? this.monthPickerValue;
    this.isMonthPickerOpen = true;
  }

  cancelMonthPicker() {
    this.isMonthPickerOpen = false;
  }

  onMonthPickerDismiss() {
    this.isMonthPickerOpen = false;
  }

  confirmMonthPicker() {
    // Obtener el valor seleccionado del ion-datetime
    const selectedValue = this.monthDatetime?.value;
    if (!selectedValue || !this.calendarApi) {
      this.isMonthPickerOpen = false;
      return;
    }

    // Convertir a fecha ISO
    const iso = selectedValue.length === 7 ? `${selectedValue}-01` : selectedValue;
    const dt = DateTime.fromISO(iso);
    if (!dt.isValid) {
      this.isMonthPickerOpen = false;
      return;
    }

    // Actualizar el valor del picker
    this.monthPickerValue = dt.startOf('month').toISODate() ?? this.monthPickerValue;

    // Ir al primer día del mes seleccionado
    this.calendarApi.gotoDate(dt.startOf('month').toJSDate());
    // Asegurar vista mensual
    this.calendarApi.changeView('dayGridMonth');

    // Actualizar visibilidad del botón
    setTimeout(() => {
      this.updateTodayButtonVisibility();
    }, 100);

    // Cerrar el modal
    this.isMonthPickerOpen = false;
  }

  goToToday() {
    if (this.calendarApi) {
      this.calendarApi.today();
      this.calendarApi.changeView('dayGridMonth');
      // Actualizar visibilidad del botón después de navegar
      setTimeout(() => {
        this.updateTodayButtonVisibility();
      }, 100);
    }
  }

  updateTodayButtonVisibility() {
    if (!this.calendarApi) return;

    const currentDate = this.calendarApi.getDate();
    const today = new Date();

    // Verificar si estamos en el mes actual
    const isCurrentMonth =
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();

    // Obtener el botón "Hoy" y mostrarlo/ocultarlo
    const todayButton = document.querySelector('.fc-todayButton-button') as HTMLElement;
    if (todayButton) {
      if(isCurrentMonth) {
        todayButton.setAttribute('disabled', 'true');
        todayButton.style.opacity = '0.5';
      } else {
        todayButton.removeAttribute('disabled');
        todayButton.style.opacity = '1';
      }
    }
  }

  async handleDateClick(arg: any) {
    if (this.checkIfBussinessDay(new Date(arg.dateStr))) {
      const dateObj = new Date(arg.dateStr);
      const dayStr = dateObj.toISOString().substring(0, 10);
      // Filtra entre todos los appointments cargados (de los tres meses)
      const events = this.appointments?.documents.filter((event: any) => event.start_time.startsWith(dayStr));
      const modal = await this.modalController.create({
        component: (await import('./components/calendar-day-events-modal/calendar-day-events-modal')).CalendarDayEventsModalComponent,
        initialBreakpoint: 0.5,
        breakpoints: [0, 0.25, 0.5, 0.75, 1],
        componentProps: {
          date: dateObj,
          events
        }
      });
      await modal.present();
      await modal.onDidDismiss();
      this.reload();
    }
  }

  async handleEventClick(info: any) {
    return this.handleDateClick({ dateStr: info.event.start.toString() });
    const modal = await this.modalController.create({
      component: CalendarEventInfoComponent,
      componentProps: {
        event: info.event
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data === 'delete') {
      const confirmAlert = await this.alertCtrl.create({
        header: 'Confirmar eliminación',
        message: '¿Estás seguro de que deseas eliminar esta cita?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            handler: async () => {
              try {
                await this.appointmentsPvd.deleteAppointment(info.event.extendedProps.id);
                await this.alertService.presentToast('Cita eliminada correctamente', 2500);
                this.reload();
              } catch (error) {
                await this.alertService.presentToast('Error al eliminar la cita', 2500);
              }
            }
          }
        ]
      });
      await confirmAlert.present();
    }
  }

  handleMoreLinkClick(arg: any) {
    arg.dateStr = arg.date.toString();
    this.handleDateClick(arg);
    return 'dayGridMonth';
  }


  checkIfBusinessHours(date: Date) {
    const time = date.toTimeString().split(' ')[0]; // Extract time in HH:MM:SS format
    return (
      this.schedules?.documents.some((schedule) => {
        const startTime = schedule.start_time;
        const endTime = schedule.end_time;
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        const currentTime = new Date(`1970-01-01T${time}`);
        return currentTime >= start && currentTime <= end;
      }) || false
    );
  }

  checkIfBussinessDay(date: Date) {
    return (
      this.schedules?.documents.some((schedule) => {
        return schedule.days.includes(date.getDay().toString());
      }) || false
    );
  }

  getDaysCurrentMonth() {
    let currentDate = new Date();
    let daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    let days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      if (this.checkIfBussinessDay(date)) {
        days.push({ date });
      }
    }

    days = days.map((day) => new Day(day.date));
    return days;
  }

  getSchedulesAndAppointments() {
    let days = this.getDaysCurrentMonth();

    days.forEach((day: Day) => {
      day.schedule =
        this.schedules?.documents.filter((schedule) => {
          return schedule.days.includes(day.date.getDay().toString());
        }) ?? [];
      day.appointments =
        this.appointments?.documents.filter((appointment) => {
          return appointment.start_time >= day.date.toISOString();
        }) ?? [];
    });

    return days;
  }

  async addAppointment() {
    const hours = await this.askForHours();
    if (hours === null) return; // User canceled the modal

    const days = this.getSchedulesAndAppointments();
    let done = false;

    let availableGapsCount = 0;

    outerLoop: for await (const day of days) {
      if (done) break;

      const availableGaps = day.getAvailableHourGapsByHoursAndSchedules(hours);
      let availableGapsIndex = 0;

      for await (const availableGap of availableGaps) {
        if (availableGap) {
          availableGapsCount++;
          const alertResult = await this.showAlert({
            date: DateTime.fromJSDate(day.date, { zone: 'system' }).toFormat(
              'dd-MM-yyyy'
            ),
            start: DateTime.fromJSDate(availableGap.start, {
              zone: 'system',
            }).toFormat('H:mm'),
            end: DateTime.fromJSDate(availableGap.end, {
              zone: 'system',
            }).toFormat('H:mm'),
          });

          switch (alertResult) {
            case 'accepted':
              // Agregar la cita
              done = true;

              this.openAppoinmentFormModal(
                day,
                availableGap.start,
                availableGap.end
              );

              break outerLoop;
            case 'next':
              // Ir al rango de horas siguiente
              availableGapsIndex++;
              break;
            case 'cancel':
              // Cancelar la cita
              done = false;
              break outerLoop;
            default:
              // Manejar valores inesperados
              break outerLoop;
          }
        }
      }
    }

    if(availableGapsCount === 0) {
      this.alertService.presentToast('No hay horas disponibles para este mes', 2500);
    }
  }

  private async askForHours(): Promise<number | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Horas necesarias',
        message: '¿Cuántas horas necesitas para la cita?',
        inputs: [
          {
            name: 'hours',
            type: 'number',
            placeholder: 'Introduce el número de horas',
            min: 1,
          },
        ],
        buttons: [
          {
            text: 'Aceptar',
            handler: (data) => {
              const hours = parseInt(data.hours, 10);
              if (!isNaN(hours) && hours > 0) {
                resolve(hours);
              } else {
                resolve(null); // Invalid input
              }
            },
          },
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              resolve(null); // User canceled
            },
          },
        ],
      });

      await alert.present();
    });
  }

  async openAppoinmentFormModal(day: Day, startTime: Date, endTime: Date) {
    const modal = await this.modalController.create({
      component: CalendarAppointmentModalComponent,
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.25, 0.5, 0.75],
      componentProps: {
        day,
        startTime: DateTime.fromJSDate(startTime, { zone: 'system' }).toISO(),
        endTime: DateTime.fromJSDate(endTime, { zone: 'system' }).toISO(),
      },
    });

    await modal.present();

    modal.onDidDismiss().then((data) => {
      if (data.data) {
        this.saveAppointment(data.data);
      }
    });
  }

  private async showAlert(availableRange: {
    date: string;
    start: string;
    end: string;
  }): Promise<string> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Cita disponible',
        message: `Cita disponible el día ${availableRange.date} desde ${availableRange.start} hasta ${availableRange.end}`,
        buttons: [
          {
            text: 'Aceptar',
            handler: () => {
              resolve('accepted'); // El usuario aceptó
            },
          },
          {
            text: 'Siguiente',
            handler: () => {
              resolve('next'); // El usuario aceptó
            },
          },
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              resolve('cancel'); // El usuario canceló
            },
          },
        ],
      });

      await alert.present();
    });
  }

  async saveAppointment(appointment: {
    note: string;
    start_time: string;
    end_time: string;
    client: string;
  }) {
    await this.appointmentsPvd.createAppointment(appointment);
    await this.alertService.presentToast('Cita creada', 2500);
    this.reload();
  }

  private subscribeToEvents() {
    this.eventsSubscription = this.events.getObservable().subscribe((event) => {
      if (event.name === 'add.event') {
        this.addAppointment();
      }
    });
  }
}
