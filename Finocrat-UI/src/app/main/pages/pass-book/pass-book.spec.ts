import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassBook } from './pass-book';

describe('PassBook', () => {
  let component: PassBook;
  let fixture: ComponentFixture<PassBook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassBook]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassBook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
