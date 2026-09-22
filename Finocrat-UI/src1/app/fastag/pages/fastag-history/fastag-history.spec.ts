import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagHistory } from './fastag-history';

describe('FastagHistory', () => {
  let component: FastagHistory;
  let fixture: ComponentFixture<FastagHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
