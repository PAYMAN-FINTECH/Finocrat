import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagAbout } from './fastag-about';

describe('FastagAbout', () => {
  let component: FastagAbout;
  let fixture: ComponentFixture<FastagAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagAbout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagAbout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
