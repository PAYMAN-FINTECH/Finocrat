import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mainfooter } from './mainfooter';

describe('Mainfooter', () => {
  let component: Mainfooter;
  let fixture: ComponentFixture<Mainfooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mainfooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mainfooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
