import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagPrivacyPolicy } from './fastag-privacy-policy';

describe('FastagPrivacyPolicy', () => {
  let component: FastagPrivacyPolicy;
  let fixture: ComponentFixture<FastagPrivacyPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagPrivacyPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagPrivacyPolicy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
