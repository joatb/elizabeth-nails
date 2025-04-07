import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiUrl = 'https://graph.facebook.com/v22.0/';
  private phoneNumberId = environment.whatsappPhoneNumberId;
  private accessToken = environment.whatsappAccessToken;

  constructor(private http: HttpClient) {}

  sendMessage(to: string, message: string) {
    const url = `${this.apiUrl}${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: message }
    };

    return this.http.post(url, body, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
  }

  sendAppointmentReminder(to: string, appointment: any) {
    const message = `Recordatorio: Tienes una cita mañana a las ${appointment.time} para ${appointment.service}. ¿Confirmas tu asistencia?`;
    return this.sendMessage(to, message);
  }
} 