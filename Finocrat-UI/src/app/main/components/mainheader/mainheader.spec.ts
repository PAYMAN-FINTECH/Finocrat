import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mainheader } from './mainheader';

describe('Mainheader', () => {
  let component: Mainheader;
  let fixture: ComponentFixture<Mainheader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mainheader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mainheader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
