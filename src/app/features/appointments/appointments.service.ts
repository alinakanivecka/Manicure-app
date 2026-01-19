import { effect, inject, Injectable, signal } from '@angular/core';
import { Appointment } from './appointments.model';
import { LocalStorageKeys, StorageService } from '../../storage.service';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private storage = inject(StorageService);

  constructor() {
    const saved = this.storage.load<Appointment[]>(LocalStorageKeys.Appointments);
    if (saved) this.appointments.set(saved);

    effect(() => {
      this.storage.save(LocalStorageKeys.Appointments, this.appointments());
    });
  }

  appointments = signal<Appointment[]>([
    {
      id: 1,
      clientId: 1,
      serviceId: 1,
      date: '2025-12-13',
      time: '9:30',
      price: 10000,
    },
    {
      id: 2,
      clientId: 2,
      serviceId: 2,
      date: '2025-11-28',
      time: '12:00',
      price: 10000,
    },
    {
      id: 3,
      clientId: 3,
      serviceId: 3,
      date: '28-11-2025',
      time: '15:00',
      price: 10000,
    },
  ]);

  addAppointment(
    clientId: number,
    serviceId: number,
    date: string,
    time: string,
    price: number
  ) {
    const newAppointment: Appointment = {
      id: Date.now(),
      clientId,
      serviceId,
      date,
      time,
      price,
    };
    this.appointments.update((a) => [...a, newAppointment]);
  }

  updateAppointment(
    id: number,
    clientId: number,
    serviceId: number,
    date: string,
    time: string,
    price: number
  ) {
    this.appointments.update((apointments) =>
      apointments.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            clientId,
            serviceId,
            date,
            time,
            price,
          };
        }
        return a;
      })
    );
  }

  deleteAppointment(id: number) {
    this.appointments.update((appointments) =>
      appointments.filter((a) => a.id !== id)
    );
  }
}
