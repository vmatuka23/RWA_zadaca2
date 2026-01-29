import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Authentication } from '../../services/authentication';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css'
})
export class Navigation {
  constructor(
    private authService: Authentication,
    private router: Router
  ) {}

  get currentUser() {
    return this.authService.currentUser;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Logout error:', err);
      }
    });
  }
}
