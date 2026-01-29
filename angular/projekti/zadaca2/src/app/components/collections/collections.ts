import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection';
import { MultimediaService } from '../../services/multimedia';
import { Collection } from '../../models/collection.model';
import { Multimedia } from '../../models/multimedia.model';

@Component({
  selector: 'app-collections',
  imports: [ReactiveFormsModule],
  templateUrl: './collections.html',
  styleUrl: './collections.css'
})
export class Collections implements OnInit {
  collections = signal<Collection[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  
  showCreateModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  selectedCollection = signal<Collection | null>(null);
  editingCollection = signal<boolean>(false);
  collectionItems = signal<Multimedia[]>([]);
  
  collectionForm: FormGroup;
  
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor(
    private collectionService: CollectionService,
    private multimediaService: MultimediaService,
    private fb: FormBuilder
  ) {
    this.collectionForm = this.fb.group({
      naziv: ['', Validators.required],
      opis: [''],
      javno: [false]
    });
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.isLoading.set(true);
    this.collectionService.getCollections(page).subscribe({
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

  openCreateModal(): void {
    this.editingCollection.set(false);
    this.collectionForm.reset({ javno: false });
    this.showCreateModal.set(true);
  }

  openEditModal(): void {
    const collection = this.selectedCollection();
    if (collection) {
      this.editingCollection.set(true);
      this.collectionForm.patchValue({
        naziv: collection.naziv,
        opis: collection.opis,
        javno: collection.javno
      });
      this.showDetailsModal.set(false);
      this.showCreateModal.set(true);
    }
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  saveCollection(): void {
    if (this.collectionForm.invalid) return;

    const data = this.collectionForm.value;
    
    if (this.editingCollection() && this.selectedCollection()) {
      this.collectionService.updateCollection(this.selectedCollection()!.id, data).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadPage(this.currentPage());
        },
        error: (err) => console.error('Error updating collection:', err)
      });
    } else {
      this.collectionService.createCollection(data).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadPage(this.currentPage());
        },
        error: (err) => console.error('Error creating collection:', err)
      });
    }
  }

  openDetailsModal(collection: Collection): void {
    this.selectedCollection.set(collection);
    this.showDetailsModal.set(true);
    
    this.multimediaService.getMultimedia(collection.id).subscribe({
      next: (response) => {
        this.collectionItems.set(response.multimedija || []);
      },
      error: (err) => console.error('Error loading items:', err)
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedCollection.set(null);
    this.collectionItems.set([]);
  }

  toggleVisibility(): void {
    const collection = this.selectedCollection();
    if (collection) {
      this.collectionService.updateCollection(collection.id, { javno: !collection.javno }).subscribe({
        next: () => {
          this.loadPage(this.currentPage());
          this.closeDetailsModal();
        },
        error: (err) => console.error('Error toggling visibility:', err)
      });
    }
  }

  deleteCollection(): void {
    const collection = this.selectedCollection();
    if (collection && confirm(`Jeste li sigurni da želite obrisati kolekciju "${collection.naziv}"?`)) {
      this.collectionService.deleteCollection(collection.id).subscribe({
        next: () => {
          this.closeDetailsModal();
          this.loadPage(this.currentPage());
        },
        error: (err) => console.error('Error deleting collection:', err)
      });
    }
  }
}
