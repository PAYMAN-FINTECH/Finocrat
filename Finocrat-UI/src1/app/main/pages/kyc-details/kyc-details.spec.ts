import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDetails } from './kyc-details';

describe('KycDetails', () => {
  let component: KycDetails;
  let fixture: ComponentFixture<KycDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KycDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
