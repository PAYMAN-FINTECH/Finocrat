import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bbps } from './bbps';

describe('Bbps', () => {
  let component: Bbps;
  let fixture: ComponentFixture<Bbps>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bbps]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bbps);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
