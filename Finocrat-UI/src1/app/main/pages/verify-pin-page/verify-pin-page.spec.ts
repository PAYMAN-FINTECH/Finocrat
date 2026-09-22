import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyPinPage } from './verify-pin-page';

describe('VerifyPinPage', () => {
  let component: VerifyPinPage;
  let fixture: ComponentFixture<VerifyPinPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyPinPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyPinPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
