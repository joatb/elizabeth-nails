import { Component, EnvironmentInjector, inject } from '@angular/core';
import { SegmentComponent } from '../../core/segment/segment.component';
import { SharedModule } from '../modules/shared.module';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [SharedModule, SegmentComponent],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
  }
}
