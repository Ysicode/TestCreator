import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { dataTransferService } from 'src/app/services/dataTransfer.service';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
  providers: [dataTransferService]
})
export class DemoComponent implements OnInit {

  constructor(public data: dataTransferService, public router: Router) { }

  ngOnInit(): void {
    this.checkifSchoolexists();
  }

  async checkifSchoolexists() {
    if (await this.data.checkIfSchoolExists('Demoschule')) {
      this.login(); 
    }
  }

  async login() {
    if (await this.data.checkIfUserExists('Demo8000!', 'demo@test.de')) {
      this.router.navigate(['/dashboard']);
    }
  }
}
