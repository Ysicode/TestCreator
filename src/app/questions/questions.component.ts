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
    console.log(question.keywords.split(','))
    const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
    setDoc(doc(coll), {
      fach: question.fach,
      frage: { frage: question.frage, antwort: question.antwort },
      klasse: question.klasse,
      punktzahl: Number(question.punktzahl),
      keywords: question.keywords.split(',')
    })
  }

  deletedata(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    deleteDoc(coll);
  }

  updateData(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    updateDoc(coll, {
      fach: 'Fach gändert',
      frage: { frage: 'Frage geändert', antwort: 'Antwort geändert' },
      klasse: 'Klasse geändert',
      punktzahl: 1,
      keywords: ['keyword1', 'keyword2', 'keyword3']
    })
  }

  logID(id: string) {
    console.log(id)
  }

}
