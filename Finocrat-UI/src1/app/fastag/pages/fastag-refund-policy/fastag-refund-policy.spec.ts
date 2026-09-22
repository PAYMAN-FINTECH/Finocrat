import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagRefundPolicy } from './fastag-refund-policy';

describe('FastagRefundPolicy', () => {
  let component: FastagRefundPolicy;
  let fixture: ComponentFixture<FastagRefundPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagRefundPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagRefundPolicy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
