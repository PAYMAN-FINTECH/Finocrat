import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayoutHistory } from './payout-history';

describe('PayoutHistory', () => {
  let component: PayoutHistory;
  let fixture: ComponentFixture<PayoutHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayoutHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
