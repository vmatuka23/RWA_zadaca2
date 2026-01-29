import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection';
import { MultimediaService } from '../../services/multimedia';
import { TmdbService } from '../../services/tmdb';
import { Config } from '../../services/config';
import { Collection } from '../../models/collection.model';
import { TMDBMovie } from '../../models/tmdb.model';

@Component({
  selector: 'app-multimedia',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './multimedia.html',
  styleUrl: './multimedia.css'
})
export class Multimedia implements OnInit {
  collections = signal<Collection[]>([]);
  searchResults = signal<TMDBMovie[]>([]);
  selectedFile = signal<File | null>(null);
  isSearching = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  uploadError = signal<string>('');
  
  searchQuery: string = '';
  selectedCollectionId: string = '';
  uploadForm: FormGroup;
  
  private readonly MAX_FILE_SIZE = 1048576; // 1MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

  constructor(
    private collectionService: CollectionService,
    private multimediaService: MultimediaService,
    private tmdbService: TmdbService,
    private config: Config,
    private fb: FormBuilder
  ) {
    this.uploadForm = this.fb.group({
      naziv: ['', Validators.required],
      kolekcijaId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCollections();
  }

  loadCollections(): void {
    this.collectionService.getCollections(1, true).subscribe({
      next: (response) => {
        this.collections.set(response.kolekcije);
      },
      error: (err) => console.error('Error loading collections:', err)
    });
  }

  searchTMDB(): void {
    if (!this.searchQuery.trim()) {
      alert('Unesite pojam za pretragu.');
      return;
    }

    this.isSearching.set(true);
    this.tmdbService.searchMovies(this.searchQuery).subscribe({
      next: (response) => {
        this.searchResults.set(response.results || []);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Error searching TMDB:', err);
        this.isSearching.set(false);
      }
    });
  }

  getTMDBImageUrl(path: string, size: string = 'w500'): string {
    return this.tmdbService.getImageUrl(path, size);
  }

  addToCollection(posterPath: string, title: string): void {
    if (!this.selectedCollectionId) {
      alert('Molimo odaberite kolekciju.');
      return;
    }

    const imageUrl = this.getTMDBImageUrl(posterPath, 'original');
    
    this.multimediaService.createFromUrl({
      naziv: title,
      tip: 'slika',
      putanja: imageUrl,
      kolekcijaId: parseInt(this.selectedCollectionId),
      javno: true
    }).subscribe({
      next: () => {
        alert('Sadržaj je dodan u kolekciju.');
      },
      error: (err) => {
        console.error('Error adding to collection:', err);
        alert('Greška pri dodavanju u kolekciju.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      this.uploadError.set('');
      
      if (file.size > this.MAX_FILE_SIZE) {
        this.uploadError.set('Datoteka je prevelika. Maksimalna veličina je 1MB.');
        this.selectedFile.set(null);
        return;
      }
      
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.uploadError.set('Nepodržani format datoteke.');
        this.selectedFile.set(null);
        return;
      }
      
      this.selectedFile.set(file);
    }
  }

  uploadFile(): void {
    if (this.uploadForm.invalid || !this.selectedFile()) return;

    this.isUploading.set(true);
    
    const formData = new FormData();
    formData.append('datoteka', this.selectedFile()!);
    formData.append('naziv', this.uploadForm.get('naziv')?.value);
    formData.append('kolekcijaId', this.uploadForm.get('kolekcijaId')?.value);

    this.multimediaService.uploadFile(formData).subscribe({
      next: () => {
        this.isUploading.set(false);
        alert('Datoteka je uspješno uploadana.');
        this.uploadForm.reset();
        this.selectedFile.set(null);
        const fileInput = document.getElementById('ucitavanjeDatoteke') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error uploading file:', err);
        alert('Greška pri uploadu datoteke.');
      }
    });
  }
}
