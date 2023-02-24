import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-edit-testhead',
  templateUrl: './edit-testhead.component.html',
  styleUrls: ['./edit-testhead.component.scss'],
  providers: [AlertService, dataTransferService],
})
export class EditTestheadComponent implements OnInit {
  @ViewChild('editTestHeadForm') inputfields: NgForm;
  @Output() closeEditTestHeadOverlay = new EventEmitter<boolean>();
  testHeadFromFirestore$: any;
  currentTestHead: any;


  constructor(private firestore: Firestore, public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit(): void {
    this.loadtestHead();
  }

  closeEditTestHead() {
    this.closeEditTestHeadOverlay.emit();
    this.alertService.alert = false;
  }

  async loadtestHead() {
    // const testHead: any = collection(this.firestore, '/users/JonasWeiss/testHead');
    // this.testHeadFromFirestore$ = collectionData(testHead, { idField: 'id' });
    // this.testHeadFromFirestore$.subscribe((data: any) => {
    //   this.currentTestHead = data;
    //   console.log(this.currentTestHead);
    // });
    if (this.data.getUserDataFromLocalStorage()) {
      this.data.loadSubUserData().then(() => {
        this.setForm();
      })
    }
  }

  addData(data: any) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/subusers/' + this.data.currentUserID);
    updateDoc(coll, {
      testhead: {
        schoolname: data.schoolname,
        testname: data.testname,
        totaltime: data.totaltime,
        slogan: 'Viel Erfolg'
      }
    }).then(() => {
      window.scrollTo(0, 0);
      this.closeEditTestHead();
      this.data.loadSubUserData();
    })
  }

  setForm() {
    this.inputfields.setValue({
      schoolname: this.data.currentUserData.testhead.schoolname,
      testname: this.data.currentUserData.testhead.testname,
      totaltime: this.data.currentUserData.testhead.totaltime,
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


}
