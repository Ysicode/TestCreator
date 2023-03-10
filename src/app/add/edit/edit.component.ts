import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
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
import { AlertService } from 'src/app/services/alert.service';
import { dataTransferService } from 'src/app/services/dataTransfer.service';
import { analyticsInstanceFactory } from '@angular/fire/analytics/analytics.module';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [overlaysService, AlertService, dataTransferService],
})
export class EditComponent implements OnInit, AfterViewInit {
  dataFromFirestore$: Observable<any>;
  loadedUserdata = [];
  loadedQuestions = [];
  loaded: Boolean = false;
  loading: Boolean = false;
  currentId: string;

  @ViewChild('questionForm') form: NgForm;
  currentQuestion: any;
  currentAnswer: any;
  selectedClassButton: string;
  selectedSubjectButton: string;
  selectedDifficulty: any;
  currentKindOfQuestion: any;
  multipleChoiceEditor: Boolean = false;

  selectedKind = 'standard';


  @Input() editQuestion: any;
  @Input() editMode: Boolean;
  @Output() closeAddQuestionOverlay = new EventEmitter<boolean>();

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

  questionToEdit: any;

  Checklist = require('@editorjs/checklist');
  Marker = require('@editorjs/marker');

  constructor(private firestore: Firestore, public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit(): void {
    this.loadData();
    window.scrollTo(0, 0);
  }

  async loadData() {
    await this.loadDataFromLocalStorage();
    await this.data.loadSubUserData();
    setTimeout(() => {
      this.loaded = true;
    }, 100);
  }

  async loadDataFromLocalStorage() {
    const sessionData = localStorage.getItem('session');
    const schoolData = localStorage.getItem('school');
    const { school, sessionId } = JSON.parse(sessionData);
    const { schoolType } = JSON.parse(schoolData);

    this.data.currentSchool = school;
    this.data.currentUserID = sessionId;
    this.data.currentSchoolType = schoolType;
  }

  ngAfterViewInit(): void {
    this.initializeQuestionEditor();
    this.initializeAnswerEditor();
    this.initializeMultipleChoiceEditor();
    setTimeout(() => {
      this.setForm();
    }, 700);

  }

  async closeEditComponent() {
    await this.clearForm();
    this.closeAddQuestionOverlay.emit();
    window.scrollTo(0, 0);
  }

  validData() {
    if (!this.selectedSubjectButton) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte ein Fach wählen');
      return false
    }
    if (!this.selectedClassButton) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Klasse wählen');
      return false
    }
    if (!this.selectedDifficulty) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Schwierigkeit wählen');
      return false
    }
    if (this.currentAnswer.blocks.length == 0) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Lösung erstellen');
      return false
    }
    if (this.currentQuestion.blocks.length == 0) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Aufgabe erstellen');
      return false
    }
    else {
      return true
    }

  }

  toggleMultipleChoiceEditor() {
    this.multipleChoiceEditor = !this.multipleChoiceEditor;
  }

  initializeMultipleChoiceEditor() {
    if (this.editMode && this.editQuestion.kindOf === 'multipleChoice') {
      this.multiChoiceEditor = this.initMultipleChoiceEditor(this.multiChoiceEditorElement.nativeElement, this.editQuestion.frage);
    } else {
      this.multiChoiceEditor = this.initMultipleChoiceEditor(this.multiChoiceEditorElement.nativeElement, null);
    }
  }

  //Standard Questions Editor
  initializeQuestionEditor(): void {
    if (this.editMode && this.editQuestion.kindOf === 'standard') {
      this.questionEditor = this.initializeEditor(this.questionEditorElement.nativeElement, this.editQuestion.frage);
    } else {
      this.questionEditor = this.initializeEditor(this.questionEditorElement.nativeElement, null);
    }
  }

  //Standard Answer Editor
  initializeAnswerEditor(): void {
    if (this.editMode && this.editQuestion.kindOf === 'standard') {
    this.answerEditor = this.initializeEditor(this.answerEditorElement.nativeElement, this.editQuestion.antwort);
    } else {
      this.answerEditor = this.initializeEditor(this.answerEditorElement.nativeElement, null);
    }
  }


  /**
   * This function is used to set the form of the rangebars in the add question overlay to given values
   */
  setForm() {
    if (this.editMode) {
      this.form.setValue({
        punktzahl: this.editQuestion.punktzahl,
        keywords: this.editQuestion.keywords.toString(),
        bearbeitungszeit: this.editQuestion.bearbeitungszeit,
      });
      this.selectedSubjectButton = this.editQuestion.fach;
      this.selectedClassButton = this.editQuestion.klasse;
      this.selectedDifficulty = this.editQuestion.schwierigkeit;
      if (this.editQuestion.kindOf === 'multipleChoice') {
        this.selectedKind = 'multipleChoice';
        this.multipleChoiceEditor = true;
      }
    } else {
      this.form.setValue({
        punktzahl: '10',
        keywords: '',
        bearbeitungszeit: '7',
      });
    }
  }

  /**
  * 
  * @param subjectChoice This function is used to activate the clicked button
  * @param index : number of the clicked button
  */
  choiceSubject(subjectChoice: any) {
    this.selectedSubjectButton = subjectChoice;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  selectKind(selection: string) {
    this.selectedKind = selection;
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
  choiceClass(classChoice: any) {
    this.selectedClassButton = classChoice;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  /**
  * This function is used to set the form of the rangebars in the add question overlay to default
  */
  async clearForm() {
    this.form.setValue({
      punktzahl: '10',
      keywords: '',
      bearbeitungszeit: '7',
    })
    this.selectedSubjectButton = '';
    this.selectedClassButton = '';
    this.selectedKind = 'standard';
    this.selectedDifficulty = '';
    this.multipleChoiceEditor = false;
    this.editMode = false;
  }

  selectDifficulty(difficulty: string) {
    this.selectedDifficulty = difficulty;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  async addQuestion(questionFormData: any) {
    console.log('add')
    await this.saveEditorData();
    setTimeout(() => {
      if (this.validData()) {
        this.loading = true;
        const coll: any = collection(this.firestore, 'users', this.data.currentSchool, 'fragen');
        setDoc(doc(coll), {
          fach: this.selectedSubjectButton,
          frage: this.currentQuestion,
          antwort: this.currentAnswer,
          schwierigkeit: this.selectedDifficulty,
          klasse: this.selectedClassButton,
          punktzahl: Number(questionFormData.punktzahl),
          bearbeitungszeit: Number(questionFormData.bearbeitungszeit),
          kindOf: this.selectedKind,
          keywords: questionFormData.keywords.split(','),
          creatorId: this.data.currentUserID,
          schoolType: this.data.currentSchoolType,
          creationDate: Date.now(),
          lastEditDate: ''
        }).then(() => {
          this.clearForm();
          this.loading = false;
          this.closeEditComponent();
          this.multiChoiceEditor.clear();
        }).then(() => {
          this.questionEditor.clear();
        }).then(() => {
          this.answerEditor.clear();
          this.editMode = false;
        })
      }
    }, 700);

    console.log(this.currentQuestion)
  }

  async updateQuestion(questionFormData: any) {
    console.log('Edit')
    await this.saveEditorData();
    setTimeout(() => {
      if (this.validData()) {
        this.loading = true;
        const coll: any = doc(this.firestore, 'users', this.data.currentSchool, 'fragen', this.editQuestion.id);
        updateDoc(coll, {
          fach: this.selectedSubjectButton,
          frage: this.currentQuestion,
          antwort: this.currentAnswer,
          schwierigkeit: this.selectedDifficulty,
          klasse: this.selectedClassButton,
          punktzahl: Number(questionFormData.punktzahl),
          bearbeitungszeit: Number(questionFormData.bearbeitungszeit),
          kindOf: this.selectedKind,
          keywords: questionFormData.keywords.split(','),
          lastEditDate: Date.now()
        }).then(() => {
          this.clearForm();
          this.loading = false;
          this.closeEditComponent();
          this.multiChoiceEditor.clear();
        }).then(() => {
          this.questionEditor.clear();
        }).then(() => {
          this.answerEditor.clear();
          this.editMode = false;
        })
      }
      // else {
      //   const coll: any = doc(this.firestore, 'users', this.data.currentSchool, 'fragen' , this.currentId);
      //   updateDoc(coll, {
      //     fach: this.currentSubjectChoice,
      //     frage: { frage: questionFormData.frage, antwort: questionFormData.antwort },
      //     klasse: this.currentClassChoice,
      //     punktzahl: Number(questionFormData.punktzahl),
      //     bearbeitungszeit: Number(questionFormData.bearbeitungszeit),
      //     keywords: questionFormData.keywords.split(',')
      //   }).then(() => {
      //     this.loading = false;
      //     this.closeEditComponent();
      //   })

      // }

    }, 700);
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
      console.log('VOR TRANSFORM', this.questionEditor.save());
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
      });


      setTimeout(() => {
        console.log('NACH TRANSFORM', this.currentQuestion);
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
      // setTimeout(() => {
      //   console.log('Das ist die Antwort', this.currentAnswer);
      // }, 500);
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
  initializeEditor(htmlElement: any, editData: any) {
    return new EditorJS({
      minHeight: 100,
      holder: htmlElement,
      data: editData,
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

   //Multiple Choice
   initMultipleChoiceEditor(htmlElement: any, editData: any) {
    return new EditorJS({
      minHeight: 100,
      holder: htmlElement,
      data: editData,
      tools: {
        underline: Underline,
        checklist: {
          class: this.Checklist,
          inlineToolbar: true,
        }
      }
    });
  }

}
