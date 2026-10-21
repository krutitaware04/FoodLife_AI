
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AIClassificationResponse {
  success: boolean;
  predicted_food: string;
  category: string;
  default_unit: string;
  suggested_shelf_life_days: number;
  suggested_storage: string;
  confidence: number;
  is_high_confidence: boolean;
  requires_user_confirmation: boolean;
  disclaimer: string;
  all_probabilities?: Record<string, number>;
  error?: string;
}

export interface PurchaseResponse {
  id: number;
  item_id?: number;
  product_name: string;
  updated_stock_quantity?: number;
}

export interface PurchaseCreate {
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost?: number;
  supplier?: string;
  purchase_date?: string;
  expiry_date?: string;
  barcode?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FoodScanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  classifyFoodImage(file: File): Observable<AIClassificationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AIClassificationResponse>(
      `${this.apiUrl}/ai/classify-food`,
      formData
    );
  }

  saveFoodPurchase(data: PurchaseCreate): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(
      `${this.apiUrl}/purchases`,
      data
    );
  }
}
