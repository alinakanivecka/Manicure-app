import { Routes } from '@angular/router';
import { Today } from './features/today/today';
import { AppointmentsComponent } from './features/appointments/appointments';
import { ClientsComponent } from './features/clients/clients';
import { ServiceComponent } from './features/services/service';
import { StatisticsComponent } from './features/statistics/statistics';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  { path: 'today', component: Today },
  { path: 'appointments', component: AppointmentsComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'services', component: ServiceComponent },
  { path: 'statistics', component: StatisticsComponent},
  { path: '**', redirectTo: 'today' },
];
