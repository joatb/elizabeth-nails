import {
  Component,
  EnvironmentInjector,
  inject,
  OnDestroy,
} from "@angular/core";
import { SegmentComponent } from "../../../core/segment/segment.component";
import { SharedModule } from "../../modules/shared.module";
import { EventService } from "../../services/event.service";
import { TabBarVisibilityService } from "../../services/tab-bar-visibility.service";
import { ConfigModalComponent } from "../../components/modals/config-modal/config-modal.component";
import { CalendarScheduleModalComponent } from "../../ui/organisms/calendar-schedule-modal/calendar-schedule-modal.component";
@Component({
  selector: "app-tabs",
  templateUrl: "tabs.page.html",
  styleUrls: ["tabs.page.scss"],
  imports: [SharedModule, SegmentComponent, ConfigModalComponent, CalendarScheduleModalComponent],
})
export class TabsPage implements OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(
    private events: EventService,
    public tabBarVisibility: TabBarVisibilityService,
  ) {}

  ngOnDestroy(): void {
    this.events.destroy();
  }
}
