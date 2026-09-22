import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceVerify } from './invoice-verify';

describe('InvoiceVerify', () => {
  let component: InvoiceVerify;
  let fixture: ComponentFixture<InvoiceVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceVerify]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceVerify);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
