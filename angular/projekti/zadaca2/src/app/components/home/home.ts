import { Component, OnInit, signal, computed } from '@angular/core';
import { CollectionService } from '../../services/collection';
import { Collection } from '../../models/collection.model';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  collections = signal<Collection[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor(private collectionService: CollectionService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.isLoading.set(true);
    this.collectionService.getPublicCollections(page).subscribe({
      next: (response) => {
        this.collections.set(response.kolekcije);
        this.currentPage.set(page);
        this.totalPages.set(Math.ceil(response.ukupno / response.limitPoStranici));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading collections:', err);
        this.isLoading.set(false);
      }
    });
  }
}
