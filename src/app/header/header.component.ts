import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [dataTransferService]
})
export class HeaderComponent implements OnInit {
  constructor(public data: dataTransferService, private router: Router) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    if (this.data.getUserDataFromLocalStorage()) {
      this.data.loadSubUserData();
    } else {
      this.router.navigate(['login']);
    }
  }
}
