import { Component, computed, inject, signal } from '@angular/core';
import { ClientsService } from './clients.service';
import { Client } from './client.model';
import { DOCUMENT } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AppointmentsService } from '../appointments/appointments.service';
import { ServicesService } from '../services/services.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-clients',
  imports: [ReactiveFormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
})
export class ClientsComponent {
  private destroy = new AbortController();

  ngOnInit() {
    window.addEventListener('keydown', this.onKeyDown, {
      signal: this.destroy.signal,
    });
  }

  ngOnDestroy() {
    this.destroy.abort();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.closeModal();
      this.closeDeletegModal();
      this.closeHistoryModal();
    }
  };

  private readonly document = inject(DOCUMENT);
  private lockBodyScroll(): void {
    this.document.body.classList.add('no-scroll');
  }

  private unlockBodyScroll(): void {
    this.document.body.classList.remove('no-scroll');
  }

  private formBuilder = inject(FormBuilder);
  clientForm = this.formBuilder.group({
    name: this.formBuilder.control('', {
      validators: [Validators.required, this.noWhitespaceValidator],
      nonNullable: true,
    }),
    instagram: this.formBuilder.control('', {
      validators: [Validators.required, this.noWhitespaceValidator],
      nonNullable: true,
    }),
  });

  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (typeof value !== 'string') return null;
    if (value.length === 0) return null;
    return value.trim().length === 0 ? { whitespace: true } : null;
  }

  readonly nameCtrl = this.clientForm.get('name');
  readonly instagramCtrl = this.clientForm.get('instagram')

  submitClientForm() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    const formInfo = this.clientForm.value;
    const current = this.editingClient();

    if (current === null) {
      this.clientsServices.addClient(formInfo.name!, formInfo.instagram!);
    } else {
      this.clientsServices.updateClient(
        current.id,
        formInfo.name!,
        formInfo.instagram!
      );
    }
    this.closeModal();
  }

  clientsServices = inject(ClientsService);
  appointmentsService = inject(AppointmentsService);
  servicesService = inject(ServicesService);

  clients = this.clientsServices.clients;
  appointments = this.appointmentsService.appointments;
  services = this.servicesService.services;

  modalWindowOpen = signal(false);
  editingClient = signal<Client | null>(null);

  deleteModalOpen = signal(false);
  deletingClient = signal<Client | null>(null);

  search = signal('');

  filteredClients = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.instagram.toLowerCase().includes(q) ?? false)
    );
  });

  openDeleteClient(e: MouseEvent, client: Client) {
    e.stopPropagation();
    this.deletingClient.set(client);
    this.deleteModalOpen.set(true);
    this.lockBodyScroll();
  }

  confirmDeleteClient() {
    const client = this.deletingClient();
    if (!client) return;

    this.clientsServices.deleteClient(client.id);
    this.deletingClient.set(null);
    this.deleteModalOpen.set(false);
  }

  closeDeletegModal() {
    this.deleteModalOpen.set(false);
    this.deletingClient.set(null);
    this.unlockBodyScroll();
  }

  openAddClient(): void {
    this.editingClient.set(null);
    this.modalWindowOpen.set(true);
    this.clientForm.reset();
    this.lockBodyScroll();
  }

  openEditClient(e: MouseEvent, client: Client) {
    e.stopPropagation();
    this.modalWindowOpen.set(true);
    this.editingClient.set(client);
    this.clientForm.setValue({
      name: client.name,
      instagram: client.instagram,
    });
    this.lockBodyScroll();
  }

  closeModal() {
    this.modalWindowOpen.set(false);
    this.editingClient.set(null);
    this.clientForm.reset();
    this.unlockBodyScroll();
    (this.document.activeElement as HTMLElement | null)?.blur();
  }

  isHistoryClientOpen = signal(false);
  historyClient = signal<Client | null>(null);

  openHistoryClientModal(client: Client) {
    this.isHistoryClientOpen.set(true);
    this.historyClient.set(client);
    this.lockBodyScroll();
  }

  closeHistoryModal() {
    this.historyClient.set(null);
    this.isHistoryClientOpen.set(false);
    this.unlockBodyScroll();
  }

  clientAppointments = computed(() => {
    const c = this.historyClient();
    if (!c) {
      return [];
    }

    return this.appointments().filter((a) => a.clientId === c?.id);
  });

  clientAppointmentsCount = computed(() => this.clientAppointments().length);

  getServiceName(id: number): string {
    const foundService = this.services().find((s) => s.id === id);
    if (foundService) {
      return foundService.name;
    } else {
      return 'Unknown';
    }
  }

  formatDate(date: string): string {
    return format(new Date(date), 'dd.MM.yyyy');
  }
}
