import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelHeader } from './travel-header';

describe('TravelHeader', () => {
  let component: TravelHeader;
  let fixture: ComponentFixture<TravelHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
