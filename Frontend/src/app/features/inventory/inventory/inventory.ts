
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { InventoryService, FoodItem } from '../inventory.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  items: FoodItem[] = [];
  total = 0;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadInventory();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        if (this.router.url === '/inventory') {
          this.loadInventory();
        }
      });
  }

  goToAddFood(): void {
    this.router.navigate(['/inventory/add']);
  }

  loadInventory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.inventoryService.getFoodItems().subscribe({
      next: (response) => {
        this.items = response.items;
        this.total = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Inventory API error:', error);
        this.errorMessage =
          'Unable to load inventory. Please check whether the backend is running.';
        this.isLoading = false;
      }
    });
  }
}
