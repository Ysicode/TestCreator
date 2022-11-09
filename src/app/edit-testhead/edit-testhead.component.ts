import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-testhead',
  templateUrl: './edit-testhead.component.html',
  styleUrls: ['./edit-testhead.component.scss']
})
export class EditTestheadComponent implements OnInit {
  @ViewChild('editTestHeadForm') inputfields: NgForm;
  @Output() closeEditTestHeadOverlay = new EventEmitter<boolean>();
  testHeadFromFirestore$: any;
  currentTestHead: any;


  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.loadtestHead();
    setTimeout(() => {
      this.setForm();
    }, 50);
  }

  closeEditTestHead() {
    this.closeEditTestHeadOverlay.emit();
  }

  async loadtestHead() {
    const testHead: any = collection(this.firestore, '/users/JonasWeiss/testHead');
    this.testHeadFromFirestore$ = collectionData(testHead, { idField: 'id' });
    this.testHeadFromFirestore$.subscribe((data: any) => {
      this.currentTestHead = data;
    });
  }

  addData(data: any) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/testHead/' + this.currentTestHead[0].id);
    updateDoc(coll, {
      schoolname: data.schoolname,
      testname: data.testname,
      totaltime: data.totaltime,
      slogan: 'Viel Erfolg'
    }).then(() => {
      window.scrollTo(0, 0);
      this.closeEditTestHead();
    })  
  }

setForm() {
  this.inputfields.setValue({
    schoolname: this.currentTestHead[0].schoolname,
    testname: this.currentTestHead[0].testname,
    totaltime: this.currentTestHead[0].totaltime,
  })
}
  

}
