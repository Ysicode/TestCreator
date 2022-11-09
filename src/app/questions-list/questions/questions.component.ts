import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { Storage, ref, getDownloadURL, getStorage, uploadBytes } from '@angular/fire/storage';
import { NgForm } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import Underline from '@editorjs/underline';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Table from '@editorjs/table';
import { deleteDoc, setDoc, updateDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  providers: [firebaseService]
})
export class QuestionsComponent implements OnInit, AfterViewInit {

  //variables for the Questions list view
  loading: Boolean = false;
  dataFromFirestore$: Observable<any>;
  testHeadFromFirestore$: Observable<any>;
  loadedQuestions = [];
  loadedUserdata = [];
  loaded = false;

  answerVisible = false;
  currentQuestion: any;
  currentAnswer: any;
  currentTable = {};
  currentId: string;

  // variables for the new question window
  @ViewChild("rangeSliderForm") rangebars: NgForm;
  Checklist = require('@editorjs/checklist');
  @ViewChild('questionForm') form: NgForm;

  @ViewChild('questionEditor', { read: ElementRef, static: true })
  questionEditorElement: ElementRef;
  private questionEditor: EditorJS;

  @ViewChild('answerEditor', { read: ElementRef, static: true })
  answerEditorElement: ElementRef;
  private answerEditor: EditorJS;

  selectedSubjectButton: number;
  selectedClassButton: number;
  currentSubjectChoice: string;
  currentClassChoice: string;
  newSubject = false;
  newClass = false;

  editMode = false;
  overlay = false;

  //multi used variables
  currentTestPoints: number = 0;
  currentTestTime: number = 0;

  //variables for the preview window
  addedToTest = [];
  currentTestHead: any;
  dinA4Pages = [];
  preview = false;
  editQuestionAtPreview = false;
  editImageAtPreview = false;
  public editTesthead = false;
  currentEditContainer: string;
  heightOfAllPreviewQuestions = 0;
  test = {
    pages: <any>[{
      0: [],
    },
    ]
  };

  //help variables
  wrongPassword: boolean = false;
  logedIn: Boolean = false;
  file: any;

  question_number = 0;

  constructor(private firestore: Firestore, private storage: Storage, private service: firebaseService) { }

  login(password: string) {
    if (password == 'superPin1984!') {
      this.logedIn = true;
    } else {
      this.wrongPassword = true;
      setTimeout(() => {
        this.wrongPassword = false;
      }, 1000);
    }

  }

