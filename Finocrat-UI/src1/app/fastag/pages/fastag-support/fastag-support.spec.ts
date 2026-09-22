import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagSupport } from './fastag-support';

describe('FastagSupport', () => {
  let component: FastagSupport;
  let fixture: ComponentFixture<FastagSupport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagSupport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagSupport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
