import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePin } from './change-pin';

describe('ChangePin', () => {
  let component: ChangePin;
  let fixture: ComponentFixture<ChangePin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangePin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
