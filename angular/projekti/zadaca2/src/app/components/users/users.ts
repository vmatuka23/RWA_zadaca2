import { Component, OnInit, signal, computed } from '@angular/core';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  imports: [],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users = signal<User[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.isLoading.set(true);
    this.userService.getUsers(page).subscribe({
      next: (response) => {
        this.users.set(response.korisnici);
        this.currentPage.set(page);
        this.totalPages.set(Math.ceil(response.ukupno / response.limitPoStranici));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading.set(false);
      }
    });
  }

  activateUser(id: number): void {
    this.userService.activateUser(id).subscribe({
      next: () => this.loadPage(this.currentPage()),
      error: (err) => console.error('Error activating user:', err)
    });
  }

  deactivateUser(id: number): void {
    this.userService.deactivateUser(id).subscribe({
      next: () => this.loadPage(this.currentPage()),
      error: (err) => console.error('Error deactivating user:', err)
    });
  }

  deleteUser(id: number): void {
    if (confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadPage(this.currentPage()),
        error: (err) => console.error('Error deleting user:', err)
      });
    }
  }
}
