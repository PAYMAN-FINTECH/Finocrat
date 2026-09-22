import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelPrivacyPolicy } from './travel-privacy-policy';

describe('TravelPrivacyPolicy', () => {
  let component: TravelPrivacyPolicy;
  let fixture: ComponentFixture<TravelPrivacyPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelPrivacyPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelPrivacyPolicy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
