import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonNav } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';
import { SchedulesProvider } from '../../../providers/schedules/schedules.provider';
import { AuthService } from '../../../services/auth.service';
import { Models } from 'appwrite';
import { AlertService } from '../../../services/alert.service';


@Component({
  selector: 'app-calendar-schedule-form',
  templateUrl: 'calendar-schedule-form.component.html',
  styleUrl: 'calendar-schedule-form.component.scss',
  imports: [SharedModule, ReactiveFormsModule],
})
export class CalendarScheduleFormComponent {

  @Input() nav!: IonNav;

  form: FormGroup;

  daysOfWeek = [
    { name: 'Lunes', value: "1" },
    { name: 'Martes', value: "2" },
    { name: 'Miércoles', value: "3" },
    { name: 'Jueves', value: "4" },
    { name: 'Viernes', value: "5" },
    { name: 'Sábado', value: "6" },
    { name: 'Domingo', value: "7" }
  ];

  protected selectedDays: Map<string, boolean> = new Map();

  private schedules: Models.DocumentList<Models.Document> | null = null;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {

    this.form = new FormGroup({
      startTime: new FormControl('2025-01-01T08:00:00', [Validators.required]),
      endTime: new FormControl('2025-01-01T13:00:00', [Validators.required]),
      days: new FormControl([], [Validators.required]),
    });

    for (const day of this.daysOfWeek) {
      this.selectedDays.set(day.value, true);
      this.form.controls['days'].value.push(day.value);
    }
      
  }

  async ngOnInit() {
    this.schedules = await this.schedulesPvd.listSchedules();
  }

  goBack() {
    this.nav.pop();
  }

  toggleDay(day: string) {
    //const days = this.form.controls['days'].value;
    this.selectedDays.set(day, !this.selectedDays.get(day));
    const selectedDaysArray = [...this.selectedDays].filter(([key, value]) => value).map(([key, value]) => key);
    this.form.controls['days'].setValue(selectedDaysArray);
  }

  async saveSchedule() {
    if (this.form.valid) {
      const days = this.form.controls['days'].value;
      const startTime = `${((new Date(this.form.controls['startTime'].value).getHours()).toString()).padStart(2, '0')}:${(new Date(this.form.controls['startTime'].value).getMinutes()).toString().padStart(2, '0')}`;
      const endTime = `${((new Date(this.form.controls['endTime'].value).getHours()).toString()).padStart(2, '0')}:${(new Date(this.form.controls['endTime'].value).getMinutes()).toString().padStart(2, '0')}`;
      const schedule = {
        days: days,
        start_time: startTime,
        end_time: endTime,
      };

      // Comprovar que no se solapan los horarios
      if(this.schedules){
        for (const s of this.schedules.documents) {
          if (s['days'].some((d: string) => days.includes(d))) { // Si hay algún día en común
            if ((startTime >= s['start_time'] && startTime <= s['end_time']) || (endTime >= s['start_time'] && endTime <= s['end_time'])) {
              await this.alertService.presentErrorToast('Horario solapado');
              return;
            }
          }
        }
      }

      // Guardar el horario
      await this.schedulesPvd.createSchedule(schedule);
      await this.alertService.presentToast('Horario creado', 2500);
      this.schedules = await this.schedulesPvd.listSchedules();
      this.nav.pop();
    } else {
      // Mostrar error
      await this.alertService.presentToast('Horario inválido', 2500);
    }
  }
}
