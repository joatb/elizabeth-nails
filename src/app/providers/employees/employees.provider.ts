import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { Employee } from "./models/employee";

@Injectable({
  providedIn: "root",
})
export class EmployeesProvider {

  async listEmployees(): Promise<{ total: number; documents: Employee[] }> {
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('name');
    if (error) throw error;
    return { total: count ?? 0, documents: (data ?? []) as Employee[] };
  }

  async listActiveEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return (data ?? []) as Employee[];
  }

  async createEmployee(employee: { name: string; color: string; active: boolean }) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  }

  async updateEmployee(employeeId: string, employee: { name: string; color: string; active: boolean }) {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', employeeId)
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    if (error) throw error;
  }
}
