import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import { Observable } from 'rxjs';
import Underline from '@editorjs/underline';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Table from '@editorjs/table';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';
import { overlaysService } from 'src/app/services/overlays.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [overlaysService],
})
export class EditComponent implements OnInit, AfterViewInit {
  dataFromFirestore$: Observable<any>;
  loadedUserdata = [];
  loadedQuestions = [];
  loaded: Boolean = false;
  currentQuestion: any;
  currentAnswer: any;
  currentId: string;
  @ViewChild('questionForm') form: NgForm;
  @Output() closeAddQuestionOverlay = new EventEmitter<boolean>();
  selectedSubjectButton: number;
  selectedClassButton: number;
  currentSubjectChoice: string;
  currentClassChoice: string;
  currentDifficulty: any;
  newSubject: Boolean = false;
  newClass: Boolean = false;
  editMode: Boolean = false;
  multipleChoiceEditor: Boolean = false;
  

  // EditorJS
  @ViewChild('questionEditor', { read: ElementRef, static: true })
  questionEditorElement: ElementRef;
  questionEditor: EditorJS;

  @ViewChild('answerEditor', { read: ElementRef, static: true })
  answerEditorElement: ElementRef;
  answerEditor: EditorJS;

  @ViewChild('multiChoiceEditor', { read: ElementRef, static: true })
  multiChoiceEditorElement: ElementRef;
  multiChoiceEditor: EditorJS;

  Checklist = require('@editorjs/checklist');
  Marker = require('@editorjs/marker');
  constructor(private firestore: Firestore, private storage: Storage, public service: overlaysService) { }

  ngOnInit(): void {
    this.loadSubjectsAndClasses();
    this.service.windowScrollTop();
  }

  ngAfterViewInit(): void {
    this.initializeQuestionEditor();
    this.initializeAnswerEditor();
    this.initializeMultipleChoiceEditor();
    setTimeout(() => {
      this.setForm();
    }, 700);
   
  }

  closeEditComponent() {
    this.closeAddQuestionOverlay.emit();
    this.service.windowScrollTop();
    this.clearForm();
    this.currentDifficulty = '';
  }

  toggleMultipleChoiceEditor() {
    this.multipleChoiceEditor = !this.multipleChoiceEditor;
  }

  //Standard Questions Editor
  initializeMultipleChoiceEditor(): void {
    this.multiChoiceEditor = new EditorJS({
      minHeight: 100,
      holder: this.multiChoiceEditorElement.nativeElement,
      tools: {
        underline: Underline,
        checklist: {
          class: this.Checklist,
          inlineToolbar: true,
        }
      }
    });
  }

  //Standard Questions Editor
  initializeQuestionEditor(): void {
    this.questionEditor = this.initializeEditor(this.questionEditorElement.nativeElement);  
  }

   //Standard Answer Editor
   initializeAnswerEditor(): void {
    this.answerEditor = this.initializeEditor(this.answerEditorElement.nativeElement);
  }


  /**
   * This function is used to set the form of the rangebars in the add question overlay to given values
   */
  setForm() {
    this.form.setValue({
      punktzahl: '10',
      keywords: '',
      bearbeitungszeit: '7',
    });
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
  choiceClass(classChoice: any, index: number) {
    this.currentClassChoice = classChoice;
    this.selectedClassButton = index;
  }

  /**
  * This function is used to set the form of the rangebars in the add question overlay to default
  */
  clearForm() {
    this.form.setValue({
      punktzahl: '10',
      keywords: '',
      bearbeitungszeit: '7',
    })
    this.selectedSubjectButton = -1;
    this.selectedClassButton = -1;
  }

  selectDifficulty(difficulty: string) {
    this.currentDifficulty = difficulty;
  }

  async addData(question: any) {
    this.service.loading = true;
    await this.saveEditorData();
    setTimeout(() => {
      if (!this.editMode) {
        const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
        setDoc(doc(coll), {
          fach: this.currentSubjectChoice,
          frage: this.currentQuestion,
          antwort: this.currentAnswer,
          schwierigkeit: this.currentDifficulty,
          klasse: this.currentClassChoice,
          punktzahl: Number(question.punktzahl),
          bearbeitungszeit: Number(question.bearbeitungszeit),
          keywords: question.keywords.split(',')
        }).then(() => {
          this.service.loading = false;
          this.closeEditComponent();
          this.multiChoiceEditor.clear();
        }).then(() => {
          this.questionEditor.clear();
        }).then(() => {
          this.answerEditor.clear();
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
          this.service.loading = false;
          this.closeEditComponent();
        })
        this.editMode = false;
      }
    }, 700);
  }

  //Das muss noch gemacht werden!!!!!!!!! Edit function
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

  /**
   * As firebase cant save nested arrays
   * this function is used to save a table as an object
   */
  async saveEditorData(): Promise<void> {
    if (this.multipleChoiceEditor) {
      this.multiChoiceEditor.save().then(data => {
        this.currentQuestion = data;
        this.currentAnswer = data;
      });
      setTimeout(() => {
        console.log('Das ist Multi Chopice', this.currentQuestion, this.currentAnswer);
      }, 500);
    }

    if (!this.multipleChoiceEditor) {
      this.questionEditor.save().then(data => {
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
        this.questionEditor.clear();
      });
      setTimeout(() => {
        console.log('Das ist die Aufgabe', this.currentQuestion);
      }, 200);
  
      this.answerEditor.save().then(data => {
        this.currentAnswer = data;
        for (let i = 0; i < data.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
          if (data.blocks[i].data.content) {
            this.currentAnswer['blocks'][i]['data']['table'] = {};
            for (let j = 0; j < data.blocks[i].data.content.length; j++) {
              this.currentAnswer['blocks'][i]['data']['table'][`${j}`] = data.blocks[i].data.content[j];
            }
            this.currentAnswer['blocks'][i]['data']['table']['length'] = Object.keys(this.currentAnswer['blocks'][i]['data']['table']);
          }
          this.currentAnswer['blocks'][i]['data']['content'] = 'deleted';
        }
      });
      setTimeout(() => {
        console.log('Das ist die Antwort', this.currentAnswer);
       
      }, 500);
    }  
  }


  /**
  * this function is used to load all subject and classes from firebase
  * and store it in a local object (loadedUserData)
  */
  async loadSubjectsAndClasses() {
    //gets UserData like classes and subjects and email adress and username
    const subject: any = collection(this.firestore, '/users/JonasWeiss/subjects');
    this.dataFromFirestore$ = collectionData(subject, { idField: 'id' });
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedUserdata = data;
      this.loaded = true;
    });
  }

  /**
   * This function is used to initialize the editors for create a question and an answer
   * @param htmlElement - This parameter is used to set the holder of the editor 
   * @returns the Editor with all configs
   */
  initializeEditor(htmlElement: any) {
    return  new EditorJS({
        minHeight: 100,
        holder: htmlElement,
        tools: {
          underline: Underline,
          Marker: {
            class: this.Marker,
            shortcut: 'CMD+SHIFT+M',
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
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: any) {
                  const storage = getStorage();
                  const storageRef = ref(storage, file.name);
                  const metadata = {
                    contentType: 'image/jpeg',
                    size: file.size,
                  };
                  const snapshot = await uploadBytes(storageRef, file, metadata);
                  const downloadURL = await getDownloadURL(snapshot.ref);
                  return {
                    success: 1,
                    file: {
                      url: downloadURL,
                      size: file.size,
                    }
                  };
                }
              }
            }
          },
        }
      });
    }

}
