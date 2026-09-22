import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelLayout } from './travel-layout';

describe('TravelLayout', () => {
  let component: TravelLayout;
  let fixture: ComponentFixture<TravelLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
