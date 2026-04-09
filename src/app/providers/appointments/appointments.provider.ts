import { Injectable } from "@angular/core";
import { Query } from "appwrite";
import { DBService } from "../../services/db.service";
import { Appointment } from "./models/appointment";

@Injectable({
    providedIn: 'root',
})
export class AppointmentsProvider {
    private readonly DATABASE_ID = 'core';
    private readonly TABLE_ID = 'appointments'; // Table ID (migrat de collection a table)

    constructor(
        private dbService: DBService
    ) { }

    listAppointments(month: number, year: number) {
        // Asegurarse de que el mes tenga dos dígitos
        const monthStr = month.toString().padStart(2, '0');

        // Calcular el último día del mes
        const lastDay = new Date(year, month, 0).getDate();
        const lastDayStr = lastDay.toString().padStart(2, '0');

        // Crear fechas en formato ISO 8601
        const startDate = `${year}-${monthStr}-01T00:00:00.000Z`;
        const endDate = `${year}-${monthStr}-${lastDayStr}T23:59:59.999Z`;

        return this.dbService.listDocuments<Appointment>(this.DATABASE_ID, this.TABLE_ID, [
            Query.and([
                Query.greaterThanEqual('start_time', startDate),
                Query.lessThanEqual('end_time', endDate),
            ]),
            Query.select(['*', 'client.*']),
            Query.limit(2500),
            Query.orderAsc('start_time')
        ]);
    }

    /**
     * Obtiene las citas entre dos fechas (incluyendo ambas).
     * @param startDate Fecha de inicio (Date)
     * @param endDate Fecha de fin (Date)
     */
    listAppointmentsInRange(startDate: Date, endDate: Date) {
        // Convertir fechas a ISO 8601 string
        const startIso = startDate.toISOString();
        // Para incluir todo el día final, poner hora máxima
        const endIso = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).toISOString();
        return this.dbService.listDocuments<Appointment>(this.DATABASE_ID, this.TABLE_ID, [
            Query.and([
                Query.greaterThanEqual('start_time', startIso),
                Query.lessThanEqual('end_time', endIso),
            ]),
            Query.select(['*', 'client.*']),
            Query.limit(2500),
            Query.orderAsc('start_time')
        ]);
    }

    createAppointment(appointment: any) {
        return this.dbService.createDocument(this.DATABASE_ID, this.TABLE_ID, appointment);
    }

    listAllAppointments() {
        return this.dbService.listDocuments<Appointment>(this.DATABASE_ID, this.TABLE_ID, [
            Query.select(['*', 'client.*']),
            Query.limit(2500),
            Query.orderDesc('start_time')
        ]);
    }

    updateAppointment(appointmentId: string, data: any) {
        return this.dbService.updateDocument(this.DATABASE_ID, this.TABLE_ID, appointmentId, data);
    }

    deleteAppointment(appointmentId: string) {
        return this.dbService.deleteDocument(this.DATABASE_ID, this.TABLE_ID, appointmentId);
    }
}
