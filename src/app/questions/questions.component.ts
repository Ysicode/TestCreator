import { Component, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import { deleteDoc, setDoc, updateDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit {
  dataFromFirestore$: Observable<any>;
  loadedData = [];
  editMode = false;
  currentId: string;
  @ViewChild('questionForm') form: NgForm;

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.getData();
  }

  getData() {
    const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
    this.dataFromFirestore$ = collectionData(coll, { idField: 'id' })
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedData = data;
      console.log('Das sind die Daten vom Firestore', this.loadedData)
    })
   
  }

  addData(question: any) {
    if(!this.editMode) {
      const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
      setDoc(doc(coll), {
        fach: question.fach,
        frage: { frage: question.frage, antwort: question.antwort },
        klasse: question.klasse,
        punktzahl: Number(question.punktzahl),
        keywords: question.keywords.split(',')
      })
      this.editMode = false;
    } else {
      const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + this.currentId);
      updateDoc(coll, {
        fach: question.fach,
        frage: { frage: question.frage, antwort: question.antwort },
        klasse: question.klasse,
        punktzahl: Number(question.punktzahl),
        keywords: question.keywords.split(',')
      })
    }
    this.clearForm();
   
  }

  deletedata(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    deleteDoc(coll);
  }

  updateData(id: string) {
    this.currentId = id;
    this.editMode = true;
    let currentQuestion = this.loadedData.find((question) => {return question.id ===id});
    console.log(currentQuestion);
    
    this.form.setValue({
      fach: currentQuestion.fach,
      frage: currentQuestion.frage.frage, 
      antwort: currentQuestion.frage.antwort,
      klasse: currentQuestion.klasse,
      punktzahl: Number(currentQuestion.punktzahl),
      keywords: currentQuestion.keywords.join(', ')
    })
    
  }

  clearForm() {
    this.form.setValue({
      fach: '',
      frage: '', 
      antwort: '',
      klasse: '',
      punktzahl: '',
      keywords: '',
    })
  }

  logID(id: string) {
    console.log(id)
  }

}