  stopLoop = (time: any) => {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  ngOnInit(): void {
    this.getData();
  }

  ngAfterViewInit(): void {
    this.initializeQuestionEditor();
    this.initializeAnswerEditor();
  }


  //
  //Functions add Question Overlay
  //

  //Standard Questions Editor
  private initializeQuestionEditor(): void {
    this.questionEditor = new EditorJS({
      minHeight: 100,
      holder: this.questionEditorElement.nativeElement,
      tools: {
        underline: Underline,
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

  //Standard Answer Editor
  initializeAnswerEditor(): void {
    this.answerEditor = new EditorJS({
      minHeight: 100,
      holder: this.answerEditorElement.nativeElement,
      tools: {
        underline: Underline,
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

  /**
   * As firebase cant save nested arrays
   * this function is used to save a table as an object
   */
  async saveEditorData(): Promise<void> {
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
      console.log('Das ist die Aufgabe',this.currentQuestion);
    }, 500);

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
   * This function is used to show the add question overlay
   */
  showOverlay() {
    this.overlay = true;
    this.setForm();
    window.scrollTo(0, 0);
  }

  /**
   * This function is used to hide the add question overlay
   */
  hideOverlay() {
    this.overlay = false;
  }






  //
  // Functions to load data from firebase
  //

  /**
   * This function is triggered OnInit and loads all Questions, all Subjects/Classes and the testHead
   */
  getData() {
    this.loadQuestions();
    this.loadSubjectsAndClasses();
    this.loadtestHead();
  }

  /**
     * this function is used to load all Questions from firebase
     * and store it in a local object (loadedQuestions)
     */
  async loadQuestions() {
    //gets all questions
    const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
    this.dataFromFirestore$ = collectionData(coll, { idField: 'id' })
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedQuestions = data;
      console.log(data);
      this.loadedQuestions.sort((x, y) => {
        return y.frage.time - x.frage.time
      })
    })
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
      console.log(this.loadedUserdata)
    });
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
      console.log(this.currentTestHead)
      this.loaded = true;
    });
  }

  /**
   * This function is used to delete a question form firebase
   * @param id is the firebase id of the question to delete it
   */
  deletedata(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    deleteDoc(coll);
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


  async addData(question: any) {
    this.loading = true;
    await this.saveEditorData();
    setTimeout(() => {
      if (!this.editMode) {
        const coll: any = collection(this.firestore, '/users/JonasWeiss/fragen');
        setDoc(doc(coll), {
          fach: this.currentSubjectChoice,
          frage: this.currentQuestion,
          antwort: this.currentAnswer,
          klasse: this.currentClassChoice,
          punktzahl: Number(question.punktzahl),
          bearbeitungszeit: Number(question.bearbeitungszeit),
          keywords: question.keywords.split(',')
        }).then(() => {
          this.loading = false;
          this.overlay = false;
          window.scrollTo(0, 0);
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
          this.overlay = false;
        })
        this.editMode = false;
      }
      this.clearForm();
    }, 700);
  }

  //
  // Functions all questions list view
  //

  /**
   * This fucntion is used to show the answer of a question as dropdown
   * @param id the firebase id of the question 
   */
  toggleAnswer(id: string) {
    console.log(id);

    if (this.currentId == id) {
      this.answerVisible = !this.answerVisible;
    } else {
      this.currentId = id;
    }
  }

  /**
   * This function is used to add a question to the current test and add a styling to the button
   * @param id is the firebase id of the question
   * @param status is a given string (add_styling) as an argument to add styling to the button
   */
  addToTest(id: string, status: string) {
    for (let i = 0; i < this.loadedQuestions.length; i++) {
      if (this.loadedQuestions[i]['id'] == id) {
        if (status == 'add_styling') {
          this.test.pages[this.test.pages.length - 1]['0'].push(this.loadedQuestions[i]);
          this.addedToTest.push(this.loadedQuestions[i]);
        }
        this.styleAddButton(i, status);
        this.setTestInfo();
      }
    }
    this.checkHeightOfAllPreviewQuestions();
    this.setQuestionNumber();
  }

  /**
   * This function is used to remove a question from the current test and add a styling to the button
   * executes setTestInfo & addToTest
   * @param id is the firebase id of the question
   */
  removeFromTest(id: string) {
    for (let i = 0; i < this.addedToTest.length; i++) {
      if (this.addedToTest[i]['id'] == id) {
        this.addedToTest.splice(i, 1);
      }
    }
    for (let i = 0; i < this.test.pages.length; i++) {
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        if (this.test.pages[i][0][j].id == id) {
          this.test.pages[i][0].splice(j, 1);
          this.setTestInfo();
          this.addToTest(id, 'remove_styling');
        }
      }
    }
    this.setQuestionNumber();
  }

  /**
   * 
   * @param i index of the question in the array loadedQuestions
   * @param status is a given string (add_styling or remove_styling) as an argument to style the button
   */
  styleAddButton(i: number, status: string) {
    status == 'add_styling'
      ?
      (this.addClasslist('add_btn' + i, 'd_none'),
        this.addClasslist('question_list' + i, 'question_added'),
        this.removeClasslist('remove_btn' + i, 'd_none'))
      :
      (this.addClasslist('remove_btn' + i, 'd_none'),
        this.removeClasslist('question_list' + i, 'question_added'),
        this.removeClasslist('add_btn' + i, 'd_none'))
  }


  /**
   * This function is used to update the test information like totaltime, total questions and total points
   */
  setTestInfo() {
    this.currentTestPoints = 0;
    this.currentTestTime = 0;
    for (let i = 0; i < this.addedToTest.length; i++) {
      this.currentTestTime += this.addedToTest[i].bearbeitungszeit;
      this.currentTestPoints += this.addedToTest[i].punktzahl;
    }
  }







  //
  // Functions test preview overlay
  //


  /**
   * This function is used to toggle the test preview 
   * executes checkHeightOfAllPreviewQuestions & setQuestionNumber
   */
  openPreview() {
    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 200);
    this.preview = !this.preview;
    window.scrollTo(0, 0);
    this.setQuestionNumber();
  }

  /**
   * this function is used to check the height of qll questions insode all dina4 pages
   * if its too high for a dina4 page it pushs the question to the next page array
   * executes setQuestionNumber
   */
  async checkHeightOfAllPreviewQuestions() {
    for (let i = 0; i < this.test.pages.length; i++) {
      await this.stopLoop(10);
      let pageContent = document.getElementById(`test_content${i}`).clientHeight;
      let paperHeight = document.getElementById(`test_dinA4${i}`).clientHeight;
      if (pageContent > paperHeight) {
        const question = this.test.pages[i][0].pop();
        if (i == this.test.pages.length - 1) {
          this.test.pages.push({ [0]: [] });
        }

        this.test.pages[i + 1][0].push(question)
        this.test.pages[i + 1][0].reverse();
      }
    }
    this.setQuestionNumber();
  }

  /**
   * This function is used to refresh the question numbers on any changes 
   * the numbers are ordered 1 to ...
   */
  async setQuestionNumber() {
    this.question_number = 0
    for (let i = 0; i < this.test.pages.length; i++) {
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        this.question_number++;
        await this.stopLoop(10);
        let number = document.getElementById(`question_number${i}${j}`)
        number.innerHTML = `${this.question_number}`;
      }
    }
  }

