import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { collection, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import Underline from '@editorjs/underline';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Table from '@editorjs/table';
import AttachesTool from '@editorjs/attaches';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { overlaysService } from 'src/app/services/overlays.service';
import { AlertService } from 'src/app/services/alert.service';
import { dataTransferService } from 'src/app/services/dataTransfer.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [overlaysService, AlertService, dataTransferService],
})
export class EditComponent implements OnInit, AfterViewInit {

  loaded: Boolean = false;
  loading: Boolean = false;

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
  @Input() editFromTest: Boolean;
  @Output() closeAddQuestionOverlay = new EventEmitter<boolean>();
  @Output() editQuestionForLocalStorage = new EventEmitter<any>();

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

  // Scroll Position From Test
  @ViewChild('scrollPositionOpenedFromTest') scrollPosition: ElementRef;

  Checklist = require('@editorjs/checklist');
  Marker = require('@editorjs/marker');

  constructor(private firestore: Firestore, public alertService: AlertService, public data: dataTransferService) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initializeQuestionEditor();
    this.initializeAnswerEditor();
    this.initializeMultipleChoiceEditor();
    setTimeout(() => {
      this.setForm();
    }, 700);
    if (this.editFromTest) {
      this.scrollPosition.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('hello');
      
    } else {
      window.scrollTo(0, 0);
    }
  }

  /**
   * This function is used to call functions loading Data
   * dataTransferService function is used to load subuserdata like subjects and classes
   */
  async loadData() {
    await this.loadDataFromLocalStorage();
    await this.data.loadSubUserData();
    setTimeout(() => {
      this.loaded = true;
    }, 100);
  }

  /**
   * This function is used to load current user- and schoolData from local storage
   */
  async loadDataFromLocalStorage() {
    const sessionData = localStorage.getItem('session');
    const schoolData = localStorage.getItem('school');
    const { school, sessionId } = JSON.parse(sessionData);
    const { schoolType } = JSON.parse(schoolData);

    this.data.currentSchool = school;
    this.data.currentUserID = sessionId;
    this.data.currentSchoolType = schoolType;
  }

  /**
   * This fucntion is used to close the edit component
   */
  async closeEditComponent() {
    await this.clearForm();
    this.closeAddQuestionOverlay.emit();

    if (this.editFromTest) {
      this.editQuestionForLocalStorage.emit(this.editQuestion);
    }
    window.scrollTo(0, 0);
  }



  /**
   * This function is used to show alert with AlertService function when invalid form data is provided on submit
   * 
   * @returns - false if invalid form data
   */
  validData() {
    if (!this.selectedSubjectButton) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte ein Fach wählen!');
      return false
    }
    if (!this.selectedClassButton) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Klasse wählen!');
      return false
    }
    if (this.currentQuestion.blocks.length == 0) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Aufgabe erstellen!');
      return false
    }
    if (this.currentAnswer.blocks.length == 0) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Lösung erstellen!');
      return false
    }
    if (this.multipleChoiceEditor && !this.checklistIsSelected()) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Multiple Choice Aufgabe erstellen!');
      return false
    }
    if (this.multipleChoiceEditor && !this.checklistIsChecked()) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Lösung anklicken!');
      return false
    }
    if (!this.selectedDifficulty) {
      this.alertService.alert = true;
      let alert = document.getElementById('alert');
      alert.innerHTML = this.alertService.showAlert('Bitte eine Schwierigkeit wählen!');
      return false
    }
    else {
      return true
    }
  }

  /**
   * This function is used to check when multiple choice editor is selceted, if a block is a checklist
   * 
   * @returns boolean 
   */
  checklistIsSelected() {
    for (let i = 0; i < this.currentAnswer.blocks.length; i++) {
      if (this.currentAnswer.blocks[i].type == 'checklist') {
        return true
      }
    }
    return false
  }

  /**
   * This function is used to check when multiple choice editor is sselected, if one item of the checklist is CHECKED
   * 
   * @returns boolean
   */
  checklistIsChecked() {
    for (let i = 0; i < this.currentAnswer.blocks.length; i++) {
      if (this.currentAnswer.blocks[i].type == 'checklist') {
        for (let j = 0; j < this.currentAnswer.blocks[i].data.items.length; j++) {
          if (this.currentAnswer.blocks[i].data.items[j].checked == true) {
            return true;
          }
        }
      }
    }
    return false
  }

  /**
   * This function is used to toggle between the Editors (question, answer) and multiple choice Editor 
   */
  toggleMultipleChoiceEditor() {
    this.multipleChoiceEditor = !this.multipleChoiceEditor;
  }

  /**
   * This function is used to initialize the Editor for a multiple choice question
   */
  initializeMultipleChoiceEditor() {
    if (this.editMode && this.editQuestion.kindOf === 'multipleChoice') {
      this.multiChoiceEditor = this.initMultipleChoiceEditor(this.multiChoiceEditorElement.nativeElement, this.editQuestion.frage);
    } else {
      this.multiChoiceEditor = this.initMultipleChoiceEditor(this.multiChoiceEditorElement.nativeElement, null);
    }
  }

  /**
   * This function is used to initialize the Editor for a question
   */
  async initializeQuestionEditor() {
    if (this.editMode && this.editQuestion.kindOf === 'standard') {
      await this.reTransformQuestionToEditorFormat();
      this.questionEditor = this.initializeEditor(this.questionEditorElement.nativeElement, this.editQuestion.frage);
    } else {
      this.questionEditor = this.initializeEditor(this.questionEditorElement.nativeElement, null);
    }
  }

  /**
   * This functio is used to initialize the Editor for an answer
   */
  async initializeAnswerEditor() {
    if (this.editMode && this.editQuestion.kindOf === 'standard') {
      await this.reTransformAnswerToEditorFormat();
      this.answerEditor = this.initializeEditor(this.answerEditorElement.nativeElement, this.editQuestion.antwort);
    } else {
      this.answerEditor = this.initializeEditor(this.answerEditorElement.nativeElement, null);
    }
  }


  /**
   * This function is used to set the values of rangebars (punktzahl & bearbeitungszeit) and keywords
   * On Edit mode subject, class, difficulty and editor will be set as well
   */
  async setForm() {
    if (this.editMode) {

      this.selectedSubjectButton = this.editQuestion.fach;
      this.selectedClassButton = this.editQuestion.klasse;
      this.selectedDifficulty = this.editQuestion.schwierigkeit;

      if (this.editQuestion.kindOf === 'multipleChoice') {
        this.selectedKind = 'multipleChoice';
        this.multipleChoiceEditor = true;
      }

      if (this.editFromTest) {
        this.form.setValue({
          punktzahl: this.editQuestion.punktzahl,
          keywords: this.editQuestion.keywords.toString(),
          bearbeitungszeit: this.editQuestion.bearbeitungszeit,
          saveDataFromTestCheckbox: false
        });
      }

      if (!this.editFromTest) {
        this.form.setValue({
          punktzahl: this.editQuestion.punktzahl,
          keywords: this.editQuestion.keywords.toString(),
          bearbeitungszeit: this.editQuestion.bearbeitungszeit,
        });
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
  * This function is used to activate the selected subject button
  * 
  * @param subjectChoice - subject selection
  */
  choiceSubject(subjectChoice: any) {
    this.selectedSubjectButton = subjectChoice;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  /**
  * This function is used to activate the selected class button
  * 
  * @param subjectChoice - class selection
  */
  choiceClass(classChoice: any) {
    this.selectedClassButton = classChoice;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  /**
 * This function is used to activate the selected kind of question Editor
 * 
 * @param selection - standard or multiple choice
 */
  selectKind(selection: string) {
    this.selectedKind = selection;
  }

  /**
  * This function is used to clear all forms and selctions when the edit component closed
  */
  async clearForm() {
    if (!this.editFromTest) {
      this.form.setValue({
        punktzahl: '10',
        keywords: '',
        bearbeitungszeit: '7',
      })
    }
    if (this.editFromTest) {
      this.form.setValue({
        punktzahl: '10',
        keywords: '',
        bearbeitungszeit: '7',
        saveDataFromTestCheckbox: false
      })
    }
    this.selectedSubjectButton = '';
    this.selectedClassButton = '';
    this.selectedKind = 'standard';
    this.selectedDifficulty = '';
    this.multipleChoiceEditor = false;
    this.editMode = false;
  }

  /**
   * Thjis function is used to activate the selceted difficulty button
   * 
   * @param difficulty - difficulty selection
   */
  selectDifficulty(difficulty: string) {
    this.selectedDifficulty = difficulty;
    if (this.alertService.alert) {
      this.alertService.alert = false;
    }
  }

  /**
   * This function is used to save all data from the edit comp (erstelle Frage) in firebase to collection fragen of the school
   * 
   * @param questionFormData - data from the questionForm
   */
  async addQuestion(questionFormData: any) {
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
          whitespace: '',
          questionHeight: '',
          defaultHeight: '',
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
      console.log(this.currentQuestion, this.currentAnswer)
    }, 1000);
  }

  /**
   * This function is used to update question data from the before loaded question data in firebase in collection fragen with current doc ID (this.editQuestion.id)
   * 
   * @param questionFormData - data from the questionForm
   */
  async updateQuestion(questionFormData: any) {
    await this.saveEditorData();
    setTimeout(() => {
      if (this.validData()) {

        if (this.editFromTest) {
          console.log(questionFormData.saveDataFromTestCheckbox);

          this.editQuestion.antwort = this.currentAnswer;
          this.editQuestion.bearbeitungszeit = Number(questionFormData.bearbeitungszeit);
          this.editQuestion.fach = this.selectedSubjectButton;
          this.editQuestion.frage = this.currentQuestion;
          this.editQuestion.keywords = questionFormData.keywords.split(',');
          this.editQuestion.kindOf = this.selectedKind;
          this.editQuestion.klasse = this.selectedClassButton;
          this.editQuestion.schwierigkeit = this.selectedDifficulty;

          if (questionFormData.saveDataFromTestCheckbox) {
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
              defaultHeight: '',
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
          if (!questionFormData.saveDataFromTestCheckbox) {
            this.clearForm();
            this.loading = false;
            this.closeEditComponent();
            this.multiChoiceEditor.clear();
            this.questionEditor.clear();
            this.answerEditor.clear();
            this.editMode = false;
          }

        } else {
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
            defaultHeight: '',
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


      }
    }, 1000);
  }


  /**
   * As firebase cant save nested arrays, this function is used transform a table [Array] in an object with key-values as Array
   */
  async saveEditorData() {
    if (this.multipleChoiceEditor) {
      this.multiChoiceEditor.save().then(data => {
        this.currentQuestion = data;
        this.currentAnswer = data;
      });
    } else {
      await this.transformQuestionToFirebaseFormat();
      await this.transformAnswerToFirebaseFormat();
    }

  }

  /**
   * This function is used to check if a question has a table 
   * => transform the question table as object with keys and each array as value
   */
  async transformQuestionToFirebaseFormat() {
    this.questionEditor.save().then(data => {
      this.currentQuestion = data;

      for (let i = 0; i < data.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
        if (data.blocks[i].data.content) {
          this.currentQuestion['blocks'][i]['data']['table'] = {};
          for (let j = 0; j < data.blocks[i].data.content.length; j++) {
            this.currentQuestion['blocks'][i]['data']['table'][`${j}`] = data.blocks[i].data.content[j];
          }
          this.currentQuestion['blocks'][i]['data']['table']['length'] = Object.keys(this.currentQuestion['blocks'][i]['data']['table']);
          this.currentQuestion['blocks'][i]['data']['content'] = 'deleted';
        }
      }
    });
  }

  /**
   * This function is used to check if an answer has a table 
   * => transform the question table as object with keys and each array as value
   */
  async transformAnswerToFirebaseFormat() {
    await this.answerEditor.save().then(data => {
      this.currentAnswer = data;

      for (let i = 0; i < data.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
        if (data.blocks[i].data.content) {
          this.currentAnswer['blocks'][i]['data']['table'] = {};
          for (let j = 0; j < data.blocks[i].data.content.length; j++) {
            this.currentAnswer['blocks'][i]['data']['table'][`${j}`] = data.blocks[i].data.content[j];
          }
          this.currentAnswer['blocks'][i]['data']['table']['length'] = Object.keys(this.currentAnswer['blocks'][i]['data']['table']);
          this.currentAnswer['blocks'][i]['data']['content'] = 'deleted';
        }
      }
    });
  }

  /**
   * ONLY ON EDIT MODE - This function is used to check if a loaded question has a table format 
   * => The values of each table Object keys will be pushed into content array 
   * => nested Array
   */
  async reTransformAnswerToEditorFormat() {
    for (let i = 0; i < this.editQuestion.antwort.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
      if (this.editQuestion.antwort.blocks[i].data.table) {
        this.editQuestion.antwort.blocks[i].data.content = [];

        for (let key in this.editQuestion.antwort.blocks[i].data.table) {
          if (key !== 'length') {
            this.editQuestion.antwort.blocks[i].data.content.push(this.editQuestion.antwort.blocks[i].data.table[key])
          }
        }
        delete this.editQuestion.antwort.blocks[i].data.table
      }
    }
  }

  /**
   * * ONLY ON EDIT MODE - This function is used to check if a loaded answer has a table format 
   * => The values of each table Object keys will be pushed into content array 
   * => nested Array
   */
  async reTransformQuestionToEditorFormat() {
    for (let i = 0; i < this.editQuestion.frage.blocks.length; i++) { //If a table was in use of the editor nested array cannot saved in firestore
      if (this.editQuestion.frage.blocks[i].data.table) {
        this.editQuestion.frage.blocks[i].data.content = [];

        for (let key in this.editQuestion.frage.blocks[i].data.table) {
          if (key !== 'length') {
            this.editQuestion.frage.blocks[i].data.content.push(this.editQuestion.frage.blocks[i].data.table[key])
          }
        }
        delete this.editQuestion.frage.blocks[i].data.table
      }
    }
  }


  /**
   * This function is used to initialize the Editors (question, answer)
   * 
   * @param htmlElement - This parameter is used to set the holder of the Editor 
   * @param editData - This parameter is the data should be displayed in the Editor when initialize. On Editmode the data of the question will be displayed
   * @returns - the Editor with all configs
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
        attaches: {
          class: AttachesTool,
          config: {
            uploader: {
              async uploadByFile(file: any) {
                const storage = getStorage();
                const storageRef = ref(storage, file.name);
                const snapshot = await uploadBytes(storageRef, file);
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
        }
      }
    });
  }

  /**
   * This function is used to initialize the Editors (multipleChoice)
   * 
   * @param htmlElement - This parameter is used to set the holder of the Editor 
   * @param editData - This parameter is the data should be displayed in the Editor when initialize. On Editmode the data of the question will be displayed
   * @returns - the Editor with all configs
   */
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
