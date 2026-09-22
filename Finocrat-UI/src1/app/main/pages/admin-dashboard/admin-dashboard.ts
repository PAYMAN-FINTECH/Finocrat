import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';
import { HttpClient } from '@angular/common/http';

import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';

import QRCode from 'qrcode';

import JSZip from 'jszip';

import {
  saveAs
} from 'file-saver';

import {
  InvoiceData
} from '../../../Models/InvoiceData';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {

  fromDate: string = '';
  toDate: string = '';

  invoiceFromDate = '';

invoiceToDate = '';

invoiceUserPhone = '';

invoiceLoading = false;

invoiceError = '';

invoiceCount = 0;

  data: any = {
    summary: {},
    users: [],
    payIns: [],
    payOuts: []
  };

  loading = false;
  errorMsg = '';

  active: string = 'users';
  private baseUrl = environment.apiUrl;

  constructor(private service: HomeService,   private http: HttpClient) {}

  ngOnInit() {
    const today = new Date().toISOString().substring(0, 10);
    this.fromDate = today;
    this.toDate = today;

    this.loadData();
  }

  toggle(section: string) {
    this.active = this.active === section ? '' : section;
  }
  

  loadData() {
    this.loading = true;
    this.errorMsg = '';

    this.service.getDashboard(this.fromDate, this.toDate)
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Failed to load dashboard';
          this.loading = false;
        }
      });
  }

  // 🔥 GET USER NAME FROM PHONE
  getUserName(phone: string): string {
    const user = this.data?.users?.find((u: any) => u.userPhone === phone);
    return user ? user.userName : phone;
  }

  private formatInvoiceDate(
  value: string
): string {

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}

private currency(
  value: number
): string {

  return `Rs. ${Number(value || 0).toFixed(2)}`;

}

private loadImageAsDataUrl(
  url: string,
  maxWidth: number = 500,
  quality: number = 0.65
): Promise<string> {

  return new Promise((resolve, reject) => {

    const img = new Image();

    img.onload = () => {

      try {

        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;

        if (!originalWidth || !originalHeight) {
          reject(new Error('Invalid image dimensions'));
          return;
        }

        // Resize only when necessary
        const scale = Math.min(
          1,
          maxWidth / originalWidth
        );

        const width = Math.max(
          1,
          Math.round(originalWidth * scale)
        );

        const height = Math.max(
          1,
          Math.round(originalHeight * scale)
        );

        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(
            new Error('Canvas context unavailable')
          );
          return;
        }

        // Better image quality while resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        // JPEG dramatically reduces PDF size compared
        // with a large transparent PNG.
        const compressedImage =
          canvas.toDataURL(
            'image/jpeg',
            quality
          );

        resolve(compressedImage);

      } catch (error) {

        reject(error);
      }
    };

    img.onerror = () => {

      reject(
        new Error(
          `Unable to load image: ${url}`
        )
      );
    };

    // Local Angular asset = no CORS problem
    img.src = url;
  });
}


