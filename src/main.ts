import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import { addOutline, chevronUpCircle, ellipsisVertical, ellipsisVerticalOutline, eye, lockClosed, person } from 'ionicons/icons';


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});

addIcons({
  'calendar-time': 'assets/icon/calendar-time.svg',
  'user': 'assets/icon/user.svg'
});

addIcons({
  chevronUpCircle,
  addOutline,
  eye,
  lockClosed,
  person,
  ellipsisVertical
})