import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EduWallet } from './edu-wallet';

describe('EduWallet', () => {
  let component: EduWallet;
  let fixture: ComponentFixture<EduWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EduWallet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EduWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
