import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users = signal<User[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    console.log('Users component initialized, loading users...');
    this.loadPage(1);
  }

  loadPage(page: number): void {
    console.log('Loading page:', page);
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.userService.getUsers(page).subscribe({
      next: (response: any) => {
        console.log('Users loaded successfully:', response);
        // Handle both array response and object response formats
        const korisnici = Array.isArray(response) ? response : response.korisnici;
        const ukupno = Array.isArray(response) ? response.length : response.ukupno;
        const limit = Array.isArray(response) ? response.length : response.limitPoStranici;
        
        this.users.set(korisnici || []);
        this.currentPage.set(page);
        this.totalPages.set(Math.ceil(ukupno / (limit || 1)));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.errorMessage.set(err.error?.greska || err.message || 'Greška pri učitavanju korisnika');
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

  changeRole(id: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const novaUloga = select.value;
    this.userService.changeRole(id, novaUloga).subscribe({
      next: () => this.loadPage(this.currentPage()),
      error: (err) => {
        console.error('Error changing role:', err);
        this.loadPage(this.currentPage()); // Reload to reset dropdown
      }
    });
  }

  toggleBlokiran(user: User): void {
    if (user.aktiviran) {
      this.deactivateUser(user.id);
    } else {
      this.activateUser(user.id);
    }
  }
}
