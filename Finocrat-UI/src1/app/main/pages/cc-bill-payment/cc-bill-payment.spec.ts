import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcBillPayment } from './cc-bill-payment';

describe('CcBillPayment', () => {
  let component: CcBillPayment;
  let fixture: ComponentFixture<CcBillPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcBillPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcBillPayment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
