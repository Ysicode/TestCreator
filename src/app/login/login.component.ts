import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [dataTransferService]
})
export class LoginComponent implements OnInit {

  @ViewChild('email') emailInput: ElementRef;
  @ViewChild('password') passwordInput: ElementRef;

  wrongEmailAdress: boolean = false;
  wrongPassword: boolean = false;
  schoolFound: boolean = false;
  logedIn: Boolean = false;
  loading: Boolean = false;


  constructor(public data: dataTransferService, private router: Router) { }

  ngOnInit(): void {
    this.checkIfUserDataAlreadyInLocalStorage();
  }

  checkIfUserDataAlreadyInLocalStorage() {
    if (this.data.getUserDataFromLocalStorage()) {
      this.router.navigate(['dashboard']);
    }
  }

  async checkIfSchoolExists(schule: string) {
    this.wrongPassword = false;
    this.schoolFound = false;
    if (schule == '') return
    if (await this.data.checkIfSchoolExists(schule)) {
      this.schoolFound = true;
      this.passwordInput.nativeElement.disabled = false;
      this.emailInput.nativeElement.disabled = false;
    } else {
      this.passwordInput.nativeElement.disabled = true;
      this.emailInput.nativeElement.disabled = true;
    }
  }

  async login(email: string, password: string) {
    if (await this.data.checkIfUserExists(password, email)) {
      this.router.navigate(['/dashboard']);
      console.log('Du wirst jetzt weitergeleitet');
    } else {
      console.log('Falsches Passwort oder Falsche Email Adresse');
    }

  }

}
