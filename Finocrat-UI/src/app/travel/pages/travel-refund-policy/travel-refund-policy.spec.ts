import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRefundPolicy } from './travel-refund-policy';

describe('TravelRefundPolicy', () => {
  let component: TravelRefundPolicy;
  let fixture: ComponentFixture<TravelRefundPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRefundPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRefundPolicy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
