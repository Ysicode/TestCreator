import { Injectable } from "@angular/core";
import { collection, collectionData, Firestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";


@Injectable({providedIn: 'root'})

export class dataTransferService {
    loadedUserdata = [];
    loadedQuestions = [];
    subjectsAndClassesFromFirestore$: Observable<any>;
    questionsFromFirestore$: Observable<any>;
    testHeadFromFirestore$: Observable<any>;
    currentTestHead: any;
    loaded: Boolean;
    constructor(private firestore: Firestore) { }

/**
  * this function is used to load all subject and classes from firebase
  * and store it in a local object (loadedUserData)
  */
  async loadSubjectsAndClasses() {
    //gets UserData like classes and subjects and email adress and username
    const subject: any = collection(this.firestore, '/users/JonasWeiss/subjects');
    this.subjectsAndClassesFromFirestore$ = collectionData(subject, { idField: 'id' });
    this.subjectsAndClassesFromFirestore$.subscribe((data) => {
      this.loadedUserdata = data;
      this.loaded = true;
    });
  }

  async loadQuestions() {
    //gets all questions
    const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
    this.questionsFromFirestore$ = collectionData(coll, { idField: 'id' })
    this.questionsFromFirestore$.subscribe((data) => {
      this.loadedQuestions = data;
      this.loadedQuestions.sort((x, y) => {
        return y.frage.time - x.frage.time
      })
    }) 
  }

  /**
   * This function is used to load the current testHead from firebase
   * and store it in a local object (currenttestHead)
   */
   async loadtestHead() {
    const testHead: any = collection(this.firestore, '/users/JonasWeiss/testHead');
    this.testHeadFromFirestore$ = collectionData(testHead, { idField: 'id' });
    this.testHeadFromFirestore$.subscribe((data) => {
      this.currentTestHead = data;
      this.loaded = true;
    });
  }





}