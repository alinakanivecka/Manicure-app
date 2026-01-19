import { effect, inject, Injectable, signal } from '@angular/core';
import { Service } from './service.model';
import { LocalStorageKeys, StorageService } from '../../storage.service';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private storage = inject(StorageService);

  constructor() {
    const saved = this.storage.load<Service[]>(LocalStorageKeys.Services);
    if (saved) this.services.set(saved);

    effect(() => {
      this.storage.save(LocalStorageKeys.Services, this.services());
    });
  }

  services = signal<Service[]>([
    {
      id: 1,
      name: 'Manicure with strengthening',
      price: 10000,
    },
    {
      id: 2,
      name: 'Manicure without strengthening',
      price: 9000,
    },
    {
      id: 3,
      name: 'Manicure without coating',
      price: 5500,
    },
  ]);

  addServices(name: string, price: number) {
    const newServices: Service = {
      id: Date.now(),
      name: name,
      price: price,
    };

    this.services.update((s) => [...s, newServices]);
  }

  updateService(id: number, name: string, price: number) {
    this.services.update((services) =>
      services.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            name: name,
            price: price,
          };
        }
        return s;
      })
    );
  }

  deleteService(id: number) {
    this.services.update((services) => services.filter((s) => s.id !== id));
  }
}
