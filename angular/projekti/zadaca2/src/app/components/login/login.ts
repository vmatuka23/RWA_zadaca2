import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Authentication } from '../../services/authentication';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  prikaziPonovnoSlanje = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: Authentication,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      korisnickoIme: ['', Validators.required],
      lozinka: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.prikaziPonovnoSlanje.set(false);
    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const greska = err.error?.greska || 'Greška pri prijavi. Pokušajte ponovno.';
        this.errorMessage.set(greska);
        
        // Ako je račun neaktiviran, prikaži opciju za ponovno slanje
        if (err.error?.kod === 'NEAKTIVIRAN') {
          this.prikaziPonovnoSlanje.set(true);
        }
      }
    });
  }

  // Ponovno slanje aktivacijskog emaila
  ponovoPosaljiAktivaciju(): void {
    const email = prompt('Unesite email adresu za koju želite ponovno poslati aktivacijski link:');
    
    if (!email) {
      return;
    }

    this.isLoading.set(true);
    this.http.post<any>('/api/ponovo-posalji-aktivaciju', { email }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.poruka);
        this.prikaziPonovnoSlanje.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.greska || 'Greška pri slanju aktivacijskog emaila.');
      }
    });
  }
}
