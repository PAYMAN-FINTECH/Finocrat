import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BbpsCategoriesComponent } from './bbps-categories';

describe('BbpsCategoriesComponent', () => {
  let component: BbpsCategoriesComponent;
  let fixture: ComponentFixture<BbpsCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ BbpsCategoriesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BbpsCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
