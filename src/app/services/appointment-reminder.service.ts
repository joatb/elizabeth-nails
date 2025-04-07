import { Injectable } from '@angular/core';
import { WhatsAppService } from './whatsapp.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentReminderService {
  constructor(private whatsAppService: WhatsAppService) {}

  async scheduleReminder(appointment: any) {
    const reminderDate = new Date(appointment.date);
    reminderDate.setDate(reminderDate.getDate() - 1); // Un día antes

    const now = new Date();
    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      await new Promise(resolve => setTimeout(resolve, timeUntilReminder));
      await this.whatsAppService.sendAppointmentReminder(
        appointment.phoneNumber,
        appointment
      ).toPromise();
    }
  }
} 