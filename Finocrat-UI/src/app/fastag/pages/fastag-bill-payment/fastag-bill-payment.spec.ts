import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagBillPayment } from './fastag-bill-payment';

describe('FastagBillPayment', () => {
  let component: FastagBillPayment;
  let fixture: ComponentFixture<FastagBillPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagBillPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagBillPayment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
