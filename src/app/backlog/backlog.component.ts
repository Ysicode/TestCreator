import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss'],
  providers: [dataTransferService]
})
export class BacklogComponent implements OnInit {

  constructor(public data: dataTransferService, private router: Router) { }

  ngOnInit(): void {
    this.checkPermissionToSeeBacklog();
  }

  checkPermissionToSeeBacklog() {
    const data = localStorage.getItem('school');
    const loadedSchoolFromLocalStorage = JSON.parse(data)

    if (!data || loadedSchoolFromLocalStorage.school !== 'JosiMasterschool2023!') {
      this.router.navigate(['login']);
    }
  }



}
