import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagFooter } from './fastag-footer';

describe('FastagFooter', () => {
  let component: FastagFooter;
  let fixture: ComponentFixture<FastagFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
