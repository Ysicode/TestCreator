import { Component, OnInit } from '@angular/core';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [dataTransferService]
})
export class HeaderComponent implements OnInit {
  constructor(public data: dataTransferService) { }
  ngOnInit(): void {
    this.data.loadSubUserData();
  }

}
