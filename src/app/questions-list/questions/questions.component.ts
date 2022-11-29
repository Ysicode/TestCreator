import { Component, Directive, HostListener, OnInit, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import { deleteDoc } from '@firebase/firestore';
import { Observable } from 'rxjs';
import { EditComponent } from 'src/app/add/edit/edit.component';
import { overlaysService } from 'src/app/services/overlays.service';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  providers: [overlaysService],
  
})

export class QuestionsComponent implements OnInit {
  @ViewChild(EditComponent, { static: true }) editComp: EditComponent;

  //variables for the Questions list view
  dataFromFirestore$: Observable<any>;
  testHeadFromFirestore$: Observable<any>;
  loadedQuestions = [];
  loaded = false;

  currentQuestion: any;
  currentAnswer: any;
  currentDifficulty: any;
  currentId: string;

  // variables for the new question window
  editMode = false;
  overlay = false;

  //multi used variables
  currentTestPoints: number = 0;
  currentTestTime: number = 0;

  //variables for the preview window
  @ViewChild("rangeSliderForm") rangebars: NgForm;
  addedToTest = [];
  currentTestHead: any;
  dinA4Pages = [];
  preview = false;
  editQuestionAtPreview = false;
  editImageAtPreview = false;
  public editTesthead = false;
  currentEditContainer: string;
  currentEditImage: string;
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
  resizeActive = false!

  constructor(private firestore: Firestore, public service: overlaysService) { }
@HostListener("click", ["$event"])

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

  /**
   * This function is triggered OnInit and loads all Questions, all Subjects/Classes and the testHead
   */
  getData() {
    this.loadQuestions();
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





  //
  // Functions all questions list view
  //

  /**
   * This fucntion is used to show the answer of a question as dropdown
   * @param id the firebase id of the question 
   */
  toggleAnswer(id: string) {
    if (this.currentId == id) {
      this.currentId = '2883993'
    } else {
      this.currentId = id;
    }
  }

  /**
   * This function is used to add a question to the current test and add a styling to the button
   * @param id is the firebase id of the question
   * @param status is a given string (add_styling) as an argument to add styling to the button
   */
  addToTest(id: string, status: string, difficulty: string) {
    for (let i = 0; i < this.loadedQuestions.length; i++) {
      if (this.loadedQuestions[i]['id'] == id) {
        if (status == 'add_styling') {
          this.test.pages[this.test.pages.length - 1]['0'].push(this.loadedQuestions[i]);
          this.addedToTest.push(this.loadedQuestions[i]);
          setTimeout(() => {
            this.getDefaultHeightsOfEachAddedQuestions();
          }, 200)
        }
        this.styleAddButton(i, status, difficulty);
        this.setTestInfo();
      }
    }
    this.checkHeightOfAllPreviewQuestions();
    this.setQuestionNumber();
  }

  getDefaultHeightsOfEachAddedQuestions() {
    for (let i = 0; i < this.test.pages.length; i++) {
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        this.test.pages[i][0][j]['defaultheight'] = document.getElementById(`question${i}${j}`).clientHeight;
      }
    }
    console.log(this.test.pages);

  }

