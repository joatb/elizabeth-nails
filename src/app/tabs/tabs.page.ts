import { Component, EnvironmentInjector, inject, OnDestroy } from '@angular/core';
import { SegmentComponent } from '../../core/segment/segment.component';
import { SharedModule } from '../modules/shared.module';
import { EventService } from '../services/event.service';
import { CacheDebugComponent } from '../components/cache-debug/cache-debug.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [SharedModule, SegmentComponent, CacheDebugComponent],
})
export class TabsPage implements OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  public environment = environment;

  constructor(private events: EventService) {

  }

  ngOnDestroy(): void {
    this.events.destroy();
  }
}
