import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelContact } from './travel-contact';

describe('TravelContact', () => {
  let component: TravelContact;
  let fixture: ComponentFixture<TravelContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
