import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
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
  @Output() closeEditUserOverlay = new EventEmitter<boolean>();
  testHeadFromFirestore$: any;
  currentTestHead: any;


  constructor(public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit(): void {
    this.loadDataFromLocalStorage();
    setTimeout(() => {
      this.setForm();
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
    })
  }

  checkLengthOfInput(event: any) {
    let inputvalue = event.target.value;
    if (inputvalue.length == 70) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Es sind max. 70 Zeichen erlaubt');

    }
    if (inputvalue.length < 70 && this.alertService.alert) {
      let alert = document.getElementById('alert');
      alert.innerHTML = '';
      this.alertService.alert = false;
    }
  }

  checkEmailInputValue(inputvalue: any) {
    console.log(inputvalue)
    let format_info = document.getElementById('email_adress');
    let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputvalue.match(mailformat)) {
      format_info.style.color = 'green'
    }
    else {
      format_info.style.color = '#FA5252'
    }
  }

  checkPasswordValue(inputvalue: any) {
    const passwordLengthInfo = document.getElementById('password_length');
    const numberInfo = document.getElementById('password_number');
    const uppercaseInfo = document.getElementById('password_uppercase');
     if (inputvalue.length >= 8) {
      passwordLengthInfo.style.color = 'rgb(80, 173, 108)';
    } else {
      passwordLengthInfo.style.color = '#FA5252';
    }

    if (inputvalue !== inputvalue.toLowerCase()) {
      uppercaseInfo.style.color = 'rgb(80, 173, 108)';
    } else {
      uppercaseInfo.style.color = '#FA5252';
    }

    if (/[0-9]/.test(inputvalue)) {
      numberInfo.style.color = 'rgb(80, 173, 108)';
    } else {
      numberInfo.style.color = '#FA5252';
    }
  }


}
