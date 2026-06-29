import { Component, Input, ViewChild } from "@angular/core";
import { ModalController, ViewWillEnter } from "@ionic/angular/standalone";
import { SharedModule } from "../../../modules/shared.module";
import { MolScheduleTableComponent } from "../../molecules/mol-schedule-table/mol-schedule-table.component";
import { CalendarScheduleFormComponent } from "../schedule-form/calendar-schedule-form.component";
import { IonNav } from "@ionic/angular";
import { localeText } from "../../../../locale/ag-grid.locale";

@Component({
  selector: "app-calendar-schedule",
  standalone: true,
  template: `<mol-schedule-table
    [localeText]="localeText"
    (addSchedule)="onAdd()"
  ></mol-schedule-table>`,
  imports: [SharedModule, MolScheduleTableComponent],
})
export class CalendarScheduleComponent implements ViewWillEnter {
  @Input() nav?: IonNav;
  @ViewChild(MolScheduleTableComponent) scheduleTable!: MolScheduleTableComponent;

  localeText = localeText;

  constructor(private modalCtrl: ModalController) {}

  ionViewWillEnter(): void {
    this.scheduleTable?.loadSchedules();
  }

  onAdd(): void {
    if (this.nav && typeof this.nav.push === "function") {
      this.nav.push(CalendarScheduleFormComponent, { nav: this.nav });
      return;
    }
    void this.openScheduleFormModal();
  }

  private async openScheduleFormModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CalendarScheduleFormComponent,
    });
    await modal.present();
    await modal.onDidDismiss();
    this.scheduleTable?.loadSchedules();
  }
}
