import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashborad } from './dashborad';

describe('Dashborad', () => {
  let component: Dashborad;
  let fixture: ComponentFixture<Dashborad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashborad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashborad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