async generateInvoices(): Promise<void> {

  this.invoiceError = '';

  // =========================================
  // VALIDATION
  // =========================================

  if (!this.invoiceFromDate) {

    this.invoiceError =
      'Please select start date.';

    return;
  }

  if (!this.invoiceToDate) {

    this.invoiceError =
      'Please select end date.';

    return;
  }

  if (!this.invoiceUserPhone) {

    this.invoiceError =
      'Please select user.';

    return;
  }

  if (
    this.invoiceFromDate >
    this.invoiceToDate
  ) {

    this.invoiceError =
      'Start date cannot be greater than end date.';

    return;
  }

  this.invoiceLoading = true;

  this.invoiceCount = 0;

  try {

    // =========================================
    // API REQUEST
    // =========================================

    const request = {

      fromDate:
        this.invoiceFromDate,

      toDate:
        this.invoiceToDate,

      userPhone:
        this.invoiceUserPhone

    };

    // =========================================
    // GET DATA ONLY
    // =========================================

    const invoices =
      await this.http
        .post<InvoiceData[]>(
          `${this.baseUrl}/dashboard/data`,
          request
        )
        .toPromise();

    // =========================================
    // CHECK DATA
    // =========================================

    if (
      !invoices ||
      invoices.length === 0
    ) {

      this.invoiceError =
        'No transactions found for the selected user and date range.';

      return;
    }

    // =========================================
    // CREATE ZIP
    // =========================================

    const zip =
      new JSZip();

    // =========================================
    // GENERATE EACH PDF
    // =========================================

    for (
      let i = 0;
      i < invoices.length;
      i++
    ) {

      const invoice =
        invoices[i];

      const pdf =
        await this.createInvoicePdf(
          invoice
        );

      const pdfBytes =
        pdf.output(
          'arraybuffer'
        );

      zip.file(
        `${invoice.invoiceNo}.pdf`,
        pdfBytes
      );

      this.invoiceCount =
        i + 1;
    }

    // =========================================
    // GENERATE ZIP
    // =========================================

    const zipBlob =
      await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

    // =========================================
    // DOWNLOAD
    // =========================================

    const fileName =
      `Invoices_${this.invoiceUserPhone}_${this.invoiceFromDate}_${this.invoiceToDate}.zip`;

    saveAs(
      zipBlob,
      fileName
    );

  }
  catch (error) {

    console.error(
      'Invoice generation failed:',
      error
    );

    this.invoiceError =
      'Unable to generate invoices. Please try again.';

  }
  finally {

    this.invoiceLoading =
      false;

  }
}

