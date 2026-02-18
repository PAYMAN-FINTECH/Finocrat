import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayinHistory } from './payin-history';

describe('PayinHistory', () => {
  let component: PayinHistory;
  let fixture: ComponentFixture<PayinHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayinHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayinHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
