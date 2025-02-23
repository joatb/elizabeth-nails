import { formatDate } from '@angular/common';

export function dateFormatter(params: any, hours: boolean = true): string {
  const value = params.value;
  if (value && !isNaN(Date.parse(value))) {
    return formatDate(value, `dd/MM/yyyy ${hours ? 'HH:mm' : ''}`, 'en-US');
  }
  return value;
}

export function getDayString(day: number): string {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return days[day - 1];
}