  /**
   * This function is used to remove a question from the current test and add a styling to the button
   * executes setTestInfo & addToTest
   * @param id is the firebase id of the question
   */
  removeFromTest(id: string, difficulty: string) {
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
          this.addToTest(id, 'remove_styling', difficulty);
        }
      }
    }
    setTimeout(() => {
      this.setQuestionNumber();
      this.checkHeightOfAllPreviewQuestions();
    }, 30);
  }

  /**
   * 
   * @param i index of the question in the array loadedQuestions
   * @param status is a given string (add_styling or remove_styling) as an argument to style the button
   */
  styleAddButton(i: number, status: string, difficulty: string) {
    if (difficulty == 'Leicht') {
      status == 'add_styling'
        ?
        (this.addClasslist('add_btn' + i, 'd_none'),
          this.addClasslist('question_list' + i, 'question_added_leicht'),
          this.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.addClasslist('remove_btn' + i, 'd_none'),
          this.removeClasslist('question_list' + i, 'question_added_leicht'),
          this.removeClasslist('add_btn' + i, 'd_none'))
    }

    if (difficulty == 'Mittel') {
      status == 'add_styling'
        ?
        (this.addClasslist('add_btn' + i, 'd_none'),
          this.addClasslist('question_list' + i, 'question_added_mittel'),
          this.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.addClasslist('remove_btn' + i, 'd_none'),
          this.removeClasslist('question_list' + i, 'question_added_mittel'),
          this.removeClasslist('add_btn' + i, 'd_none'))
    }

    if (difficulty == 'Schwer') {
      status == 'add_styling'
        ?
        (this.addClasslist('add_btn' + i, 'd_none'),
          this.addClasslist('question_list' + i, 'question_added_schwer'),
          this.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.addClasslist('remove_btn' + i, 'd_none'),
          this.removeClasslist('question_list' + i, 'question_added_schwer'),
          this.removeClasslist('add_btn' + i, 'd_none'))
    }
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
    }, 200)


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


      if (i > 0) {
        let question = document.getElementById(`question${i}${0}`).clientHeight;
        if (i > 0 && document.getElementById(`test_content${i - 1}`).clientHeight + question < document.getElementById(`test_dinA4${i - 1}`).clientHeight - 10) {
          const question = this.test.pages[i][0].shift();
          this.test.pages[i - 1][0].push(question)
          if (i > 0 && this.test.pages[i][0].length == 0) {
            this.test.pages.pop();

          }

        }
      }

    }


  }

  /**
   * This function is used to refresh the question numbers on any changes 
   * the numbers are ordered 1 to ...
   */
  async setQuestionNumber() {
    await this.stopLoop(10);
    console.log('change');
    this.question_number = 0;
    for (let i = 0; i < this.test.pages.length; i++) {
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        this.question_number++;
        this.stopLoop(5);
        let number = document.getElementById(`question_number${i}${j}`)
        number.innerHTML = `${this.question_number}`;
      }
    }


  }

  /**
   * This function is used to resize the height of a question
   * @param pageIndex - is the index of the dina4 page
   * @param pagePosition - is the index of the question on the page
   */
  resizeQuestion(pageIndex: number, pagePosition: number) {
    this.resizeActive = true;
    this.currentEditContainer = `${pageIndex}${pagePosition}`
    let startY: number, startHeight: number;
    let resizer = document.getElementById(`resize${this.currentEditContainer}`);
    let question = document.getElementById(`question${this.currentEditContainer}`);
    question.style.minHeight = this.test.pages[pageIndex][0][pagePosition]['defaultheight'] + 'px';

    resizer.addEventListener('mousedown', initDrag, false);

    function initDrag(e: { clientY: number; }) {
      startY = e.clientY;
      startHeight = parseInt(document.defaultView.getComputedStyle(question).height, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    function doDrag(e: { clientY: number; }) {
      question.style.height = (startHeight + e.clientY - startY) + 'px';
    }

    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
      this.resizeActive = false;
    }
  }

  see() {
    console.log('helo');
    
  }

  onEvent(event: Event) {
    event.stopPropagation();  
  }

  resizeImage(pageIndex: number, pagePosition: number, questionPosition: number) {
    this.currentEditImage = `${pageIndex}${pagePosition}${questionPosition}`
    let startX: number, startWidth: number;
    let resizer = document.getElementById(`resizeImage${this.currentEditImage}`);
    let image = document.getElementById(`img_edit_wrapper${this.currentEditImage}`);
    let question = document.getElementById(`question${pageIndex}${pagePosition}`);
    // question.style.minHeight = this.test.pages[pageIndex][0][pagePosition]['defaultheight'] + 'px';

    resizer.addEventListener('mousedown', initDrag, false);

    function initDrag(e: { clientX: number; }) {
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(image).width, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    function doDrag(e: { clientX: number; }) {
      image.style.width = (startWidth + e.clientX - startX) + 'px';
      question.style.height = 'fit-content';  
    }

    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
      this.resizeActive = false;
    }   
  }

  /**
 * This function is used to open the rangbar to set the height / padding bottom of a question 
 * When this function is called the current padding bottom of a question is set to default styleHeight
 * @param pageIndex is the index of the dina4 page, first page is index 0
 * @param pagePosition is the index of the question in a dinA4 page, starts at 0
 */
  async showRangeToStyleQuestion(pageIndex: number, pagePosition: number) {
    await this.checkHeightOfAllPreviewQuestions();
    this.editQuestionAtPreview = true;
    this.currentEditContainer = `${pageIndex}${pagePosition}`

    let questionHeight = document.getElementById(`question${this.currentEditContainer}`).style.paddingBottom;
    let padding = questionHeight.replace('%', '');

    this.rangebars.setValue({
      styleHeight: Number(padding) * 2,
      styleWidth: 10
    });
  }

  closeEditQuestionPreview() {
    this.editQuestionAtPreview = false;
  }


  setHeightQuestion(height: string) {
    let questionHeight = document.getElementById(`question${this.currentEditContainer}`);
    questionHeight.style.paddingBottom = `${Number(height) / 2}%`;
    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 5);
  }

  /**
   * This function is used to open the rangbar to set the width of a image in a question 
   * When this function is called the current width of an image is set to the default width of the image
   * @param pageIndex is the index of the dina4 page, first page is index 0
   * @param pagePosition is the index of the question/Photo in a dinA4 page, starts at 0
   */
  showRangeToStyleImage(pageIndex: number, pagePosition: number) {
    this.editImageAtPreview = true;
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

  closeRangeToStyleImage() {
    this.editImageAtPreview = false
  }


  setImageSize(width: string) {
    let image = document.getElementById(`questionImage${this.currentEditContainer}`);
    image.style.width = `${width}%`;

    setTimeout(() => {
      this.checkHeightOfAllPreviewQuestions();
    }, 5);
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