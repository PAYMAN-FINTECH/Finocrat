import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FailedAmount } from './failed-amount';

describe('FailedAmount', () => {
  let component: FailedAmount;
  let fixture: ComponentFixture<FailedAmount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FailedAmount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FailedAmount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
