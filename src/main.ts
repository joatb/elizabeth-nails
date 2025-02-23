import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { ErrorHandler } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, addOutline, chevronUpCircle, ellipsisVertical, eye, lockClosed, logOutOutline, person, trashOutline } from 'ionicons/icons';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { GlobalErrorHandler } from './core/global-error-handler/global-error-handler.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
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
  add,
  eye,
  lockClosed,
  person,
  ellipsisVertical,
  trashOutline,
  logOutOutline
})