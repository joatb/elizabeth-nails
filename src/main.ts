import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, addOutline, chevronUpCircle, ellipsisVertical, eye, eyeOutline, eyeOffOutline, lockClosed, logOutOutline, person, saveOutline, trashOutline } from 'ionicons/icons';
import { Settings } from 'luxon';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { GlobalErrorHandler } from './core/global-error-handler/global-error-handler.service';


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
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
  eyeOutline,
  eyeOffOutline,
  lockClosed,
  person,
  ellipsisVertical,
  trashOutline,
  logOutOutline,
  saveOutline,
})

Settings.defaultZone = 'UTC'; // or any other time zone, e.g., 'America/New_York'
Settings.defaultLocale = 'es-ES'; // or any other locale, e.g., 'en-US'