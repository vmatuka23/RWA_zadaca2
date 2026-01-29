import { Component, signal } from '@angular/core';
import { CollectionService } from '../../services/collection';
import { MultimediaService } from '../../services/multimedia';
import { Collection } from '../../models/collection.model';

@Component({
  selector: 'app-moderator',
  imports: [],
  templateUrl: './moderator.html',
  styleUrl: './moderator.css'
})
export class Moderator {
  collections = signal<Collection[]>([]);
  totalCollections = signal<number>(0);
  totalMultimedia = signal<number>(0);

  constructor(
    private collectionService: CollectionService,
    private multimediaService: MultimediaService
  ) {}

  loadAllCollections(): void {
    this.collectionService.getCollections(1, true).subscribe({
      next: (response) => {
        this.collections.set(response.kolekcije);
        this.totalCollections.set(response.ukupno);
      },
      error: (err) => console.error('Error loading collections:', err)
    });
  }

  loadAllMultimedia(): void {
    this.multimediaService.getMultimedia().subscribe({
      next: (response) => {
        this.totalMultimedia.set(response.ukupno);
      },
      error: (err) => console.error('Error loading multimedia:', err)
    });
  }
}
