import { ChangeDetectorRef, Component, Input } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ModalController } from "@ionic/angular/standalone";
import { IonNav } from "@ionic/angular/standalone";
import { SharedModule } from "../../../modules/shared.module";
import { SchedulesProvider } from "../../../providers/schedules/schedules.provider";
import { AuthService } from "../../../services/auth.service";
import { Models } from "appwrite";
import { AlertService } from "../../../services/alert.service";
import { Schedule } from "../../../providers/schedules/models/schedule";

type ScheduleFormGroup = {
  startTime: FormControl<string>;
  endTime: FormControl<string>;
  days: FormControl<string[]>;
};

type DayOption = { name: string; value: string };

@Component({
  selector: "app-calendar-schedule-form",
  templateUrl: "./calendar-schedule-form.component.html",
  styleUrls: ["./calendar-schedule-form.component.scss"],
  imports: [SharedModule, ReactiveFormsModule],
})
export class CalendarScheduleFormComponent {
  @Input() nav!: IonNav;

  form: FormGroup<ScheduleFormGroup>;

  daysOfWeek: DayOption[] = [
    { name: "Lunes", value: "1" },
    { name: "Martes", value: "2" },
    { name: "Miércoles", value: "3" },
    { name: "Jueves", value: "4" },
    { name: "Viernes", value: "5" },
    { name: "Sábado", value: "6" },
    { name: "Domingo", value: "7" },
  ];

  protected selectedDays: Map<string, boolean> = new Map();

  private schedules: Models.DocumentList<Schedule> | null = null;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private modalCtrl: ModalController,
  ) {
    this.form = new FormGroup<ScheduleFormGroup>({
      startTime: new FormControl<string>("2025-01-01T08:00:00", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      endTime: new FormControl<string>("2025-01-01T13:00:00", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      days: new FormControl<string[]>([], {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });

    const daysControl = this.form.controls.days;
    for (const day of this.daysOfWeek) {
      this.selectedDays.set(day.value, true);
      daysControl.setValue([...daysControl.value, day.value]);
    }
  }

  async ngOnInit(): Promise<void> {
    this.schedules = await this.schedulesPvd.listSchedules();
  }

  goBack() {
    if (this.nav && typeof this.nav.pop === "function") {
      this.nav.pop();
      return;
    }
    void this.modalCtrl.dismiss();
  }

  toggleDay(day: string): void {
    const currentValue = this.selectedDays.get(day) ?? false;
    this.selectedDays.set(day, !currentValue);
    const selectedDaysArray = [...this.selectedDays]
      .filter(([_, value]) => value)
      .map(([key]) => key);
    this.form.controls.days.setValue(selectedDaysArray);
  }

  async saveSchedule(): Promise<void> {
    if (this.form.valid) {
      const days = this.form.controls.days.value;
      const startTimeValue = this.form.controls.startTime.value;
      const endTimeValue = this.form.controls.endTime.value;
      const startTime = `${new Date(startTimeValue)
        .getHours()
        .toString()
        .padStart(2, "0")}:${new Date(startTimeValue)
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const endTime = `${new Date(endTimeValue)
        .getHours()
        .toString()
        .padStart(2, "0")}:${new Date(endTimeValue)
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const schedule = {
        days: days,
        start_time: startTime,
        end_time: endTime,
      };

      // Comprovar que no se solapan los horarios
      if (this.schedules) {
        for (const s of this.schedules.documents) {
          if (s.days.some((d: string) => days.includes(d))) {
            // Si hay algún día en común
            if (
              (startTime >= s.start_time && startTime <= s.end_time) ||
              (endTime >= s.start_time && endTime <= s.end_time)
            ) {
              await this.alertService.presentErrorToast("Horario solapado");
              return;
            }
          }
        }
      }

      // Guardar el horario
      await this.schedulesPvd.createSchedule(schedule);
      await this.alertService.presentToast("Horario creado", 2500);
      this.schedules = await this.schedulesPvd.listSchedules();
      if (this.nav && typeof this.nav.pop === "function") {
        this.nav.pop();
      } else {
        await this.modalCtrl.dismiss();
      }
    } else {
      // Mostrar error
      await this.alertService.presentToast("Horario inválido", 2500);
    }
  }
}
