
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard')
        .then(m => m.Dashboard)
  },
  {
  path: 'inventory',
  loadComponent: () =>
    import('./features/inventory/inventory/inventory')
      .then(m => m.Inventory)
},

{
  path: 'inventory/add',
  loadComponent: () =>
    import('./features/inventory/add-food/add-food')
      .then(m => m.AddFood)
},

// {
//   path: 'food-scan',
//   loadComponent: () =>
//     import('./features/food-scan/food-scan')
//       .then(m => m.FoodScan)
// },
{
  path: 'food-scan',
  loadComponent: () =>
    import('./features/food-scan/food-scan').then(m => m.FoodScan)
},

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
