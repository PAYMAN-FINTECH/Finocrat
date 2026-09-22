import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagTerms } from './fastag-terms';

describe('FastagTerms', () => {
  let component: FastagTerms;
  let fixture: ComponentFixture<FastagTerms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagTerms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagTerms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
