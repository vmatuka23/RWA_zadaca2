import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection';
import { MultimediaService } from '../../services/multimedia';
import { UserService } from '../../services/user';
import { UserCollectionService } from '../../services/user-collection';
import { Collection } from '../../models/collection.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-moderator',
  imports: [FormsModule],
  templateUrl: './moderator.html',
  styleUrl: './moderator.css'
})
export class Moderator implements OnInit {
  collections = signal<Collection[]>([]);
  totalCollections = signal<number>(0);
  totalMultimedia = signal<number>(0);
  users = signal<User[]>([]);
  selectedCollectionId = signal<number | null>(null);
  selectedUserId = signal<number | null>(null);

  constructor(
    private collectionService: CollectionService,
    private multimediaService: MultimediaService,
    private userService: UserService,
    private userCollectionService: UserCollectionService
  ) {}

  ngOnInit(): void {
    // Load all data automatically on component init
    this.loadAllCollections();
    this.loadAllMultimedia();
    this.loadUsers();
  }

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

  loadUsers(): void {
    this.userService.getUsers(1).subscribe({
      next: (response) => {
        this.users.set(response.korisnici);
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  togglePublic(collection: Collection): void {
    const newStatus = !collection.javno;
    this.collectionService.updateCollection(collection.id!, { javno: newStatus }).subscribe({
      next: () => {
        // Update local state
        const updatedCollections = this.collections().map(c => 
          c.id === collection.id ? { ...c, javno: newStatus } : c
        );
        this.collections.set(updatedCollections);
      },
      error: (err) => console.error('Error updating collection:', err)
    });
  }

  deleteCollection(id: number): void {
    if (confirm('Jeste li sigurni da želite obrisati ovu kolekciju?')) {
      this.collectionService.deleteCollection(id).subscribe({
        next: () => {
          // Remove from local state
          const updatedCollections = this.collections().filter(c => c.id !== id);
          this.collections.set(updatedCollections);
          this.totalCollections.set(this.totalCollections() - 1);
        },
        error: (err) => console.error('Error deleting collection:', err)
      });
    }
  }

  addUserToCollection(): void {
    const collectionId = this.selectedCollectionId();
    const userId = this.selectedUserId();
    
    if (!collectionId || !userId) {
      alert('Molimo odaberite kolekciju i korisnika');
      return;
    }

    this.userCollectionService.addUserToCollection(collectionId, userId).subscribe({
      next: () => {
        alert('Korisnik uspješno dodan u kolekciju');
        this.selectedCollectionId.set(null);
        this.selectedUserId.set(null);
      },
      error: (err) => {
        console.error('Error adding user to collection:', err);
        alert('Greška prilikom dodavanja korisnika u kolekciju');
      }
    });
  }
}
