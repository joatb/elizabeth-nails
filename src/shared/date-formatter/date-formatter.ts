import { formatDate } from '@angular/common';

export function dateFormatter(params: any, hours: boolean = true): string {
  const value = params.value;
  if (value && !isNaN(Date.parse(value))) {
    return formatDate(value, `dd/MM/yyyy ${hours ? 'HH:MM' : ''}`, 'en-US');
  }
  return value;
}