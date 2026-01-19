import {
  afterNextRender,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointments.model';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { DayInfo } from './dayInfo.model';
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';
import { enUS } from 'date-fns/locale';

@Component({
  selector: 'app-appointments',
  imports: [ReactiveFormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class AppointmentsComponent {
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
    }
  };

  private readonly document = inject(DOCUMENT);
  private lockBodyScroll(): void {
    this.document.body.classList.add('no-scroll');
  }

  private unlockBodyScroll(): void {
    this.document.body.classList.remove('no-scroll');
  }

  appointmentsService = inject(AppointmentsService);
  clientsService = inject(ClientsService);
  servicesService = inject(ServicesService);

  appointments = this.appointmentsService.appointments;
  appointmentsForSelectedDate = computed(() =>
    this.appointments().filter((a) => a.date === this.selectedDate())
  );

  priceForADay = computed(() =>
    this.appointmentsForSelectedDate().reduce((sum, a) => sum + a.price, 0)
  );

  clients = this.clientsService.clients;
  services = this.servicesService.services;

  isModalWindowOpen = signal(false);
  editingAppointment = signal<Appointment | null>(null);

  deleteModalOpen = signal(false);
  deletingAppointment = signal<Appointment | null>(null);

  readonly todayIso = this.todayIsoLocal();
  selectedDate = signal<string>(this.todayIso);
  datesStripRef = viewChild<ElementRef<HTMLElement>>('datesStrip');
  private didInitialScroll = false;

  daysInSelectedMonth = computed(() => {
    const baseDate = new Date(this.selectedDate());

    const days = eachDayOfInterval({
      start: startOfMonth(baseDate),
      end: endOfMonth(baseDate),
    });

    return days.map((date) => ({
      iso: format(date, 'yyyy-MM-dd'),
      dayNumber: date.getDate(),
      weekdayShort: format(date, 'EEE', { locale: enUS }),
      label: format(date, 'dd.MM'),
    }));
  });

  constructor() {
    effect(() => {
      this.daysInSelectedMonth();

      if (this.didInitialScroll) return;
      this.didInitialScroll = true;

      queueMicrotask(() => {
        this.scrollToIsoStart(this.todayIso);
      });
    });
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
  }

  private scrollToIsoStart(iso: string): void {
    const strip = this.datesStripRef()?.nativeElement;
    if (!strip) return;

    const el = strip.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
    if (!el) return;

    strip.scrollTo({
      left: el.offsetLeft - strip.offsetLeft,
      behavior: 'smooth',
    });
  }

  private todayIsoLocal(): string {
    return this.toIsoLocalDate(new Date());
  }

  private toIsoLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  scrollDates(direction: -1 | 1): void {
    const strip = this.datesStripRef()?.nativeElement;
    if (!strip) return;

    const amount = 260;
    strip.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  private formBuilder = inject(FormBuilder);
  appointmentForm = this.formBuilder.group({
    clientId: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required],
    }),
    serviceId: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required],
    }),
    date: ['', Validators.required],
    time: ['', Validators.required],
    price: this.formBuilder.control<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

 

  readonly clientCtrl = this.appointmentForm.get('clientId');
  readonly serviceCtrl = this.appointmentForm.get('serviceId');
  readonly dateCtrl = this.appointmentForm.get('date');
  readonly timeCtrl = this.appointmentForm.get('time');
  readonly priceCtrl = this.appointmentForm.get('price');

  submitAppointmentForm() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    const value = this.appointmentForm.getRawValue();
    const current = this.editingAppointment();

    if (!current) {
      this.appointmentsService.addAppointment(
        value.clientId!,
        value.serviceId!,
        value.date!,
        value.time!,
        value.price!
      );
    } else {
      this.appointmentsService.updateAppointment(
        current.id,
        value.clientId!,
        value.serviceId!,
        value.date!,
        value.time!,
        value.price!
      );
    }
    this.closeModal();
  }

  openAddAppointment() {
    this.editingAppointment.set(null);
    this.isModalWindowOpen.set(true);
    this.appointmentForm.reset();
    this.lockBodyScroll();
  }

  openEditAppointment(appointment: Appointment) {
    this.isModalWindowOpen.set(true);
    this.editingAppointment.set(appointment);
    this.appointmentForm.setValue({
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
    });
    this.lockBodyScroll();
  }

  closeModal() {
    this.isModalWindowOpen.set(false);
    this.editingAppointment.set(null);
    this.unlockBodyScroll();
    (this.document.activeElement as HTMLElement | null)?.blur();
  }

  openDeleteModalAppointment() {
    const current = this.editingAppointment();
    this.deletingAppointment.set(current);
    this.deleteModalOpen.set(true);
    this.isModalWindowOpen.set(false);
  }

  confirmDeleteAppointment() {
    const appointment = this.deletingAppointment();
    if (!appointment) return;

    this.appointmentsService.deleteAppointment(appointment.id);
    this.deletingAppointment.set(null);
    this.deleteModalOpen.set(false);
  }

  closeDeletegModal() {
    this.deleteModalOpen.set(false);
    this.deletingAppointment.set(null);
  }

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
