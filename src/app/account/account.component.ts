import { Component, OnInit } from '@angular/core';
import { AlertService } from '../services/alert.service';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-account',
  host: { class: 'd_flex' },
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [dataTransferService, AlertService]
})
export class AccountComponent implements OnInit {
  loading: Boolean = false;
  loaded: Boolean = false;
  newSubject: Boolean = false;
  newClass: Boolean = false;
  editUser: Boolean = false;
  user = {};

  constructor(public data: dataTransferService, public alertService: AlertService) { }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    await this.loadDataFromLocalStorage();
    await this.data.loadSubjectsAndClasses();
    await this.data.loadSubUserData();
    await this.data.loadSubUsers();
    await this.data.loadUSchoolData();

    setTimeout(() => {
      console.log(this.data.loadedSubUserData);
      this.loaded = true;
      this.loading = false;
    }, 500);
  }

  async loadDataFromLocalStorage() {
    const data = localStorage.getItem('session');
    const { school, sessionId } = JSON.parse(data);
    this.data.currentSchool = school;
    this.data.currentUserID = sessionId;
  }

  choiceSubject(subject: any) {
    let userSubjects = this.data.currentUserData['subjects'];
    if (userSubjects.includes(subject)) {
      userSubjects.splice(userSubjects.indexOf(subject), 1);
      this.data.updateSubUserSubjectsAndClasses();
      return
    }
    userSubjects.push(subject);
    this.data.updateSubUserSubjectsAndClasses();
  }

  findSelectedSubjects(subject: any) {
    if (this.data.currentUserData['subjects'].includes(subject)) {
      return true
    }
    return false
  }

  choiceClass(schoolclass: any) {
    let userClasses = this.data.currentUserData['classes'];
    if (userClasses.includes(schoolclass)) {
      userClasses.splice(userClasses.indexOf(schoolclass), 1);
      this.data.updateSubUserSubjectsAndClasses();
      return
    }
    userClasses.push(schoolclass);
    this.data.updateSubUserSubjectsAndClasses();
  }

  findSelectedClasses(schoolclass: any) {
    if (this.data.currentUserData['classes'].includes(schoolclass)) {
      return true
    }
    return false
  }

  /**
  * This function is used to get the value of the new subject input field and push it to the array
  * @param value : string of inputfield
  */
  addNewSubject(value: string) {
    if (!this.data.loadedUserdata[0]['subjects'].includes(value)) {
      this.data.loadedUserdata[0]['subjects'].push(value);
    }
    document.getElementById('subjectInput').innerHTML = '';
    this.newSubject = false;
    this.data.updateUserSubjectsAndClasses();
  }

  addNewClass(value: string) {
    if (!this.data.loadedUserdata[0]['classes'].includes(value)) {
      this.data.loadedUserdata[0]['classes'].push(value);
    }
    document.getElementById('classInput').innerHTML = '';
    this.newClass = false;
    this.data.updateUserSubjectsAndClasses();
  }

  showAddNewInput(type: string) {
    if (type == 'subject') {
      this.newSubject = true;
    } else {
      this.newClass = true;
    }
  }

  openEditUser(firstname: string, lastname: string, email: string, password: any, id: string) {
    this.user = {
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      id: id
    }
    this.editUser = true;
    console.log(this.user)
  }


}
