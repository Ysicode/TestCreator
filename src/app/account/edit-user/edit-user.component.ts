import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { user } from '@angular/fire/auth';
import { NgForm } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import { dataTransferService } from 'src/app/services/dataTransfer.service';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  providers: [AlertService, dataTransferService]
})
export class EditUserComponent implements OnInit {
  @Input() userEdit: any;
  @ViewChild('editUserForm') inputfields: NgForm;
  @ViewChild('email') email: ElementRef;
  @ViewChild('password') password: ElementRef;
  @ViewChild('submit_btn') submit_btn: ElementRef;
  @ViewChild('admin_checkbox') checkbox: ElementRef;
  @Output() closeEditUserOverlay = new EventEmitter<boolean>();

  newAdminIsChecked: Boolean = false;
  validPassword: Boolean;
  validEmailFormat: Boolean;
  infoOverlay: Boolean;

  constructor(public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit(): void {
    this.loadDataFromLocalStorage();
    setTimeout(() => {
      this.setForm();
    }, 800);

    setTimeout(() => {
      this.checkInputValuesOnInit();
    }, 1000);
  }

  async loadDataFromLocalStorage() {
    const data = localStorage.getItem('session');
    const { school, sessionId } = JSON.parse(data);
    this.data.currentSchool = school;
    this.data.currentUserID = sessionId;
  }

  closeEditUser() {
    this.closeEditUserOverlay.emit();
    this.alertService.alert = false;
  }

  setForm() {
    this.inputfields.setValue({
      firstname: this.userEdit.firstname,
      lastname: this.userEdit.lastname,
      email: this.userEdit.email,
      password: this.userEdit.password
    });
    if (this.userEdit.usertype === 'admin') {
      this.newAdminIsChecked = true; 
    }
  }

  checkLengthOfInput(event: any) {
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
  }

  checkInputValuesOnInit() {
    this.checkEmailInputValue(this.email.nativeElement.value);
    this.checkPasswordValue(this.password.nativeElement.value);

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

  checkPasswordValue(inputvalue: any) {
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
    if (this.validEmailFormat && this.validPassword) {
      this.submit_btn.nativeElement.disabled = false;
      this.submit_btn.nativeElement.style.opacity = '1';
    } else {
      this.submit_btn.nativeElement.disabled = true;
      this.submit_btn.nativeElement.style.opacity = '0.5';
    }
  }

  checkinput() {
    this.checkbox.nativeElement.checked = true;
    console.log('hello');
    console.log(this.checkbox.nativeElement.checked)
  }


}