async createInvoicePdf(
  invoice: InvoiceData
): Promise<jsPDF> {

  const pdf = new jsPDF(
    'p',
    'mm',
    'a4'
  );

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 10;

  const contentWidth =
    pageWidth - (margin * 2);


  // =====================================================
  // COLORS
  // =====================================================
const borderColor: [number, number, number] = [
  75,
  75,
  85
];

const lightBorder: [number, number, number] = [
  190,
  190,
  200
];

const lightPurple: [number, number, number] = [
  237,
  233,
  254
];

const purpleText: [number, number, number] = [
  76,
  58,
  120
];

const darkText: [number, number, number] = [
  30,
  30,
  35
];

const mutedText: [number, number, number] = [
  90,
  90,
  100
];


  // =====================================================
  // QR CODE
  // =====================================================

  let qrDataUrl = '';

  try {

    qrDataUrl =
      await QRCode.toDataURL(
        invoice.verificationUrl,
        {
          width: 300,
          margin: 1,
          errorCorrectionLevel: 'M'
        }
      );

  } catch (error) {

    console.error(
      'QR generation failed:',
      error
    );

  }


  // =====================================================
  // LOGO
  // =====================================================

  let logoDataUrl = '';

  try {

    logoDataUrl =
      await this.loadImageAsDataUrl(
        'assets/images/main/finocrat-logo.png'
      );

  } catch (error) {

    console.error(
      'Logo loading failed:',
      error
    );

  }


  // =====================================================
  // OUTER PAGE BORDER
  // =====================================================

  pdf.setDrawColor(
    borderColor[0],
    borderColor[1],
    borderColor[2]
  );

  pdf.setLineWidth(0.45);

  pdf.roundedRect(
    margin,
    margin,
    contentWidth,
    pageHeight - (margin * 2),
    2,
    2
  );


  // =====================================================
  // HEADER
  // =====================================================

  const headerTop = 14;
  const headerHeight = 39;
  const headerBottom =
    headerTop + headerHeight;


  // Very light header background

  pdf.setFillColor(
    250,
    249,
    255
  );

  pdf.roundedRect(
    margin + 2,
    headerTop,
    contentWidth - 4,
    headerHeight,
    1.5,
    1.5,
    'F'
  );


  // =====================================================
  // LOGO
  // =====================================================

  if (logoDataUrl) {

    try {

      pdf.addImage(
        logoDataUrl,
        'PNG',
        15,
        17,
        32,
        15
      );

    } catch (error) {

      console.error(
        'Logo rendering failed:',
        error
      );

    }

  }


  // =====================================================
  // COMPANY NAME
  // =====================================================

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(10.5);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'Finocrat Solutions Pvt. Ltd.',
    15,
    38
  );


  // =====================================================
  // COMPANY ADDRESS
  // =====================================================

  pdf.setFont(
    'helvetica',
    'normal'
  );

  pdf.setFontSize(7.2);

  pdf.setTextColor(
    mutedText[0],
    mutedText[1],
    mutedText[2]
  );

  const companyAddress =
    'H.No. 7-1-414/B, Mankammathota, Opp. Shivani Degree College, Karimnagar, Telangana - 505001';

  const companyAddressLines =
    pdf.splitTextToSize(
      companyAddress,
      105
    );

  pdf.text(
    companyAddressLines,
    15,
    43
  );


  // =====================================================
  // GSTIN
  // =====================================================

  const gstY =
    43 +
    (
      companyAddressLines.length *
      3.5
    ) +
    2;

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(7.2);

  pdf.text(
    'GSTIN: 36AAGCF7686J1ZZ',
    15,
    gstY
  );


  // =====================================================
  // TAX INVOICE TITLE
  // =====================================================

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(18);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'TAX INVOICE',
    pageWidth / 2,
    27,
    {
      align: 'center'
    }
  );


  // =====================================================
  // QR
  // =====================================================

  if (qrDataUrl) {

    pdf.addImage(
      qrDataUrl,
      'PNG',
      pageWidth - 45,
      16,
      27,
      27
    );

    pdf.setFont(
      'helvetica',
      'normal'
    );

    pdf.setFontSize(5.8);

    pdf.setTextColor(
      mutedText[0],
      mutedText[1],
      mutedText[2]
    );

    pdf.text(
      'Scan to verify invoice',
      pageWidth - 31.5,
      45,
      {
        align: 'center'
      }
    );

  }


  // =====================================================
  // HEADER SEPARATOR
  // =====================================================

  pdf.setDrawColor(
    lightBorder[0],
    lightBorder[1],
    lightBorder[2]
  );

  pdf.setLineWidth(0.25);

  pdf.line(
    margin + 3,
    headerBottom,
    pageWidth - margin - 3,
    headerBottom
  );


  // =====================================================
  // TRANSACTION + CUSTOMER INFORMATION
  // =====================================================

  const infoTop =
    headerBottom + 4;

  const infoHeight =
    42;

  const infoBottom =
    infoTop + infoHeight;

  const innerLeft =
    margin + 3;

  const innerWidth =
    contentWidth - 6;

  const middleX =
    pageWidth / 2;


  // Main box

  pdf.setDrawColor(
    borderColor[0],
    borderColor[1],
    borderColor[2]
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    innerLeft,
    infoTop,
    innerWidth,
    infoHeight,
    1,
    1
  );


  // Middle separator

  pdf.line(
    middleX,
    infoTop,
    middleX,
    infoBottom
  );


  // =====================================================
  // SECTION HEADERS
  // =====================================================

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(8.5);

  pdf.setTextColor(
    purpleText[0],
    purpleText[1],
    purpleText[2]
  );

  pdf.text(
    'TRANSACTION DETAILS',
    innerLeft + 4,
    infoTop + 7
  );

  pdf.text(
    'CUSTOMER DETAILS',
    middleX + 4,
    infoTop + 7
  );


  // Small separator below headings

  pdf.setDrawColor(
    lightBorder[0],
    lightBorder[1],
    lightBorder[2]
  );

  pdf.setLineWidth(0.2);

  pdf.line(
    innerLeft + 4,
    infoTop + 9,
    middleX - 4,
    infoTop + 9
  );

  pdf.line(
    middleX + 4,
    infoTop + 9,
    pageWidth - margin - 3,
    infoTop + 9
  );


  // =====================================================
  // TRANSACTION VALUES
  // =====================================================

  let txY =
    infoTop + 15;

  const txLabelX =
    innerLeft + 4;

  const txValueX =
    innerLeft + 34;


  const txRows = [

    [
      'Invoice No:',
      invoice.invoiceNo || 'N/A'
    ],

    [
      'Date:',
      this.formatInvoiceDate(
        invoice.invoiceDate
      )
    ],

    [
      'Transaction ID:',
      invoice.transactionId || 'N/A'
    ],

    [
      'Payment Mode:',
      invoice.paymentMode || 'N/A'
    ]

  ];


  pdf.setFontSize(7.5);


  txRows.forEach(
    ([label, value]) => {

      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
      );

      pdf.text(
        label,
        txLabelX,
        txY
      );

      pdf.setFont(
        'helvetica',
        'normal'
      );

      const valueLines =
        pdf.splitTextToSize(
          value,
          58
        );

      pdf.text(
        valueLines,
        txValueX,
        txY
      );

      txY +=
        Math.max(
          5.5,
          valueLines.length * 3.5
        );

    }
  );


  // =====================================================
  // CUSTOMER VALUES
  // =====================================================

  const customerLabelX =
    middleX + 4;

  const customerValueX =
    middleX + 28;

  let customerY =
    infoTop + 15;


  pdf.setFontSize(7.5);


  // Name

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.text(
    'Name:',
    customerLabelX,
    customerY
  );

  pdf.setFont(
    'helvetica',
    'normal'
  );

  pdf.text(
    invoice.customerName || 'N/A',
    customerValueX,
    customerY
  );


  customerY += 5.5;


  // Mobile

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.text(
    'Mobile:',
    customerLabelX,
    customerY
  );

  pdf.setFont(
    'helvetica',
    'normal'
  );

  pdf.text(
    invoice.customerPhone || 'N/A',
    customerValueX,
    customerY
  );


  customerY += 5.5;


  // Address

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.text(
    'Address:',
    customerLabelX,
    customerY
  );

  pdf.setFont(
    'helvetica',
    'normal'
  );


  const address =
    invoice.customerAddress ||
    'N/A';


  const addressLines =
    pdf.splitTextToSize(
      address,
      60
    );


  pdf.text(
    addressLines,
    customerValueX,
    customerY
  );


  // =====================================================
  // SERVICE TABLE
  // =====================================================

  const tableStartY =
    infoBottom + 5;


  autoTable(
    pdf,
    {

      startY: tableStartY,

      margin: {
        left: innerLeft,
        right: innerLeft
      },

      theme: 'grid',

      head: [

        [
          'S.No.',
          'Service',
          'HSN/SAC',
          'Qty',
          'Unit Price',
          'Amount'
        ]

      ],

      body: [

        [
          '1',

          invoice.service || 'N/A',

          invoice.hsnSac || 'N/A',

          invoice.quantity
            ?.toString() || '1',

          this.currency(
            invoice.amount
          ),

          this.currency(
            invoice.amount
          )

        ]

      ],

      styles: {

        font: 'helvetica',

        fontSize: 7.5,

        textColor: [
          35,
          35,
          40
        ],

        cellPadding: {
          top: 3,
          right: 2.5,
          bottom: 3,
          left: 2.5
        },

        valign: 'middle',

        lineColor: [
          180,
          180,
          188
        ],

        lineWidth: 0.2

      },

      headStyles: {

        fillColor: lightPurple,

        textColor: purpleText,

        fontStyle: 'bold',

        fontSize: 7.5,

        halign: 'center',

        lineColor: [
          180,
          180,
          188
        ],

        lineWidth: 0.25

      },

      bodyStyles: {

        minCellHeight: 11

      },

      columnStyles: {

        0: {
          cellWidth: 15,
          halign: 'center'
        },

        1: {
          cellWidth: 76
        },

        2: {
          cellWidth: 25,
          halign: 'center'
        },

        3: {
          cellWidth: 14,
          halign: 'center'
        },

        4: {
          cellWidth: 29,
          halign: 'right'
        },

        5: {
          cellWidth: 29,
          halign: 'right'
        }

      }

    }
  );


  // =====================================================
  // TABLE END
  // =====================================================

  const finalY =
    (
      pdf as any
    ).lastAutoTable.finalY;


  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  const statusY =
    finalY + 12;


  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'Payment Status:',
    innerLeft + 1,
    statusY
  );


  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setTextColor(
    22,
    120,
    80
  );

  pdf.text(
    invoice.status || 'PAID',
    innerLeft + 27,
    statusY
  );


  // =====================================================
  // GST SUMMARY
  // =====================================================

  const summaryWidth =
    76;

  const summaryHeight =
    45;

  const summaryX =
    pageWidth -
    margin -
    3 -
    summaryWidth;

  const summaryY =
    finalY + 7;


  // Summary box

  pdf.setDrawColor(
    borderColor[0],
    borderColor[1],
    borderColor[2]
  );

  pdf.setLineWidth(0.3);

  pdf.roundedRect(
    summaryX,
    summaryY,
    summaryWidth,
    summaryHeight,
    1,
    1
  );


  // Purple title strip

  pdf.setFillColor(
    lightPurple[0],
    lightPurple[1],
    lightPurple[2]
  );

  pdf.rect(
    summaryX,
    summaryY,
    summaryWidth,
    8,
    'F'
  );


  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(7.5);

  pdf.setTextColor(
    purpleText[0],
    purpleText[1],
    purpleText[2]
  );

  pdf.text(
    'TAX SUMMARY',
    summaryX + 4,
    summaryY + 5.3
  );


  let summaryTextY =
    summaryY + 15;


  // =====================================================
  // CGST
  // =====================================================

  pdf.setFont(
    'helvetica',
    'normal'
  );

  pdf.setFontSize(7.8);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'CGST (9%):',
    summaryX + 4,
    summaryTextY
  );

  pdf.text(
    this.currency(
      invoice.cgst
    ),
    summaryX + summaryWidth - 4,
    summaryTextY,
    {
      align: 'right'
    }
  );


  summaryTextY += 6.5;


  // =====================================================
  // SGST
  // =====================================================

  pdf.text(
    'SGST (9%):',
    summaryX + 4,
    summaryTextY
  );

  pdf.text(
    this.currency(
      invoice.sgst
    ),
    summaryX + summaryWidth - 4,
    summaryTextY,
    {
      align: 'right'
    }
  );


  summaryTextY += 6.5;


  // =====================================================
  // TOTAL GST
  // =====================================================

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.text(
    'Total GST:',
    summaryX + 4,
    summaryTextY
  );

  pdf.text(
    this.currency(
      invoice.totalGst
    ),
    summaryX + summaryWidth - 4,
    summaryTextY,
    {
      align: 'right'
    }
  );


  summaryTextY += 4;


  // Separator

  pdf.setDrawColor(
    lightBorder[0],
    lightBorder[1],
    lightBorder[2]
  );

  pdf.line(
    summaryX + 4,
    summaryTextY,
    summaryX + summaryWidth - 4,
    summaryTextY
  );


  summaryTextY += 9;


  // =====================================================
  // GRAND TOTAL
  // =====================================================

  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(10);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'Grand Total:',
    summaryX + 4,
    summaryTextY
  );

  pdf.text(
    this.currency(
      invoice.grandTotal
    ),
    summaryX + summaryWidth - 4,
    summaryTextY,
    {
      align: 'right'
    }
  );


  // =====================================================
  // DECLARATION
  // =====================================================

  const declarationY =
    summaryY +
    summaryHeight +
    9;


  pdf.setFont(
    'helvetica',
    'bold'
  );

  pdf.setFontSize(7);

  pdf.setTextColor(
    darkText[0],
    darkText[1],
    darkText[2]
  );

  pdf.text(
    'Declaration:',
    innerLeft + 1,
    declarationY
  );


  pdf.setFont(
    'helvetica',
    'normal'
  );


  const declaration =
    'This is a system-generated invoice for the service fee charged towards credit card bill payment.';


  const declarationLines =
    pdf.splitTextToSize(
      declaration,
      contentWidth - 35
    );


  pdf.text(
    declarationLines,
    innerLeft + 26,
    declarationY
  );


  // =====================================================
  // FOOTER
  // =====================================================

  const footerLineY =
    pageHeight - 23;


  pdf.setDrawColor(
    lightBorder[0],
    lightBorder[1],
    lightBorder[2]
  );

  pdf.line(
    margin + 4,
    footerLineY - 4,
    pageWidth - margin - 4,
    footerLineY - 4
  );


  pdf.setFont(
    'helvetica',
    'normal'
  );

  pdf.setFontSize(6.8);

  pdf.setTextColor(
    mutedText[0],
    mutedText[1],
    mutedText[2]
  );


  pdf.text(
    'This is an auto generated invoice, no signature required.',
    pageWidth / 2,
    footerLineY,
    {
      align: 'center'
    }
  );


  pdf.text(
    'Scan the QR code to verify invoice details.',
    pageWidth / 2,
    footerLineY + 5,
    {
      align: 'center'
    }
  );


  // =====================================================
  // RETURN PDF
  // =====================================================

  return pdf;
}
}