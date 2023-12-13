import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '../services/alert.service';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [dataTransferService, AlertService]
})
export class LoginComponent implements OnInit {

  @ViewChild('school') schoolInput: ElementRef;
  @ViewChild('email') emailInput: ElementRef;
  @ViewChild('password') passwordInput: ElementRef;
  @ViewChild('loginBtn') loginBtn: ElementRef;
  wrongEmailAdress: boolean = false;
  wrongPassword: boolean = false;
  schoolFound: boolean = false;
  allInputsFilled: boolean = false;
  logedIn: Boolean = false;
  loading: Boolean = false;
  loadedSchoolFromLocalStorage: any = null;

  constructor(public data: dataTransferService, private router: Router, public alertService: AlertService) { }

  ngOnInit(): void {
    this.checkIfUserDataAlreadyInLocalStorage();
  }

  /**
   * This function is used to check onload if subUserData exists in Local Storage => dashboard Component
   * When only the schoolData is available in LocalStorage => SchoolName will be added to inputfield directly on login
   */
  checkIfUserDataAlreadyInLocalStorage() {
    if (this.data.getUserDataFromLocalStorage()) {
      this.router.navigate(['dashboard']);
    } else {
      const data = localStorage.getItem('school')
      if (data) {
        this.loadedSchoolFromLocalStorage = JSON.parse(data);
        setTimeout(() => {
          this.schoolInput.nativeElement.value = this.loadedSchoolFromLocalStorage.school;
          this.checkIfSchoolExists(this.loadedSchoolFromLocalStorage.school)
        }, 200);
      }
    }
  }

  /**
   * This function is used to check on KEYUP if a School/asUser exists with dataTransferService function
   * SchoolName and Type will be added to Local Storage and email and password input get enabled
   * 
   * @param schule - inputvalue onkeyup from school Inputfield
   * @returns 
   */
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

  /**
   * This function is used to check if email and password inputfields are filled => submit button enabled
   * 
   * @param email - value of email inputfield
   * @param password - value of password inputfield
   * @returns before code will run
   */
  checkIfAllInputsFilled(email: string, password: string) {
    if (email.length != 0 && password.length != 0) {
      this.allInputsFilled = true;
      this.loginBtn.nativeElement.disabled = false;
      return
    }
    this.allInputsFilled = false;
    this.loginBtn.nativeElement.disabled = true;
  }

  /**
   * This function is used to try login with dataTransferService function 
   * If selected school has userdata of the inputfields email and password => dashboard component
   * On Error => Alertservice function with information
   * 
   * @param email - value of email inputfield
   * @param password - value of password inputfield
   */
  async login(email: string, password: string) {
    if (await this.data.checkIfUserExists(password, email)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Falsches Passwort oder Falsche Email Adresse');
      setTimeout(() => {
        this.alertService.alert = false;
      }, 4000);
    }
  }

  /**
   * This function is used to remove directly the alert information displayed
   * 
   */
  removeAlertInformation() {
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  navigateDemo() {
    this.router.navigate(['/demo']);
  }

}
