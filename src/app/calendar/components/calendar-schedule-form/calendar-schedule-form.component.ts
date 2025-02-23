import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { ToastController, IonNav } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';
import { SchedulesProvider } from '../../../providers/schedules.provider';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-calendar-schedule-form',
  templateUrl: 'calendar-schedule-form.component.html',
  imports: [SharedModule],
})
export class CalendarScheduleFormComponent {

  @Input() nav!: IonNav;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
      
  }

  goBack() {
    this.nav.pop();
  }
}
