import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { ServicesService } from './services.service';
import { Service } from './service.model';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-service',
  imports: [ReactiveFormsModule],
  templateUrl: './service.html',
  styleUrl: './service.scss',
})
export class ServiceComponent {
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

  servicesService = inject(ServicesService);
  readonly services = this.servicesService.services;

  isServiceModalOpen = signal(false);
  editingService = signal<Service | null>(null);
  deleteModalOpen = signal(false);
  deletingService = signal<Service | null>(null);

  openAddService(): void {
    this.isServiceModalOpen.set(true);
    this.editingService.set(null);
    this.resetForm();
    this.lockBodyScroll();
  }

  openEditService(service: Service) {
    this.isServiceModalOpen.set(true);
    this.editingService.set(service);
    this.isSubmitted = false;
    this.serviceForm.setValue({
      serviceName: service.name,
      price: service.price,
    });

    this.serviceForm.markAsPristine();
    this.serviceForm.markAsUntouched();
    this.lockBodyScroll();
  }

  closeModal() {
    this.isServiceModalOpen.set(false);
    this.editingService.set(null);
    this.resetForm();
    this.unlockBodyScroll();
    (this.document.activeElement as HTMLElement | null)?.blur();
  }

  private formBuilder = inject(FormBuilder);
  serviceForm = this.formBuilder.group({
    serviceName: this.formBuilder.control('', {
      validators: [Validators.required, this.noWhitespaceValidator],
      nonNullable: true,
    }),
    price: this.formBuilder.control<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (typeof value !== 'string') return null;
    if (value.length === 0) return null;
    return value.trim().length === 0 ? { whitespace: true } : null;
  }

  resetForm() {
    this.serviceForm.reset({
      serviceName: '',
      price: null,
    });
    this.isSubmitted = false;
    this.serviceForm.markAsPristine();
    this.serviceForm.markAsUntouched();
  }
  readonly serviceNameCtrl = this.serviceForm.get('serviceName');
  readonly priceCtrl = this.serviceForm.get('price');

  isSubmitted = false;

  submitServiceForm() {
    this.isSubmitted = true;

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    const formInfo = this.serviceForm.value;
    const current = this.editingService();

    if (current === null) {
      this.servicesService.addServices(formInfo.serviceName!, formInfo.price!);
    } else {
      this.servicesService.updateService(
        current.id,
        formInfo.serviceName!,
        formInfo.price!
      );
    }
    this.closeModal();
  }

  openDeleteService(service: Service) {
    this.deleteModalOpen.set(true);
    this.deletingService.set(service);
    this.lockBodyScroll();
  }

  closeDeletegModal() {
    this.deleteModalOpen.set(false);
    this.editingService.set(null);
    this.unlockBodyScroll();
  }

  confirmDeleteService() {
    const service = this.deletingService();
    if (!service) return;
    this.servicesService.deleteService(service.id);
    this.deletingService.set(null);
    this.deleteModalOpen.set(false);
  }

  private readonly document = inject(DOCUMENT);
  private lockBodyScroll(): void {
    this.document.body.classList.add('no-scroll');
  }

  private unlockBodyScroll(): void {
    this.document.body.classList.remove('no-scroll');
  }
}
