import { Injectable, signal } from '@angular/core';

export enum LocalStorageKeys {
  Appointments = 'appointments',
  Clients = 'clients',
  Services = 'services',
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  save<T>(key: LocalStorageKeys, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  load<T>(key: LocalStorageKeys): T | null {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }
}
