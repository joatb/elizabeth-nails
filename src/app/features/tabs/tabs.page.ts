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
@Component({
  selector: "app-tabs",
  templateUrl: "tabs.page.html",
  styleUrls: ["tabs.page.scss"],
  imports: [SharedModule, SegmentComponent],
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
