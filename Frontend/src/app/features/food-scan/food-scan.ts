
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FoodScanService, AIClassificationResponse } from './food-scan.service';

@Component({
  selector: 'app-food-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './food-scan.html',
  styleUrl: './food-scan.css'
})
export class FoodScan implements OnDestroy {
  private readonly foodScanService = inject(FoodScanService);

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  private previewUrl: string | null = null;

  isScanning = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  scanResult: AIClassificationResponse | null = null;
  scanAttempted = false;
  confirmedPrediction = false;

  foodName = '';
  category = 'Other';
  quantity = 1;
  unit = 'pcs';
  unitPrice = 0;
  supplier = 'Local Supermarket';
  purchaseDate = new Date().toISOString().slice(0, 10);
  expiryDate = '';
  notes = '';

  readonly categories = [
    'Fruits',
    'Vegetables',
    'Dairy',
    'Grains & Pulses',
    'Packaged Food',
    'Other'
  ];

  readonly units = ['pcs', 'kg', 'g', 'l', 'ml', 'packet', 'bunch'];

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.scanResult = null;
    this.scanAttempted = false;
    this.confirmedPrediction = false;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Please select an image smaller than 10 MB.';
      input.value = '';
      return;
    }

    this.clearPreview();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.imagePreview = this.previewUrl;
  }

  scanFood(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please upload a food image first.';
      return;
    }

    this.isScanning = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.scanResult = null;
    this.scanAttempted = true;
    this.confirmedPrediction = false;

    this.foodScanService.classifyFoodImage(this.selectedFile).subscribe({
      next: (result) => {
        this.scanResult = result;
        this.isScanning = false;

        if (!result.success) {
          this.errorMessage =
            result.error || 'Unable to classify this image. Please enter the details manually.';
          return;
        }

        this.foodName = result.predicted_food || '';
        this.category = this.categories.includes(result.category)
          ? result.category
          : 'Other';
        this.unit = this.units.includes(result.default_unit)
          ? result.default_unit
          : 'pcs';

        const shelfLife = Number(result.suggested_shelf_life_days);
        if (Number.isFinite(shelfLife) && shelfLife >= 0) {
          const expiry = new Date(`${this.purchaseDate}T12:00:00`);
          expiry.setDate(expiry.getDate() + shelfLife);
          this.expiryDate = this.toDateInputValue(expiry);
        }

        this.confirmedPrediction = false;
      },
      error: (error) => {
        console.error('Food classification failed:', error);
        this.isScanning = false;
        this.errorMessage =
          error.error?.detail ||
          'Could not connect to the classification API. Check that the backend is running.';
      }
    });
  }

  confirmPrediction(): void {
    if (!this.scanResult?.success) return;
    this.confirmedPrediction = true;
    this.errorMessage = '';
  }

  useManualDetails(): void {
    this.scanResult = null;
    this.scanAttempted = false;
    this.confirmedPrediction = true;
    this.errorMessage = '';
  }

  saveToInventory(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.foodName.trim()) {
      this.errorMessage = 'Enter the food name before saving.';
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'Please upload a food image first.';
      return;
    }

    if (!this.confirmedPrediction) {
      this.errorMessage = 'Please confirm the predicted food or choose manual details.';
      return;
    }

    if (!this.purchaseDate || !this.expiryDate) {
      this.errorMessage = 'Please enter the purchase date and expiry date.';
      return;
    }

    if (this.expiryDate < this.purchaseDate) {
      this.errorMessage = 'Expiry date cannot be earlier than purchase date.';
      return;
    }

    if (!Number.isFinite(this.quantity) || this.quantity <= 0) {
      this.errorMessage = 'Quantity must be greater than zero.';
      return;
    }

    if (!Number.isFinite(this.unitPrice) || this.unitPrice < 0) {
      this.errorMessage = 'Unit price cannot be negative.';
      return;
    }

    const purchaseDateTime = `${this.purchaseDate}T12:00:00`;
    const expiryDateTime = `${this.expiryDate}T23:59:00`;

    this.isSaving = true;

    this.foodScanService.saveFoodPurchase({
      product_name: this.foodName.trim(),
      category: this.category,
      quantity: this.quantity,
      unit: this.unit,
      unit_price: this.unitPrice,
      total_cost: Number((this.quantity * this.unitPrice).toFixed(2)),
      supplier: this.supplier.trim() || 'Local Supermarket',
      purchase_date: purchaseDateTime,
      expiry_date: expiryDateTime,
      notes: this.notes.trim() || undefined
    }).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage =
          `${response.product_name} was saved to inventory successfully.`;
      },
      error: (error) => {
        console.error('Saving food failed:', error);
        this.isSaving = false;
        this.errorMessage =
          error.error?.detail ||
          'Could not save the food. Please verify the purchase API and try again.';
      }
    });
  }

  removeImage(): void {
    this.clearPreview();
    this.selectedFile = null;
    this.scanResult = null;
    this.scanAttempted = false;
    this.confirmedPrediction = false;
    this.foodName = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.imagePreview = null;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }
}
