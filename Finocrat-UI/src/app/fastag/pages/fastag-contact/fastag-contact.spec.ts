import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagContact } from './fastag-contact';

describe('FastagContact', () => {
  let component: FastagContact;
  let fixture: ComponentFixture<FastagContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
