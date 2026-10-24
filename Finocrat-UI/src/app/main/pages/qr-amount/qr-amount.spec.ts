import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrAmountComponent } from './qr-amount';

describe('QrAmountComponent', () => {
  let component: QrAmountComponent;
  let fixture: ComponentFixture<QrAmountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrAmountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QrAmountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
