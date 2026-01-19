import { Component, computed, inject, signal } from '@angular/core';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';

@Component({
  selector: 'app-today',
  imports: [],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today {
  appointmetsService = inject(AppointmentsService);
  clientsService = inject(ClientsService);
  servicesService = inject(ServicesService);

  readonly todayIso = this.todayIsoLocal();
  private todayIsoLocal(): string {
    return this.toIsoLocalDate(new Date());
  }
  private toIsoLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  clients = this.clientsService.clients;
  services = this.servicesService.services;
  appointments = this.appointmetsService.appointments;
  todayAppointments = computed(() =>
    this.appointments().filter((a) => a.date === this.todayIso)
  );

  getClientName(id: number): string {
    const foundClient = this.clients().find((c) => c.id === id);
    if (foundClient) {
      return foundClient.name;
    } else {
      return 'Unknown';
    }
  }

  getServiceName(id: number): string {
    const foundService = this.services().find((s) => s.id === id);
    if (foundService) {
      return foundService.name;
    } else {
      return 'Unknown';
    }
  }
}
