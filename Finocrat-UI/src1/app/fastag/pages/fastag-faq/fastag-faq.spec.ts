import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FastagFaq } from './fastag-faq';

describe('FastagFaq', () => {
  let component: FastagFaq;
  let fixture: ComponentFixture<FastagFaq>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastagFaq]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FastagFaq);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
