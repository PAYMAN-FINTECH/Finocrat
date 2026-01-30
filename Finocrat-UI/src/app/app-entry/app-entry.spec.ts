import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppEntry } from './app-entry';

describe('AppEntry', () => {
  let component: AppEntry;
  let fixture: ComponentFixture<AppEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
