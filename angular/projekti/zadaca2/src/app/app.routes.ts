import { Routes } from '@angular/router';
import { DokumentacijaComponent } from './dokumentacija/dokumentacija.component';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Home } from './components/home/home';
import { Collections } from './components/collections/collections';
import { Multimedia } from './components/multimedia/multimedia';
import { Users } from './components/users/users';
import { Moderator } from './components/moderator/moderator';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'collections', component: Collections, canActivate: [authGuard] },
  { path: 'multimedia', component: Multimedia, canActivate: [authGuard] },
  { path: 'users', component: Users, canActivate: [roleGuard(['admin'])] },
  { path: 'moderator', component: Moderator, canActivate: [roleGuard(['moderator', 'admin'])] },
  { path: 'dokumentacija', component: DokumentacijaComponent },
  { path: 'documentation', component: DokumentacijaComponent },
  { path: '**', redirectTo: '' }
];
