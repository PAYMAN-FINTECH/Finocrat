import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelFooter } from './travel-footer';

describe('TravelFooter', () => {
  let component: TravelFooter;
  let fixture: ComponentFixture<TravelFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
