
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FoodItem {
  food_item_id: number;
  user_id: number;
  food_name: string;
  category: string | null;
  purchase_type: string;
  purchase_date: string;
  expiry_date: string | null;
  estimated_shelf_life_days: number | null;
  storage_location: string | null;
  quantity: number;
  unit: string;
  food_status: string;
  waste_risk_score: number | null;
}

export interface FoodItemsResponse {
  total: number;
  items: FoodItem[];
}

export interface FoodItemCreate {
  user_id: number;
  food_name: string;
  category: string | null;
  purchase_type: string;
  purchase_date: string;
  expiry_date: string | null;
  estimated_shelf_life_days: number | null;
  storage_location: string | null;
  quantity: number;
  unit: string;
  food_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/food-items/';

  getFoodItems(): Observable<FoodItemsResponse> {
    return this.http.get<FoodItemsResponse>(this.apiUrl);
  }

  addFoodItem(food: FoodItemCreate): Observable<{ message: string; food_item_id: number }> {
    return this.http.post<{ message: string; food_item_id: number }>(
      this.apiUrl,
      food
    );
  }
}
