import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL, getStorage, uploadBytes } from '@angular/fire/storage';
import { NgForm } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import Underline from '@editorjs/underline';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Table from '@editorjs/table';
import { deleteDoc, setDoc, updateDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
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
  currentTable = {};
  currentId: string;

  // variables for the new question window
  @ViewChild("rangeSliderForm") rangebars: NgForm;
  Checklist = require('@editorjs/checklist');
  @ViewChild('questionForm') form: NgForm;

  @ViewChild('editor', { read: ElementRef, static: true })
  editorElement: ElementRef;
  private editor: EditorJS;

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
  currentEditContainer: string;
  heightOfAllPreviewQuestions = 0;
  test = {
    pages: <any>[{
      0: [],
    },
    ]
  };

  file: any;

  question_number = 0;

  constructor(private firestore: Firestore, public storage: Storage) { }

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

  stopLoop = (time: any) => {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  ngOnInit(): void {
    this.getData();
    console.log(this.test);

  }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }



  private initializeEditor(): void {
    this.editor = new EditorJS({
      minHeight: 200,
      holder: this.editorElement.nativeElement,
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

  chooseFile(event: any) {
    this.file = event.target.files[0];
  }

  showFile() {
    console.log(this.file);
  }

  addPhoto() {
    const storageRef = ref(this.storage, this.file.name)
    const uploadTask = uploadBytesResumable(storageRef, this.file)
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      }, () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
        });
      }
    )
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
    this.loadQuestions();
    this.loadSubjectsAndClasses();
    this.loadtestHead();
  }

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

  async loadSubjectsAndClasses() {
    //gets UserData like classes and subjects and email adress and username
    const subject: any = collection(this.firestore, '/users/JonasWeiss/subjects');
    this.dataFromFirestore$ = collectionData(subject, { idField: 'id' });
    this.dataFromFirestore$.subscribe((data) => {
      this.loadedUserdata = data;
      console.log(this.loadedUserdata)
    });
  }

  async loadtestHead() {
    const testHead: any = collection(this.firestore, '/users/JonasWeiss/testHead');
    this.testHeadFromFirestore$ = collectionData(testHead, { idField: 'id' });
    this.testHeadFromFirestore$.subscribe((data) => {
      this.currentTestHead = data;
      console.log(this.currentTestHead)
      this.loaded = true;
    });
  }

  deletedata(id: string) {
    const coll: any = doc(this.firestore, '/users/JonasWeiss/fragen/' + id);
    deleteDoc(coll);
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
          antwort: 'Das ist eine Antwort',
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

  setTestInfo() {
    this.currentTestPoints = 0;
    this.currentTestTime = 0;
    for (let i = 0; i < this.addedToTest.length; i++) {
      this.currentTestTime += this.addedToTest[i].bearbeitungszeit;
      this.currentTestPoints += this.addedToTest[i].punktzahl;
    }
  }

  showOverlay() {
    this.overlay = true;
    this.setForm();
    window.scrollTo(0, 0);
  }

  hideOverlay() {
    this.overlay = false;
  }

  openPreview() {
    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 200);
    this.preview = !this.preview;
    window.scrollTo(0, 0);
    this.setQuestionNumber();
  }

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
  //alter wert 3.139555

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

  printTest() {
    window.print();
  }
}
