import { DateTime } from "luxon";
import { Appointment } from "../providers/appointments/models/appointment";
import { Schedule } from "../providers/schedules/models/schedule";

export class Day {
    date: Date;
    schedule: Schedule[]; // Cambia `any` por el tipo adecuado si tienes un modelo para los horarios
    appointments: Appointment[]; // Cambia `any` por el tipo adecuado si tienes un modelo para las citas
  
    constructor(date: Date, schedule: Schedule[] = [], appointments: Appointment[] = []) {
      this.date = date;
      this.schedule = schedule;
      this.appointments = appointments;
    }
  
    isBusinessDay(): boolean {
      return this.schedule.length > 0;
    }
  
    hasAppointments(): boolean {
      return this.appointments.length > 0;
    }

    getAvailableHourGapsByHoursAndSchedules(hours: number): Array<{ start: Date; end: Date }> {
        
        const availableGaps = [];
        
        if(this.isPast()) {
            return []; // No available slots in the past
        }

        const requiredMilliseconds = hours * 60 * 60 * 1000;

        // Sort schedules and appointments by start time
        const sortedSchedule = this.schedule.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        const sortedAppointments = this.appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        for (const schedule of sortedSchedule) {
        // Combinar la fecha de `this.date` con la hora de `schedule.start_time` y `schedule.end_time`
        let scheduleStartTime = DateTime.fromFormat(schedule.start_time, 'H:mm', { zone: 'system' })
            .set({
                year: this.date.getFullYear(),
                month: this.date.getMonth() + 1, // Los meses en Luxon son 1-indexados
                day: this.date.getDate()
            })
            .toJSDate();

        let scheduleEndTime = DateTime.fromFormat(schedule.end_time, 'H:mm', { zone: 'system' })
            .set({
                year: this.date.getFullYear(),
                month: this.date.getMonth() + 1,
                day: this.date.getDate()
            })
            .toJSDate();

            // Get all timespans in the schedule
            const scheduleTimeSpans = [];
            let currentTime = new Date(scheduleStartTime);
            while (currentTime < scheduleEndTime) {
                // Check if the current time is in the past
                if(this.isToday()) {
                    const now = new Date();
                    if (currentTime < now) {
                        currentTime = new Date(now.getTime() + requiredMilliseconds);
                        continue;
                    }
                }
                const nextTime = new Date(currentTime.getTime() + requiredMilliseconds);
                if (nextTime <= scheduleEndTime) {
                    scheduleTimeSpans.push({ start: currentTime, end: nextTime });
                }
                currentTime = nextTime;
            }
            // Check for gaps in the schedule
            for (const timeSpan of scheduleTimeSpans) {
                const timeSpanStartTime = DateTime.fromJSDate(timeSpan.start).toFormat('H:mm');
                const timeSpanEndTime = DateTime.fromJSDate(timeSpan.end).toFormat('H:mm');
                const hasAppointment = sortedAppointments.some(appointment => {
                    const appointmentStartTime = DateTime.fromJSDate(new Date(appointment.start_time)).toFormat('H:mm');
                    const appointmentEndTime = DateTime.fromJSDate(new Date(appointment.end_time)).toFormat('H:mm');
                    return (DateTime.fromFormat(appointmentStartTime, "H:mm") < DateTime.fromFormat(timeSpanEndTime, "H:mm") && DateTime.fromFormat(appointmentEndTime, "H:mm") > DateTime.fromFormat(timeSpanStartTime, "H:mm"));
                });
                if (!hasAppointment) {
                    // Found a gap in the schedule
                    availableGaps.push({ start: timeSpan.start, end: timeSpan.end });
                }
            }
        }

        return availableGaps; // No available slot found
    }
    isToday(): boolean {
        const today = new Date();
        return this.date.getDate() === today.getDate() &&
               this.date.getMonth() === today.getMonth() &&
               this.date.getFullYear() === today.getFullYear();
    }

    isPast(): boolean {
        const today = new Date();
        return this.date < today;
    }
}