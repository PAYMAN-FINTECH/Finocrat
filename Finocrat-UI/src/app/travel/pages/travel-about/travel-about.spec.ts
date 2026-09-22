import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelAbout } from './travel-about';

describe('TravelAbout', () => {
  let component: TravelAbout;
  let fixture: ComponentFixture<TravelAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelAbout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelAbout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
