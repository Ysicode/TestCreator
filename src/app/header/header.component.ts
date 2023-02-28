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
  infoOverlay: boolean = false;
  currentTestFromLocalStorage = [];
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

  checkLengthOfCurrentTest() {
    let loadedAddedQuestions = localStorage.getItem('addedQuestions');
    this.currentTestFromLocalStorage = JSON.parse(loadedAddedQuestions);
    if (this.currentTestFromLocalStorage) {
      if (this.currentTestFromLocalStorage.length != 0) {
        this.infoOverlay = true;
      }
    }
  }

}
