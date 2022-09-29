import { Component, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import { collectionGroup, deleteDoc, setDoc, updateDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit {
  dataFromFirestore$: Observable<any>;
  loadedQuestions = [];
  loadedUserdata = [];
  loaded = false;

  selectedSubjectButton: number;
  selectedClassButton: number;
  currentSubjectChoice: string;
  currentClassChoice: string;
  newSubject = false;
  newClass = false;

  editMode = false;
  currentId: string;
  @ViewChild('questionForm') form: NgForm;

  public file: File = null;

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.getData();
  }

  chooseFile(event: any) {
    console.log(this.file.name);
    this.file = <File>event.target.files[0];
  }

  /**
   * This function is used to show the input field to set a new subject
   */
  showInputForNewSubject(type: string) {
    if (type == 'subject') {
      this.newSubject = true;
    } else {
      this.newClass = true;
    }
   
  }

  /**
   * This function is used to set
   * @param value : string of inputfield
   */
  addNewSubject(value: string) {
    this.loadedUserdata[0]['subjects'].push(value);
    document.getElementById('subjectInput').innerHTML = '';
    this.newSubject = false;  

    const coll: any = doc(this.firestore, '/users/JonasWeiss/subjects/' + this.loadedUserdata[0]['id']);
    updateDoc(coll, {
      subjects: this.loadedUserdata[0]['subjects']
    }
    )
  }

  choiceSubject(subjectChoice: any, index: number) {
    this.currentSubjectChoice = subjectChoice;
    this.selectedSubjectButton = index;
  }

  choiceClass(classChoice: any, index: number) {
    this.currentClassChoice = classChoice;
    this.selectedClassButton = index;
  }

  getData() {
    //gets all questions
    const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
    this.dataFromFirestore$ = collectionData(coll, { idField: 'id' })
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedQuestions = data;
    })

    //gets UserData like classes and subjects and email adress and username
    const subject: any = collection(this.firestore, '/users/JonasWeiss/subjects');
    this.dataFromFirestore$ = collectionData(subject, { idField: 'id' });
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedUserdata = data;
      console.log(this.loadedUserdata)
      this.loaded = true;
    });

  }

  deletedata(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    deleteDoc(coll);
  }

  addData(question: any) {
    if (!this.editMode) {
      const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
      setDoc(doc(coll), {
        fach: this.currentSubjectChoice,
        frage: { frage: question.frage, antwort: question.antwort },
        klasse: question.klasse,
        punktzahl: Number(question.punktzahl),
        keywords: question.keywords.split(',')
      })

    } else {
      const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + this.currentId);
      updateDoc(coll, {
        fach: this.currentSubjectChoice,
        frage: { frage: question.frage, antwort: question.antwort },
        klasse: question.klasse,
        punktzahl: Number(question.punktzahl),
        keywords: question.keywords.split(',')
      })
      this.editMode = false;
    }
    this.clearForm();

  }



  updateData(id: string) {
    this.currentId = id;
    this.editMode = true;
    let currentQuestion = this.loadedQuestions.find((question) => { return question.id === id });

    this.form.setValue({
      frage: currentQuestion.frage.frage,
      antwort: currentQuestion.frage.antwort,
      klasse: currentQuestion.klasse,
      punktzahl: Number(currentQuestion.punktzahl),
      keywords: currentQuestion.keywords.join(', ')
    })

  }

  clearForm() {
    this.form.setValue({
      frage: '',
      antwort: '',
      klasse: '',
      punktzahl: '',
      keywords: '',
    })
    this.selectedSubjectButton = -1;
  }

  logID(id: string) {
    console.log(id)
  }

}
