import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelTerms } from './travel-terms';

describe('TravelTerms', () => {
  let component: TravelTerms;
  let fixture: ComponentFixture<TravelTerms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelTerms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelTerms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
