import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import { dataTransferService } from 'src/app/services/dataTransfer.service';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  providers: [AlertService, dataTransferService]
})
export class AddUserComponent implements AfterViewInit {

  @ViewChild('addUserForm') inputfields: NgForm;
  @ViewChild('email') email: ElementRef;
  @ViewChild('password') password: ElementRef;
  @ViewChild('submit_btn') submit_btn: ElementRef;
  @Output() closeAddUserOverlay = new EventEmitter<boolean>();

  validPassword: Boolean;
  validEmailFormat: Boolean;
  validLastname: Boolean;
  validFirstname: Boolean;

  passwordVisible: Boolean = false;

  constructor(public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit() {
    this.data.getUserDataFromLocalStorage();
  }

  ngAfterViewInit(): void {
    this.checkEmailInputValue(this.email.nativeElement.value);
    this.checkPasswordValue(this.password.nativeElement.value);
  }
  

  closeAddUser() {
    this.closeAddUserOverlay.emit();
    this.alertService.alert = false;
  }

  checkLengthOfInput(event: any, inputfield: string) {
    let inputvalue = event.target.value;
    if (inputvalue.length == 30) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Es sind max. 30 Zeichen erlaubt');

    }
    if (inputvalue.length < 30 && this.alertService.alert) {
      let alert = document.getElementById('alert');
      alert.innerHTML = '';
      this.alertService.alert = false;
    }
    if (inputfield === 'firstname') {
      if (inputvalue.length >= 2) {
        this.validFirstname = true;
      } else {
        this.validFirstname = false;
      }
    }
    if (inputfield === 'lastname') {
      if (inputvalue.length >= 2) {
        this.validLastname = true;
      } else {
        this.validLastname = false;
      }
    }   
    this.handleSubmitButton();
  }

  checkEmailInputValue(inputvalue: any) {
    let format_info = document.getElementById('email_adress');
    let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputvalue.match(mailformat)) {
      format_info.style.color = 'rgb(80, 173, 108)';
      this.validEmailFormat = true;
    }
    else {
      format_info.style.color = '#FA5252';
      this.validEmailFormat = false;
    }
    this.handleSubmitButton();
  }

  checkPasswordValue(inputvalue: string) {
    const passwordLengthInfo = document.getElementById('password_length');
    const numberInfo = document.getElementById('password_number');
    const uppercaseInfo = document.getElementById('password_uppercase');
    let validlength: Boolean;
    let validNumber: Boolean;
    let validFormat: Boolean;

    if (inputvalue.length >= 8) {
      passwordLengthInfo.style.color = 'rgb(80, 173, 108)';
      validlength = true;
    } else {
      passwordLengthInfo.style.color = '#FA5252';
      validlength = false;
    }

    if (inputvalue !== inputvalue.toLowerCase()) {
      uppercaseInfo.style.color = 'rgb(80, 173, 108)';
      validFormat = true;
    } else {
      uppercaseInfo.style.color = '#FA5252';
      validFormat = false;
    }

    if (/[0-9]/.test(inputvalue)) {
      numberInfo.style.color = 'rgb(80, 173, 108)';
      validNumber = true;
    } else {
      numberInfo.style.color = '#FA5252';
      validNumber = false;
    }
    if (validlength && validNumber && validFormat) {
      this.validPassword = true;
    } else {
      this.validPassword = false;
    }
    this.handleSubmitButton();
  }

  handleSubmitButton() {
    if (this.validEmailFormat && this.validPassword && this.validFirstname && this.validLastname) {
      this.submit_btn.nativeElement.disabled = false;
      this.submit_btn.nativeElement.style.opacity = '1';
    } else {
      this.submit_btn.nativeElement.disabled = true;
      this.submit_btn.nativeElement.style.opacity = '0.5';
    }
  }

  showPassword() {
    console.log(this.passwordVisible)
    this.passwordVisible = !this.passwordVisible;
  }

}
