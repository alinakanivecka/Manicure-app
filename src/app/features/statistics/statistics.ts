import { Component, computed, inject, signal } from '@angular/core';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { addMonths, format } from 'date-fns';

@Component({
  selector: 'app-statistics',
  imports: [],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class StatisticsComponent {
  appointmentsService = inject(AppointmentsService);
  clientsService = inject(ClientsService);
  appointments = this.appointmentsService.appointments;
  clients = this.clientsService.clients;

  selectedMonth = signal(new Date());

  monthTitle = computed(() => format(this.selectedMonth(), 'MMMM'));

  prevMonth() {
    this.selectedMonth.set(addMonths(this.selectedMonth(), -1));
  }
  nextMonth() {
    this.selectedMonth.set(addMonths(this.selectedMonth(), +1));
  }

  appointmentsForMonth = computed(() => {
    const month = this.selectedMonth();
    const monthYear = month.getFullYear();
    const monthIndex = month.getMonth();

    return this.appointments().filter((a) => {
      const [y, m, d] = a.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      return date.getFullYear() === monthYear && date.getMonth() === monthIndex;
    });
  });

  monthsRevenue = computed(() =>
    this.appointmentsForMonth().reduce((sum, a) => sum + a.price, 0)
  );
  appointmentsAmount = computed(() => this.appointmentsForMonth().length);
  monthlyClients = computed(() => {
    const ids = this.appointmentsForMonth().map((a) => a.clientId);
    return new Set(ids).size;
  });
  workDaysAmount = computed(() => {
    const days = this.appointmentsForMonth().map((a) => a.date);
    return new Set(days).size;
  });
}
