import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodScan } from './food-scan';

describe('FoodScan', () => {
  let component: FoodScan;
  let fixture: ComponentFixture<FoodScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodScan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodScan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