  /**
   * This function is used to open the rangbar to set the height / padding bottom of a question 
   * When this function is called the current padding bottom of a question is set to default styleHeight
   * @param pageIndex is the index of the dina4 page, first page is index 0
   * @param pagePosition is the index of the question in a dinA4 page, starts at 0
   */
  async showRangeToStyleQuestion(pageIndex: number, pagePosition: number) {
    this.editQuestionAtPreview = !this.editQuestionAtPreview;
    this.currentEditContainer = `${pageIndex}${pagePosition}`;
    for (let i = 0; i < this.test.pages.length; i++) { // sets the padding_bottom of last question in a page to zero 
      let questionHeight = document.getElementById(`question${i}${this.test.pages[i][0].length - 1}`);
      questionHeight.style.paddingBottom = `${0}%`;
    }
    let questionHeight = document.getElementById(`question${this.currentEditContainer}`).style.paddingBottom;
    let padding = questionHeight.replace('%', '');
    this.rangebars.setValue({
      styleHeight: Number(padding) * 2,
      styleWidth: 10
    });
  }

  /**
   * This function is used to open the rangbar to set the width of a image in a question 
   * When this function is called the current width of an image is set to the default width of the image
   * @param pageIndex is the index of the dina4 page, first page is index 0
   * @param pagePosition is the index of the question/Photo in a dinA4 page, starts at 0
   */
  showRangeToStyleImage(pageIndex: number, pagePosition: number) {
    this.editImageAtPreview = !this.editImageAtPreview;
    if (pageIndex >= 0) {
      this.currentEditContainer = `${pageIndex}${pagePosition}`;
      let image = document.getElementById(`questionImage${this.currentEditContainer}`).style.width;
      let imageSize = image.replace('%', '');
      this.rangebars.setValue({
        styleHeight: 10,
        styleWidth: Number(imageSize),
      });
    }
  }

  setHeightQuestion(height: string) {
    let questionHeight = document.getElementById(`question${this.currentEditContainer}`);
    questionHeight.style.paddingBottom = `${Number(height) / 2}%`;
    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 10);
  }

  setImageSize(width: string) {
    let image = document.getElementById(`questionImage${this.currentEditContainer}`);
    image.style.width = `${width}%`;

    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 50);
  }

  addClasslist(id: string, classList: string) {
    document.getElementById(id).classList.add(classList);
  }

  removeClasslist(id: string, classList: string) {
    document.getElementById(id).classList.remove(classList);
  }

  toggleEditTestHead() {
    this.editTesthead = true;
  }

  closeEditTestHead() {
    this.editTesthead = false;
  }

  printTest() {
    window.print();
  }

  logID(id: string) {
    console.log(id)
  }


}


 // showFile() {
  //   console.log(this.file);
  // }

  // chooseFile(event: any) {
  //   this.file = event.target.files[0];
  // }

  // addPhoto() {
  //   const storageRef = ref(this.storage, this.file.name)
  //   const uploadTask = uploadBytesResumable(storageRef, this.file)
  //   uploadTask.on('state_changed',
  //     (snapshot) => {
  //       const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //       console.log('Upload is ' + progress + '% done');
  //     }, () => {
  //       getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
  //         console.log('File available at', downloadURL);
  //       });
  //     }
  //   )
  // }