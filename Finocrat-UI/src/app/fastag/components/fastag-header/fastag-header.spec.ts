import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagHeader } from './fastag-header';

describe('FastagHeader', () => {
  let component: FastagHeader;
  let fixture: ComponentFixture<FastagHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
