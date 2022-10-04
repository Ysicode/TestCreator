import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import List from '@editorjs/list';
import Table from '@editorjs/table';
import ImageTool from '@editorjs/image';
import { deleteDoc, setDoc, updateDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit, AfterViewInit {
  loading: Boolean = false;
  Checklist = require('@editorjs/checklist');
  Header = require('@editorjs/header');

  dataFromFirestore$: Observable<any>;
  loadedQuestions = [];
  loadedUserdata = [];
  loaded = false;

  answerVisible = false;
  addedToTest = [];

  currentQuestion: any;
  currentTable = {};

  selectedSubjectButton: number;
  selectedClassButton: number;
  currentSubjectChoice: string;
  currentClassChoice: string;
  newSubject = false;
  newClass = false;

  editMode = false;
  currentId: string;
  @ViewChild('questionForm') form: NgForm;

  @ViewChild('editor', { read: ElementRef, static: true })
  editorElement: ElementRef;
  private editor: EditorJS;

  currentTestPoints: number = 0;
  currentTestTime: number = 0;

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.getData();

 
  }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }



  private initializeEditor(): void {
    this.editor = new EditorJS({
      minHeight: 200,
      holder: this.editorElement.nativeElement,
      tools: {
        header: {
          class: this.Header,
          inlineToolbar: true,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3],
            defaultLevel: 2
          }
        },
        table: {
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 2,
          },
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: this.Checklist,
          inlineToolbar: true,
        },
        image: {
          class: ImageTool,
          config: {
            endpoints: {
              byUrl: 'gs://testcreator-e5281.appspot.com/'
            }
          }
        },

      }
    })
  }

  async saveEditorData(): Promise<void> {
    this.editor.save().then(data => {
      this.currentQuestion = data;
      for (let i = 0; i < data.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
        if (data.blocks[i].data.content) {
          this.currentQuestion['blocks'][i]['data']['table'] = {};
          for (let j = 0; j < data.blocks[i].data.content.length; j++) {
            this.currentQuestion['blocks'][i]['data']['table'][`${j}`] = data.blocks[i].data.content[j];
          }
          this.currentQuestion['blocks'][i]['data']['table']['length'] = Object.keys(this.currentQuestion['blocks'][i]['data']['table']);
        }
        this.currentQuestion['blocks'][i]['data']['content'] = 'deleted';
      }
      setTimeout(() => {
        console.log(this.currentQuestion);
      }, 1000)
    });

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
   * This function is used to get the value of the new subject input field and push it to the array
   * @param value : string of inputfield
   */
  addNewSubject(value: string) {
    if (!this.loadedUserdata[0]['subjects'].includes(value)) {
      this.loadedUserdata[0]['subjects'].push(value);
    }
    document.getElementById('subjectInput').innerHTML = '';
    this.newSubject = false;
    this.updateUserSubjectsAndClasses();
  }

  /**
  * This function is used to get the value of the new class input field and push it to the array
  * @param value : string of inputfield
  */
  addNewClass(value: string) {
    if (!this.loadedUserdata[0]['classes'].includes(value)) {
      this.loadedUserdata[0]['classes'].push(value);
    }
    document.getElementById('classInput').innerHTML = '';
    this.newClass = false;
    this.updateUserSubjectsAndClasses();
  }

  /**
   * This function is used to update firestore with the new data from an input field
   */
  updateUserSubjectsAndClasses() {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/subjects/' + this.loadedUserdata[0]['id']);
    updateDoc(coll, {
      classes: this.loadedUserdata[0]['classes'],
      subjects: this.loadedUserdata[0]['subjects']
    })
  }

  /**
   * 
   * @param subjectChoice This function is used to activate the clicked button
   * @param index : number of the clicked button
   */
  choiceSubject(subjectChoice: any, index: number) {
    this.currentSubjectChoice = subjectChoice;
    this.selectedSubjectButton = index;
  }

  /**
   * 
   * @param subjectChoice This function is used to activate the clicked button
   * @param index : number of the clicked button
   */
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
      console.log(data);

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
  this.saveEditorData();
  this.loading = true;
   setTimeout(() => {
    if (!this.editMode) {
      const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
      setDoc(doc(coll), {
        fach: this.currentSubjectChoice,
        frage: this.currentQuestion,
        antwort: 'Das ist eine Antwort',
        klasse: this.currentClassChoice,
        punktzahl: Number(question.punktzahl),
        bearbeitungszeit: Number(question.bearbeitungszeit),
        keywords: question.keywords.split(',')
      }).then(() => {
        this.loading = false;
      })
    } else {
      const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + this.currentId);
      updateDoc(coll, {
        fach: this.currentSubjectChoice,
        frage: { frage: question.frage, antwort: question.antwort },
        klasse: this.currentClassChoice,
        punktzahl: Number(question.punktzahl),
        bearbeitungszeit: Number(question.bearbeitungszeit),
        keywords: question.keywords.split(',')
      }).then(() => {
        this.loading = false;
      })
      this.editMode = false;
    }
    this.clearForm();
   }, 700);
  }



  updateData(id: string) {
    this.currentId = id;
    this.editMode = true;
    let currentQuestion = this.loadedQuestions.find((question) => { return question.id === id });

    this.form.setValue({
      bearbeitungszeit: `${currentQuestion.bearbeitungszeit}`,
      punktzahl: `${currentQuestion.punktzahl}`,
      keywords: currentQuestion.keywords.join(', ')
    });

  }

  clearForm() {
    this.form.setValue({
      punktzahl: '10',
      keywords: '',
      bearbeitungszeit: '7',
    })
    this.selectedSubjectButton = -1;
  }

  setForm() {
    this.form.setValue({
      punktzahl: '10',
      keywords: '',
      bearbeitungszeit: '7',
    });
  }

  logID(id: string) {
    console.log(id)
  }

  toggleAnswer(id: string) {
    if (this.currentId == id) {
      this.answerVisible = !this.answerVisible;
    } else {
      this.currentId = id;
    }
  }

  addToTest(id: string) {
    for (let i = 0; i < this.loadedQuestions.length; i++) {
      if (this.loadedQuestions[i]['id'] == id) {
        this.addedToTest.push(this.loadedQuestions[i]);
        console.log(this.addedToTest);
        document.getElementById('add_btn' + i).classList.add('d_none');
        document.getElementById('remove_btn' + i).classList.remove('d_none');
        this.setTestInfo();
      }
    }
  }

  removeFromTest(id: string) {
    for (let i = 0; i < this.addedToTest.length; i++) {
       if (this.addedToTest[i].id == id) {
        this.addedToTest.splice(i, 1);
        console.log(this.addedToTest);
        
        document.getElementById('add_btn' + i).classList.remove('d_none');
        document.getElementById('remove_btn' + i).classList.add('d_none');
        this.setTestInfo();
       }
    }
  }

  setTestInfo() {
    this.currentTestPoints = 0;
    this.currentTestTime = 0;
    for (let i = 0; i < this.addedToTest.length; i++) {
      this.currentTestTime += this.addedToTest[i].bearbeitungszeit; 
      this.currentTestPoints += this.addedToTest[i].punktzahl;  
    }
  }

}
