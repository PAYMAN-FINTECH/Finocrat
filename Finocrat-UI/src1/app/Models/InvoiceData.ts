export interface InvoiceData {

  invoiceNo: string;

  transactionId: string;

  invoiceDate: string;

  customerName: string;

  customerPhone: string;

  customerAddress: string;

  paymentMode: string;

  service: string;

  hsnSac: string;

  quantity: number;

  amount: number;

  cgst: number;

  sgst: number;

  totalGst: number;

  grandTotal: number;

  status: string;

  verificationUrl: string;
}