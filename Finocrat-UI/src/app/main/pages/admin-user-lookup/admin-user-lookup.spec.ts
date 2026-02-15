import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserLookup } from './admin-user-lookup';

describe('AdminUserLookup', () => {
  let component: AdminUserLookup;
  let fixture: ComponentFixture<AdminUserLookup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserLookup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUserLookup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
