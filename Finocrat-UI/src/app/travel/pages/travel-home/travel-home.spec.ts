import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelHome } from './travel-home';

describe('TravelHome', () => {
  let component: TravelHome;
  let fixture: ComponentFixture<TravelHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
