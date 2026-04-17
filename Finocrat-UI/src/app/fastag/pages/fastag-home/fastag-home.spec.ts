import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagHome } from './fastag-home';

describe('FastagHome', () => {
  let component: FastagHome;
  let fixture: ComponentFixture<FastagHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
