import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagLayout } from './fastag-layout';

describe('FastagLayout', () => {
  let component: FastagLayout;
  let fixture: ComponentFixture<FastagLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
