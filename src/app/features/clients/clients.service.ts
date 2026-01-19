import { effect, inject, Injectable, signal } from '@angular/core';
import { Client } from './client.model';
import { LocalStorageKeys, StorageService } from '../../storage.service';

  @Injectable({ providedIn: 'root' })
export class ClientsService {
  private storage = inject(StorageService);

  constructor() {
    const saved = this.storage.load<Client[]>(LocalStorageKeys.Clients);
    if (saved) this.clients.set(saved);

    effect(() => {
      this.storage.save(LocalStorageKeys.Clients, this.clients());
    });
  }

  clients = signal<Client[]>([
    {
      id: 1,
      name: 'Alina',
      instagram: '@alina_k',
    },
    {
      id: 2,
      name: 'Marina',
      instagram: '@marina_p',
    },
    {
      id: 3,
      name: 'Darina',
      instagram: '@darina_o',
    },
  ]);

  addClient(name: string, instagram: string) {
    const newClient: Client = {
      id: Date.now(),
      name: name,
      instagram: instagram,
    };

    this.clients.update((c) => [...c, newClient]);
  }

  updateClient(id: number, name: string, instagram: string) {
    this.clients.update((clients) =>
      clients.map((client) => {
        if (client.id === id) {
          return {
            ...client,
            name: name,
            instagram: instagram,
          };
        }
        return client;
      })
    );
  }

  deleteClient(id: number) {
    this.clients.update((clients) =>
      clients.filter((client) => client.id !== id)
    );
  }
}
