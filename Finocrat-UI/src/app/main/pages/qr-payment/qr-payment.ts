import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { createWorker, Worker } from 'tesseract.js';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-qr-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-payment.html',
  styleUrls: ['./qr-payment.css']
})
export class QrPaymentComponent implements OnDestroy {
  // Add each QR image file here. The file name (without extension) is shown as the QR name.
  readonly qrFileNames: string[] = ['Fino1.jpeg'];
  readonly qrImages = this.qrFileNames.map(file => ({
    name: file.replace(/\.[^.]+$/, ''),
    path: `assets/images/${file}`
  }));
  openQr: string | null = null;

  readonly transactionModes = ['UPI', 'IMPS', 'NEFT', 'RTGS'];

  activeTab: 'qr' | 'receipt' = 'qr';

  receiptPreview: string | null = null;
  scanning = false;
  submitting = false;

  utr = '';
  amount: number | null = null;
  receiptDate = '';
  transactionType = '';

  // One OCR worker is reused across uploads so the language data loads only once.
  private workerPromise: Promise<Worker> | null = null;

  constructor(
    private razorService: RazorPaymentService,
    private tokenService: TokenService,
    private toastr: ToastrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async onReceiptSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.receiptPreview = URL.createObjectURL(file);
    this.scanning = true;

    let text: string | null = null;
    try {
      text = await this.ngZone.runOutsideAngular(async () => {
        const worker = await this.getWorker();
        const image = await this.downscaleImage(file);
        const { data } = await worker.recognize(image);
        return data.text;
      });
    } catch {
      text = null;
    }

    this.ngZone.run(() => {
      this.scanning = false;
      if (text !== null) {
        this.parseReceiptText(text);
        this.toastr.success('Receipt scanned. Please verify the details.');
      } else {
        this.toastr.error('Could not read the receipt. Please enter the details manually.');
      }
      this.cdr.detectChanges();
    });
  }

  private getWorker(): Promise<Worker> {
    if (!this.workerPromise) {
      this.workerPromise = createWorker('eng');
    }
    return this.workerPromise;
  }

  // Shrinks and grayscales the screenshot so OCR runs faster and reads digits more reliably.
  private async downscaleImage(file: File): Promise<HTMLCanvasElement> {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'grayscale(100%) contrast(120%)';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas;
  }

  ngOnDestroy() {
    this.workerPromise?.then(w => w.terminate());
    this.workerPromise = null;
  }

  parseReceiptText(text: string) {
    const normalized = text.replace(/\s+/g, ' ');

    const utrMatch =
      normalized.match(/\bUTR\b\D{0,10}(\d{12})\b/i) ||
      normalized.match(/\bUPI\s*(?:transaction|ref(?:erence)?)\s*(?:ID|No\.?)?\D{0,10}(\d{12})\b/i) ||
      normalized.match(/\b(\d{12})\b/);
    this.utr = utrMatch ? utrMatch[1] : '';

    const amountMatch =
      normalized.match(/(?:₹|Rs\.?|INR)\s*(\d{1,7}(?:[,]\d{3})*(?:\.\d{1,2})?)\b/i) ||
      normalized.match(/(?:Paid|Sent|Amount|Total|Debited)\D{0,15}?(\d{1,7}(?:[,]\d{3})*(?:\.\d{1,2})?)\b/i) ||
      normalized.match(/\b(\d{1,7}\.\d{2})\b/);
    const parsedAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : NaN;
    this.amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

    const dateMatch =
      normalized.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/) ||
      normalized.match(/\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/);
    this.receiptDate = dateMatch ? dateMatch[1] : '';

    const modeMatch = normalized.match(/\b(UPI|IMPS|NEFT|RTGS)\b/i);
    this.transactionType = modeMatch ? modeMatch[1].toUpperCase() : '';
  }

  toggleQr(name: string) {
    this.openQr = this.openQr === name ? null : name;
  }

  submitReceipt() {
    const user = this.tokenService.getUser();
    if (!user?.userPhone) {
      this.toastr.error('User not found. Please log in again.');
      return;
    }
    if (!this.utr || !this.amount || this.amount <= 0 || !this.receiptDate || !this.transactionType) {
      this.toastr.warning('Please fill in UTR, amount, date and transaction type.');
      return;
    }

    this.submitting = true;
    this.razorService.submitQrReceipt({
      userPhone: user.userPhone,
      utr: this.utr,
      amount: this.amount,
      receiptDate: this.receiptDate,
      transactionType: this.transactionType
    }).subscribe({
      next: () => {
        this.toastr.success('Receipt submitted. Status: Pending.');
        this.resetReceipt();
        this.submitting = false;
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error(err.status === 409 ? 'This UTR has already been submitted.' : 'Failed to submit receipt.');
        this.submitting = false;
      }
    });
  }

  resetReceipt() {
    this.receiptPreview = null;
    this.utr = '';
    this.amount = null;
    this.receiptDate = '';
    this.transactionType = '';
  }
}
