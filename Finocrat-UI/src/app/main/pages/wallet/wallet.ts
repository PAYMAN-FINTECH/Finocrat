import { Component } from '@angular/core';

@Component({
  selector: 'app-wallet',
  imports: [],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class WalletComponent {

  addFunds() {
    console.log('Add Funds clicked');
    // API call here
  }
}