import { Routes } from '@angular/router';
import { DokumentacijaComponent } from './dokumentacija/dokumentacija.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dokumentacija', pathMatch: 'full' },
  { path: 'dokumentacija', component: DokumentacijaComponent },
  { path: 'documentation', component: DokumentacijaComponent }
];
