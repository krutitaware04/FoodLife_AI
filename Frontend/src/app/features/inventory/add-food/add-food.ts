
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  InventoryService,
  FoodItemCreate
} from '../inventory.service';

@Component({
  selector: 'app-add-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-food.html',
  styleUrl: './add-food.css'
})
export class AddFood {
  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Temporary user ID for development.
  // Authentication will replace this later.
  private readonly userId = 1;

  food = {
    food_name: '',
    category: '',
    purchase_type: 'Offline',
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    estimated_shelf_life_days: null as number | null,
    storage_location: 'Fridge',
    quantity: 1,
    unit: 'pieces',
    food_status: 'Fresh'
  };

  saveFood(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.food.food_name.trim()) {
      this.errorMessage = 'Please enter the food name.';
      return;
    }

    if (this.food.quantity <= 0) {
      this.errorMessage = 'Quantity must be greater than zero.';
      return;
    }

    if (
      this.food.expiry_date &&
      this.food.expiry_date < this.food.purchase_date
    ) {
      this.errorMessage = 'Expiry date cannot be before purchase date.';
      return;
    }

    const payload: FoodItemCreate = {
      ...this.food,
      user_id: this.userId,
      category: this.food.category || null,
      expiry_date: this.food.expiry_date || null
    };

    this.isSaving = true;

    this.inventoryService.addFoodItem(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = response.message;

        this.router.navigate(['/inventory']).then(() => {
          // Inventory page loads the latest data when opened.
        });
      },
      error: (error) => {
        console.error('Add food API error:', error);
        this.isSaving = false;
        this.errorMessage =
          error.error?.detail ||
          'Unable to save food item. Please try again.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }
}
