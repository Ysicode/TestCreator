import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { EditComponent } from 'src/app/add/edit/edit.component';
import { AlertService } from 'src/app/services/alert.service';
import { dataTransferService } from 'src/app/services/dataTransfer.service';
import { overlaysService } from 'src/app/services/overlays.service';


@Component({
  selector: 'app-questions',
  host: { class: 'd_flex' },
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  providers: [overlaysService, dataTransferService, AlertService]
})

export class QuestionsComponent implements OnInit {

  // Variables for the app Edit comp when edit mode
  currentQuestion: any;
  currentAnswer: any;
  currentId: string;

  // variables for the new question window
  overlay: boolean = false;
  questionToEdit: any;
  answerToEdit: any;
  questionId: string;
  deleteQuestionID: string;
  editQuestionMode: Boolean = false;

  //multi used variables
  currentTestPoints: number = 0;
  currentTestTime: number = 0;

  //variables for the preview window
  @ViewChild("rangeSliderForm") rangebars: NgForm;
  addedToTest = [];
  testAttaches = [];
  solutionAttaches = [];
  preview = true;
  checkHeightsAndSetQuestionNumberInterval: any;
  editQuestionAtPreview = false;
  editImageAtPreview = false;
  public editTesthead = false;
  currentEditQuestion: string;
  currentEditImage: string;
  heightOfAllPreviewQuestions = 0;
  public test = {
    pages: <any>[{
      0: [],
    },
    ]
  };
  squareWhitspace = false;

  //help variables
  totalQuestionsNumber: number = 0;
  deleteTestOverlay: boolean = false;
  deleteQuestionOverlay: boolean = false;
  logedIn: Boolean = false;
  sampleSolution = false;

  // Filter And Search variables
  @ViewChild("search") searchInput: ElementRef;
  openFilter = false;
  search = false;
  searchactive = false;
  currentSearch = '';

  //Filter Variables
  filteredQuestions = [];
  filters = []
  filteredDifficulty: any = null;
  filteredSubject: any = null
  selectedSubjectButton: number;
  filteredClass: any = null;
  selectedClassButton: number;
  filteredKind: any = null;
  filteredOnlyMyQuestion: any = null;
  filteredBearbeitungszeit: any = null;
  filteredPunktzahl: any = null


  //TOUCH Variablkes & RESIZE
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  questionContentHeight: any;

  stateIndex: number = 0;
  states: any = [];
  stateOfAddedQuestion: any = [];

  @HostListener('document:keydown.meta.z', ['$event'])
  undo(event: KeyboardEvent) {
    event.preventDefault();
    this.undoState();
  }

  @HostListener('document:keydown.meta.shift.z', ['$event'])
  redo(event: KeyboardEvent) {
    event.preventDefault();
    this.redoState();
  }

  constructor(public service: overlaysService, public data: dataTransferService, public alertService: AlertService) { }
  // @HostListener("click", ["$event"]) //Lädt die Seite jedesmal neu wenn geclickt wird Braucht man aktuell nicht

  async ngOnInit(): Promise<void> {
    this.loadData();
  }

  undoState() {
    if (this.stateIndex != 0) {
      console.log('length', this.states.length);
      console.log('index', this.stateIndex)
      this.stateIndex--;
      localStorage.setItem("currentTest", JSON.stringify(this.states[this.stateIndex]));
      // localStorage.setItem("statesAddedQuestions", JSON.stringify(this.stateOfAddedQuestion[this.stateIndex]));
      setTimeout(() => {
        this.getCurrentTestFromLocalStorage();
        this.styleAddedQuestionsInListViewAfterLoadingTestData();
      }, 100);
    }
  }

  redoState() {
    if (this.stateIndex < this.states.length - 1) {
      console.log('length', this.states.length);
      console.log('index', this.stateIndex)
      this.stateIndex++;
      localStorage.setItem("currentTest", JSON.stringify(this.states[this.stateIndex]));
      // localStorage.setItem("statesAddedQuestions", JSON.stringify(this.stateOfAddedQuestion[this.stateIndex]));
      setTimeout(() => {
        this.getCurrentTestFromLocalStorage();
        this.styleAddedQuestionsInListViewAfterLoadingTestData();
      }, 100);
    }
  }

  async loadData() {
    this.service.loading = true;
    if (this.data.getUserDataFromLocalStorage()) {
      await this.data.loadSubUserData();
      await this.data.loadSubjectsAndClasses();
      await this.data.loadQuestions();
      await this.getCurrentTestFromLocalStorage();
      await this.addStateToLocalStorage();
      setTimeout(() => {
        this.logedIn = true;
        this.service.loading = false;
      }, 700);
    }
  }

  getTotalQuestionNumber() {
    this.totalQuestionsNumber = 0;
    for (let i = 0; i < this.data.loadedQuestions.length; i++) {
      if (!document.getElementById(`questionListView${i}`).classList.contains('d_none')) {
        this.totalQuestionsNumber++
      }
    }
  }

  async addCurrentTestToLocalStorage() {
    await this.addStateToLocalStorage();
    localStorage.setItem("currentTest", JSON.stringify(this.states[this.stateIndex]));
    localStorage.setItem("addedQuestions", JSON.stringify(this.stateOfAddedQuestion[this.stateIndex]));
  }

  async addStateToLocalStorage() {
    await this.states.push(this.test);
    await this.stateOfAddedQuestion.push(this.addedToTest);

    try {
      localStorage.setItem("states", JSON.stringify(this.states));
      localStorage.setItem("statesAddedQuestions", JSON.stringify(this.stateOfAddedQuestion));
    }
    catch (e) {
      this.states.splice(0, 400) // removes the first 400 states of local storage when local storage throws error (Full)
      this.stateOfAddedQuestion.splice(0, 400); // removes the first 400 stateOfAddedQuestion of local storage throws error (Full)

      localStorage.setItem("states", JSON.stringify(this.states));
      localStorage.setItem("statesAddedQuestions", JSON.stringify(this.stateOfAddedQuestion));
    }

    let loadedStates = localStorage.getItem('states');
    this.states = JSON.parse(loadedStates);

    let loadedStatesOfAddedQuestions = localStorage.getItem('statesAddedQuestions');
    this.stateOfAddedQuestion = JSON.parse(loadedStatesOfAddedQuestions);

    this.stateIndex = this.states.length - 1;
  }

  async loadLocalStorageData() {
    if (!localStorage.getItem('currentTest')) return
    let loadedTestFromStorage = localStorage.getItem('currentTest');
    this.test = JSON.parse(loadedTestFromStorage);

    let loadedAddedQuestions = localStorage.getItem('addedQuestions');
    this.addedToTest = JSON.parse(loadedAddedQuestions);

    if (localStorage.getItem('states') && localStorage.getItem('statesAddedQuestions')) {
      let loadedStates = localStorage.getItem('states');
      this.states = JSON.parse(loadedStates);
      let loadedStatesOfAddedQuestions = localStorage.getItem('statesAddedQuestions');
      this.stateOfAddedQuestion = JSON.parse(loadedStatesOfAddedQuestions);
    }
  }

  async getCurrentTestFromLocalStorage() {
    await this.loadLocalStorageData();
    this.setQuestionNumber();
    this.setTestInfo();
    this.renderSquaresAndLinesOfQuestionsInTest();
    setTimeout(() => {
      this.styleAddedQuestionsInListViewAfterLoadingTestData();
    }, 1000);

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
      this.currentId = '';
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
    for (let i = 0; i < this.data.loadedQuestions.length; i++) {
      if (this.data.loadedQuestions[i]['id'] == id) {
        if (status == 'add_styling') {
          this.test.pages[this.test.pages.length - 1]['0'].push(this.data.loadedQuestions[i]);
          this.addedToTest.push(this.data.loadedQuestions[i]);
          //  this.checkQuestionAttachedFiles(i);

          setTimeout(() => {
            this.getDefaultHeightsOfEachAddedQuestions();
          }, 200)
        }
        this.styleAddButton(i, status, difficulty);
        this.setTestInfo();
      }
    }
    this.checkHeightOfAllPreviewQuestions();
    this.renderSquaresAndLinesOfQuestionsInTest();
    this.setQuestionNumber();
    this.addCurrentTestToLocalStorage();
  }

  // Kann gemacht werden wenn alle Anhänge in test angezeigt werden sollen

  // checkQuestionAttachedFiles(i: number) {
  //   for (let j = 0; j < this.data.loadedQuestions[i].frage.blocks.length; j++) {
  //     if (this.data.loadedQuestions[i].frage.blocks[j].type === 'attaches') {
  //       this.testAttaches.push(this.data.loadedQuestions[i].frage.blocks[j].data);
  //       console.log(this.testAttaches);
  //       console.log(this.data.loadedQuestions[i])
  //     }
  //   }

  //   for (let j = 0; j < this.data.loadedQuestions[i].antwort.blocks.length; j++) {
  //     if (this.data.loadedQuestions[i].antwort.blocks[j].type === 'attaches') {
  //       this.solutionAttaches.push(this.data.loadedQuestions[i].antwort.blocks[j].data);
  //       console.log(this.solutionAttaches);
  //       console.log(this.data.loadedQuestions[i])
  //     }
  //   }
  // }

  getDefaultHeightsOfEachAddedQuestions() {
    let height = (this.getHeight(`question${this.test.pages.length - 1}${this.test.pages[this.test.pages.length - 1]['0'].length - 1}`) * 100) / this.getHeight(`test_dinA4${this.test.pages.length - 1}`);
    this.test.pages[this.test.pages.length - 1][0][this.test.pages[this.test.pages.length - 1]['0'].length - 1]['defaultheight'] = height;
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
    }, 200);
  }

  /**
  * This function is used to remove added styling of all questions in listview
  * If a question is added to the test, add styling to the question in listview
  */
  styleAddedQuestionsInListViewAfterLoadingTestData() {
    console.log(this.data.loadedQuestions)
    for (let a = 0; a < this.data.loadedQuestions.length; a++) {
      for (let i = 0; i < this.test.pages.length; i++) {
        for (let j = 0; j < this.test.pages[i][0].length; j++) {
          if (this.test.pages[i][0][j].id == this.data.loadedQuestions[a]['id']) {
            this.styleAddButton(a, 'add_styling', this.data.loadedQuestions[a]['schwierigkeit']);
            console.log(this.test.pages[i][0][j].id )
          }
          if (this.test.pages[i][0][j].id != this.data.loadedQuestions[a]['id']) {
            this.styleAddButton(a, 'remove_styling', this.data.loadedQuestions[a]['schwierigkeit']);
          }
        }
      }
    }
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
        (this.service.addClasslist('add_btn' + i, 'd_none'),
          this.service.addClasslist('question_list' + i, 'question_added_leicht'),
          this.service.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.service.addClasslist('remove_btn' + i, 'd_none'),
          this.service.removeClasslist('question_list' + i, 'question_added_leicht'),
          this.service.removeClasslist('add_btn' + i, 'd_none'))
    }

    if (difficulty == 'Mittel') {
      status == 'add_styling'
        ?
        (this.service.addClasslist('add_btn' + i, 'd_none'),
          this.service.addClasslist('question_list' + i, 'question_added_mittel'),
          this.service.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.service.addClasslist('remove_btn' + i, 'd_none'),
          this.service.removeClasslist('question_list' + i, 'question_added_mittel'),
          this.service.removeClasslist('add_btn' + i, 'd_none'))
    }

    if (difficulty == 'Schwer') {
      status == 'add_styling'
        ?
        (this.service.addClasslist('add_btn' + i, 'd_none'),
          this.service.addClasslist('question_list' + i, 'question_added_schwer'),
          this.service.removeClasslist('remove_btn' + i, 'd_none'))
        :
        (this.service.addClasslist('remove_btn' + i, 'd_none'),
          this.service.removeClasslist('question_list' + i, 'question_added_schwer'),
          this.service.removeClasslist('add_btn' + i, 'd_none'))
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
    this.getTotalQuestionNumber();
  }

  /**
   * this function is used to check the height of qll questions insode all dina4 pages
   * if its too high for a dina4 page it pushs the question to the next page array
   * executes setQuestionNumber
   */
  async checkHeightOfAllPreviewQuestions() {
    let contentHeight = 0;
    setTimeout(async () => {
      for (let i = 0; i < this.test.pages.length; i++) {
        if (i != 0) {
          contentHeight = 0;
        } else {
          contentHeight = this.getHeight('testhead');
        }
        await this.stopLoop(10);
        let outerHeight = this.getHeight(`test_dinA4${i}`);
        let paperHeight = outerHeight - (outerHeight * 0.15);
        if (i > 0) {
          this.moveUpQuestionAndDeleteEmptyPages(i, paperHeight);
        }
        for (let j = 0; j < this.test.pages[i][0].length; j++) {
          let height = this.getHeight(`question${i}${j}`);
          contentHeight += Number(height);
          // console.log('contentHeight', contentHeight, 'paperHeight', paperHeight)
        }
        if (contentHeight > paperHeight) {

          this.addNewPageAndpushLastQuestion(i);
        }
      }
    }, 30);
  }

  addNewPageAndpushLastQuestion(i: number) {
    const question = this.test.pages[i][0].pop();
    setTimeout(() => {
      this.renderSquaresAndLinesOfQuestionsInTest();
    }, 100);
    if (i == this.test.pages.length - 1) {
      this.test.pages.push({ [0]: [] });
    }
    this.test.pages[i + 1][0].push(question)
    this.test.pages[i + 1][0].reverse();
  }

  pageIsEmpty(i: number) {
    return this.test.pages[i][0].length == 0;
  }

  deleteEmptyPages(i: number) {
    if (this.pageIsEmpty(i) && i != 0) {
      this.test.pages.pop();
    }
  }

  async moveUpQuestionAndDeleteEmptyPages(i: number, paperHeight: number) {
    if (!this.pageIsEmpty(i) && await this.spaceForFirstQuestion(i, paperHeight) && this.currentEditQuestion.toString()[1] != '0') {
      const question = this.test.pages[i][0].shift(); // 
      setTimeout(() => {
        this.renderSquaresAndLinesOfQuestionsInTest();
      }, 100);
      this.test.pages[i - 1][0].push(question)
      setTimeout(() => {
        if (this.pageIsEmpty(i)) {
          this.test.pages.pop();
        }
      }, 5);
    }
  }

  async spaceForFirstQuestion(i: number, paperHeight: number) {
    let firstQuestion = this.getHeight(`question${i}${0}`);
    let contentHeight = i == 1 ? this.getHeight('testhead') : 0; //Checks if the testpage has the testhead on index 1 and adds the height of it
    for (let j = 0; j < this.test.pages[i - 1][0].length; j++) {
      let height = this.getHeight(`question${i - 1}${j}`);
      contentHeight += Number(height);
    }
    return contentHeight + firstQuestion < paperHeight - 10
  }

  /**
   * This function is used to refresh the question numbers on any changes 
   * the numbers are ordered 1 to ...
   */
  async setQuestionNumber() {
    Array.from(document.getElementsByClassName('test_number')).forEach((number, index) => {
      number.innerHTML = (index + 1).toString();
    });
  }

  getCurrentQuestion(pageIndex: number, pagePosition: number) {
    if (this.currentEditQuestion != `${pageIndex}${pagePosition}`) {
      this.currentEditQuestion = `${pageIndex}${pagePosition}`;
    }
  }


  /**
   * This function is used to resize the height of a question
   * @param pageIndex - is the index of the dina4 page
   * @param pagePosition - is the index of the question on the page
   */
  resizeQuestion(pageIndex: number, pagePosition: number) {
    let startY: number, startHeight: number;
    let resizer = this.element(`resize${this.currentEditQuestion}`);
    let question = this.element(`question${this.currentEditQuestion}`);
    let page = this.getHeight(`test_dinA4${pageIndex}`);
    let editWhitespace = this.element(`edit_whitespace${pageIndex}${pagePosition}`);
    question.style.minHeight = this.test.pages[pageIndex][0][pagePosition]['defaultheight'] + '%';
    let questionContentHeight = Number(question.style.minHeight.replace('%', ''));

    this.checkMaxHeightOfLastQuestionOfPageIndex(pageIndex, pagePosition, question);
    resizer.addEventListener('mousedown', initDrag, false);

    function initDrag(e: { clientY: number; }) {
      startY = e.clientY;
      startHeight = parseInt(document.defaultView.getComputedStyle(question).height, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    function doDrag(e: { clientY: number; }) {

      let height = ((startHeight + e.clientY - startY) * 102.5) / page;
      question.style.height = height + '%';
      let questionHeight = Number(question.style.height.replace('%', ''));
      if (questionHeight > questionContentHeight + 5) {
        editWhitespace.classList.add('visibile')
      }
      if (questionHeight < questionContentHeight + 5) {
        editWhitespace.classList.remove('visibile')
      }
    }

    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }
  }

  resizeQuestionOnMouseUp(pageIndex: number, pagePosition: number) {
    let question = this.element(`question${this.currentEditQuestion}`);
    this.test.pages[pageIndex][0][pagePosition]['questionHeight'] = question.style.height;
    this.addCurrentTestToLocalStorage();
  }

  // RESIZE IMAGE MOUSE
  resizeImage(pageIndex: number, pagePosition: number, questionPosition: number) {
    this.currentEditImage = `${pageIndex}${pagePosition}${questionPosition}`
    let startX: number, startWidth: number;
    let resizer = this.element(`resizeImage${this.currentEditImage}`);
    let image = this.element(`img_edit_wrapper${this.currentEditImage}`);
    let question = this.element(`question${pageIndex}${pagePosition}`);
    let questionWidth = this.getWidth(`question${pageIndex}${pagePosition}`);
    this.checkMaxHeightOfLastQuestionOfPageIndex(pageIndex, pagePosition, question);
    resizer.addEventListener('mousedown', initDrag, false);

    function initDrag(e: { clientX: number; }) {
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(image).width, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    function doDrag(e: { clientX: number; }) {
      let width = ((startWidth + e.clientX - startX) * 100) / questionWidth;
      image.style.width = width + '%';
      // image.style.width = (startWidth + e.clientX - startX) + 'px';
      question.style.height = 'fit-content';
    }

    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }
  }

  resizeImageOnMouseUp(pageIndex: number, pagePosition: number, questionPosition: number) {
    let image = this.element(`img_edit_wrapper${this.currentEditImage}`);
    this.test.pages[pageIndex][0][pagePosition]['frage']['blocks'][questionPosition]['width'] = image.style.width;
    console.log(this.test.pages[pageIndex][0][pagePosition])
    this.addCurrentTestToLocalStorage();
  }
  /////////////////////////

  saveEditedQuestionAsDefault(pageIndex: number, pagePosition: number, questionId: string) {
    let updatedQuestion = this.test.pages[pageIndex][0][pagePosition];
    this.data.updateQuestion(updatedQuestion, questionId)
    this.alertService.showAlert('Hallo')
    this.alertService.alert = true;
    let alert = document.getElementById('alert');
    alert.innerHTML = this.alertService.showAlert('Aktuelles Layout als Standard gespeichert');
    setTimeout(() => {
      this.alertService.alert = false;
    }, 3000);
  }

  // RESIZE QUESTION TOUCH
  resizeQuestionOnTouchStart(event: TouchEvent, pageIndex: number, pagePosition: number) {
    let question = this.element(`question${this.currentEditQuestion}`);
    this.startHeight = this.getHeight(`question${this.currentEditQuestion}`);
    this.questionContentHeight = Number(question.style.minHeight.replace('%', ''));
    question.style.minHeight = this.test.pages[pageIndex][0][pagePosition]['defaultheight'] + '%';

    this.checkMaxHeightOfLastQuestionOfPageIndex(pageIndex, pagePosition, question);
    this.startY = event.touches[0].clientY;

    // this.startX = event.touches[0].clientX;
    // this.startWidth = parseInt(event.target['style'].width, 10);
    // console.log('StartY', this.startY, 'StartHeight',this.startHeight)
  }

  resizeQuestionOnTouchMove(event: TouchEvent, pageIndex: number, pagePosition: number) {
    let page = this.getHeight(`test_dinA4${pageIndex}`);
    let question = this.element(`question${this.currentEditQuestion}`);
    let editWhitespace = this.element(`edit_whitespace${pageIndex}${pagePosition}`);
    event.preventDefault();

    let questionHeight = Number(question.style.height.replace('%', ''));
    if (questionHeight > this.questionContentHeight + 5) {
      editWhitespace.classList.add('visibile')
    }
    if (questionHeight < this.questionContentHeight + 5) {
      editWhitespace.classList.remove('visibile')
    }

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.startX;
    const deltaY = currentY - this.startY;

    const newWidth = Math.max(this.startWidth + deltaX, 0);
    const newHeight = this.startHeight + Number(deltaY);
    const newHeightPercentage = (newHeight / page) * 100;

    question.style.height = `${newHeightPercentage}%`;
  }

  resizeQuestionOnTouchEnd(pageIndex: number, pagePosition: number) {
    let question = this.element(`question${this.currentEditQuestion}`);
    this.test.pages[pageIndex][0][pagePosition]['questionHeight'] = question.style.height;
    this.addCurrentTestToLocalStorage();
  }
  ///////////////////////


  // RESIZE IMAGE TOUCH
  resizeImageOnTouchStart(event: TouchEvent, pageIndex: number, pagePosition: number, questionPosition: number) {
    this.currentEditImage = `${pageIndex}${pagePosition}${questionPosition}`
    let question = this.element(`question${pageIndex}${pagePosition}`);
    this.startX = event.touches[0].clientX;
    this.startWidth = this.getWidth(`img_edit_wrapper${this.currentEditImage}`);
    this.checkMaxHeightOfLastQuestionOfPageIndex(pageIndex, pagePosition, question);
  }


  resizeImageOnTouchMove(event: TouchEvent, pageIndex: number, pagePosition: number) {
    let image = this.element(`img_edit_wrapper${this.currentEditImage}`);
    let question = this.element(`question${pageIndex}${pagePosition}`);
    let questionWidth = this.getWidth(`question${pageIndex}${pagePosition}`);

    event.preventDefault();

    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.startX;
    const newWidth = this.startWidth + Number(deltaX);
    const newWidthPercentage = (newWidth / questionWidth) * 100;

    image.style.width = newWidthPercentage + '%';
    question.style.height = 'fit-content';
  }

  resizeImageOnTouchEnd(pageIndex: number, pagePosition: number, questionPosition: number) {
    let image = this.element(`img_edit_wrapper${this.currentEditImage}`);
    this.test.pages[pageIndex][0][pagePosition]['frage']['blocks'][questionPosition]['width'] = image.style.width;
    this.addCurrentTestToLocalStorage();
  }
  /////////////////////////



  /**
   * this function is used to set an interval to multiple call 2 functions while resizing a question
   * @param mouse - is a string parameter to either start or stop the interval
   */
  checkHeightsInterval(mode: string) {
    if (mode === 'start') {
      this.checkHeightsAndSetQuestionNumberInterval = setInterval(() => {
        this.checkHeightOfAllPreviewQuestions();
        this.setQuestionNumber();
      }, 70)
    }
    if (mode === 'stop') {
      clearInterval(this.checkHeightsAndSetQuestionNumberInterval);
    }
  }

  checkMaxHeightOfLastQuestionOfPageIndex(pageIndex: number, pagePosition: number, question: any) {
    if (this.test.pages[pageIndex][0].length - 1 == pagePosition) {
      let contentHeight = 0;
      if (pageIndex != 0) {
        contentHeight = 0;
      } else {
        contentHeight = this.getHeight('testhead');
      }
      for (let j = 0; j < this.test.pages[pageIndex][0].length - 1; j++) {
        let height = this.getHeight(`question${pageIndex}${j}`);
        contentHeight += Number(height);
      }
      let outerHeight = this.getHeight(`test_dinA4${pageIndex}`);
      let paperHeight = outerHeight - (outerHeight * 0.18);
      question.style.maxHeight = ` ${paperHeight - contentHeight}px `
    }
  }


  async getSquaresAndLines(pageIndex: number, pagePosition: number) {
    this.currentEditQuestion = `${pageIndex}${pagePosition}`
    let contentHeight = this.getHeight(`questionContent${pageIndex}${pagePosition}`);
    let questionHeight = this.getHeight(`question${pageIndex}${pagePosition}`);
    let questionWidth = this.getWidth(`question${pageIndex}${pagePosition}`);
    await this.getSquares(contentHeight, questionHeight, questionWidth);
    await this.getLines(contentHeight, questionHeight, questionWidth);
  }

  async getSquares(contentHeight: any, questionHeight: any, questionWidth: any) {
    let squareHeight = questionWidth / 30;
    let totalRows = Math.floor((questionHeight - contentHeight) / squareHeight);
    let squares = this.element(`whitespace_squares${this.currentEditQuestion}`);
    squares.innerHTML = '';
    for (let i = 0; i < totalRows; i++) {
      squares.innerHTML += this.service.squareRows(this.currentEditQuestion, i);
      let row = this.element(`row${this.currentEditQuestion}${i}`);
      row.innerHTML = '';
      for (let j = 0; j < 32; j++) {
        row.innerHTML += this.service.squareColumns(32, i, j);
      }
    }
  }

  async getLines(contentHeight: any, questionHeight: any, questionWidth: any) {
    let lineHeight = questionWidth / 20;
    let totalLines = Math.floor((questionHeight - contentHeight) / lineHeight);
    let lines = this.element(`whitespace_lines${this.currentEditQuestion}`);
    lines.innerHTML = '';
    for (let i = 0; i < totalLines; i++) {
      lines.innerHTML += this.service.lines();
    }
  }

  showSquare(pageIndex: number, pagePosition: number) {
    this.test.pages[pageIndex][0][pagePosition]['whitespace'] = 'squares';
    this.hide(`whitespace_squares${this.currentEditQuestion}`, 'd_none');
    this.show(`whitespace_lines${this.currentEditQuestion}`, 'd_none');
    this.getSquaresAndLines(pageIndex, pagePosition);
    this.addCurrentTestToLocalStorage();
  }

  showWhite(pageIndex: number, pagePosition: number) {
    this.test.pages[pageIndex][0][pagePosition]['whitespace'] = 'white';
    this.show(`whitespace_squares${this.currentEditQuestion}`, 'd_none');
    this.show(`whitespace_lines${this.currentEditQuestion}`, 'd_none');
    this.addCurrentTestToLocalStorage();
  }

  showLines(pageIndex: number, pagePosition: number) {
    this.test.pages[pageIndex][0][pagePosition]['whitespace'] = 'lines';
    this.hide(`whitespace_lines${this.currentEditQuestion}`, 'd_none');
    this.show(`whitespace_squares${this.currentEditQuestion}`, 'd_none');
    this.getSquaresAndLines(pageIndex, pagePosition);
    this.addCurrentTestToLocalStorage();
  }

  toggleSolutions() {
    this.service.loading = true;
    this.sampleSolution = !this.sampleSolution;
    this.checkHeightOfAllPreviewQuestions();
    setTimeout(() => {
      this.renderSquaresAndLinesOfQuestionsInTest();
      this.setQuestionNumber();
      this.service.loading = false;
    }, 500);
  }

  async renderSquaresAndLinesOfQuestionsInTest() {
    for (let i = 0; i < this.test.pages.length; i++) {
      await this.stopLoop(500)
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        await this.stopLoop(500)
        if (this.test.pages[i][0][j]['whitespace']) {
          await this.getSquaresAndLines(i, j);
        }
      }
    }
  }

  getHeight(id: string) {
    return this.service.getClientHeight(id);
  }

  getWidth(id: string) {
    return this.service.getClientWidth(id);
  }

  show(id: string, classlist: string) {
    return this.service.removeClasslist(id, classlist);
  }

  hide(id: string, classlist: string) {
    return this.service.addClasslist(id, classlist);
  }

  element(id: string) {
    return this.service.getElement(id);
  }

  //  

  openSearch() {
    this.search = true;
    setTimeout(() => {
      let input = document.getElementById('search');
      input.focus();
    }, 300);
  }

  closeSearch(value: string) {
    this.search = false;
    this.searchForNameTypeId(value);
    this.currentSearch = value;
  }

  onKeyUpSearchInput(event: any) { //Currently when press Enter
    let currentSearch = event.target.value;
    this.searchForNameTypeId(currentSearch);
  }

  searchForNameTypeId(searchvalue: string) {
    let search = searchvalue.toLowerCase().replace(/\s+/g, '');
    window.scrollTo(0, 0);
    // str.trim().split(/\s+/);
    if (this.filters.length > 0) {
      for (let i = 0; i < this.data.loadedQuestions.length; i++) {
        this.hide(`questionListView${i}`, 'd_none');
        this.stopLoop(10)
        if (this.filters.length == 1) {
          if (this.setFilter(this.filters[0], i)) {
            this.doSearch(search, i)
          }
        }
        if (this.filters.length == 2) {
          if (this.setFilter(this.filters[0], i) && this.setFilter(this.filters[1], i)) {
            this.doSearch(search, i)
          }
        }
        if (this.filters.length == 3) {
          if (this.setFilter(this.filters[0], i) && this.setFilter(this.filters[1], i) && this.setFilter(this.filters[2], i)) {
            this.doSearch(search, i)
          }
        }
      }
    }

    if (this.filters.length == 0) {
      for (let i = 0; i < this.data.loadedQuestions.length; i++) {
        this.hide(`questionListView${i}`, 'd_none');
        this.stopLoop(10)
        this.doSearch(search, i)
      }
    }
    this.getTotalQuestionNumber();
  }


  setDifficultyFilter(diffculty: string) {
    for (let i = 0; i < this.filters.length; i++) {
      if (this.filters[i] == 'difficulty') {
        this.filters.splice(i, 1)
      }
    }
    if (this.filteredDifficulty == diffculty) {
      this.filteredDifficulty = '';
    } else {
      this.filteredDifficulty = diffculty;
      this.filters.push('difficulty')
    }
    this.searchForNameTypeId('');
  }

  setSubjectFilter(subject: any, index: number) {
    for (let i = 0; i < this.filters.length; i++) {
      if (this.filters[i] == 'subject') {
        this.filters.splice(i, 1)
      }
    }
    if (this.filteredSubject == subject) {
      this.filteredSubject = '';
      this.selectedSubjectButton = -1;

    } else {
      this.filteredSubject = subject;
      this.filters.push('subject');
      this.selectedSubjectButton = index;
    }
    this.searchForNameTypeId('');
  }

  setClassFilter(slectedClass: any, index: number) {
    for (let i = 0; i < this.filters.length; i++) {
      if (this.filters[i] == 'class') {
        this.filters.splice(i, 1)
      }
    }
    if (this.filteredClass == slectedClass) {
      this.filteredClass = '';
      this.selectedClassButton = -1;

    } else {
      this.filteredClass = slectedClass;
      this.filters.push('class');
      this.selectedClassButton = index;
    }
    this.searchForNameTypeId('');
  }

  setKindOfQuestionFilter(slectedKind: any) {
    for (let i = 0; i < this.filters.length; i++) {
      if (this.filters[i] == 'kind') {
        this.filters.splice(i, 1)
      }
    }
    if (this.filteredKind == slectedKind) {
      this.filteredKind = '';
    } else {
      this.filteredKind = slectedKind;
      this.filters.push('kind');
    }
    this.searchForNameTypeId('');
  }

  setFilter(filter: string, i: number) {
    if (filter == 'difficulty') {
      return this.data.loadedQuestions[i].schwierigkeit == this.filteredDifficulty;
    }
    if (filter == 'subject') {
      return this.data.loadedQuestions[i].fach == this.filteredSubject;
    }
    if (filter == 'class') {
      return this.data.loadedQuestions[i].klasse == this.filteredClass;
    }
    if (filter == 'kind') {
      return this.data.loadedQuestions[i].kindOf == this.filteredKind;
    }
    return false
  }


  doSearch(search: string, i: number) {
    for (let j = 0; j < this.data.loadedQuestions[i].keywords.length; j++) {
      this.stopLoop(10)
      if (this.data.loadedQuestions[i]['keywords'][j].toLowerCase().includes(search)) {
        this.show(`questionListView${i}`, 'd_none')
      }
    }

    // Fach
    if (this.data.loadedQuestions[i]['fach'].toLowerCase().includes(search)) {
      this.show(`questionListView${i}`, 'd_none')
    }

    // Schwierigkeit
    if (this.data.loadedQuestions[i]['schwierigkeit'].toLowerCase().includes(search)) {
      this.show(`questionListView${i}`, 'd_none')
    }

    // Klasse
    if (this.data.loadedQuestions[i]['klasse'].replace(/\s+/g, '').split('.').join('').toLowerCase().includes(search.toLowerCase().split('.').join(''))) {
      this.show(`questionListView${i}`, 'd_none')
    }
    // Punktzahl
    if (this.data.loadedQuestions[i]['punktzahl'].toString().toLowerCase().includes(search.toLowerCase().replace('p', '').replace('u', '').replace('n', '').replace('k', '').replace('t', '').replace('e', ''))) {
      this.show(`questionListView${i}`, 'd_none')
    }
    // Minutes
    if (this.data.loadedQuestions[i]['bearbeitungszeit'].toString().toLowerCase().includes(search.toLowerCase().replace('m', '').replace('i', '').replace('n', '').replace('u', '').replace('t', '').replace('e', '').replace('n', ''))) {
      this.show(`questionListView${i}`, 'd_none')
    }

    // CONTENTSEARCH OF QUESTION
    // text - paragraph
    for (let j = 0; j < this.data.loadedQuestions[i]['frage']['blocks'].length; j++) {
      if (this.data.loadedQuestions[i]['frage']['blocks'][j]['type'] == 'paragraph') {
        if (this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['text'].toLowerCase().indexOf(search) >= 0) {
          this.show(`questionListView${i}`, 'd_none')
        }
      }
      // table
      if (this.data.loadedQuestions[i]['frage']['blocks'][j]['type'] == 'table') {
        for (let k = 0; k < Object.keys(this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['table']).length - 1; k++) {
          for (let l = 0; l < this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['table'][k].length; l++) {
            if (this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['table'][k][l].toLowerCase().indexOf(search) >= 0) {
              this.show(`questionListView${i}`, 'd_none')
            }
          }
        }
      }
      // List
      if (this.data.loadedQuestions[i]['frage']['blocks'][j]['type'] == 'list') {
        for (let k = 0; k < this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['items'].length; k++) {
          if (this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['items'][k].toLowerCase().indexOf(search) >= 0) {
            this.show(`questionListView${i}`, 'd_none')
          }
        }
      }
      // checklist
      if (this.data.loadedQuestions[i]['frage']['blocks'][j]['type'] == 'checklist') {
        for (let k = 0; k < this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['items'].length; k++) {
          if (this.data.loadedQuestions[i]['frage']['blocks'][j]['data']['items'][k]['text'].toLowerCase().indexOf(search) >= 0) {
            this.show(`questionListView${i}`, 'd_none')
          }
        }
      }
    }
  }

  /**
   * This function is used to open the app-edit in standard and nor edit mode
   */
  showAddOverlay() {
    this.questionToEdit = {
      frage: null,
      antwort: null
    };
    this.service.windowScrollTop();
    setTimeout(() => {
      this.overlay = true;
    }, 100);
  }

  /**
   * This function is used to open the app-edit in editMode
   * 
   * @param questionData - all questionData of the question saved in firebase
   */
  showEditOverlay(questionData: any) {
    this.questionToEdit = questionData;
    this.editQuestionMode = true;
    setTimeout(() => {
      this.overlay = true;
      this.service.windowScrollTop();
    }, 500);
  }

  /**
   * This function is used to open the app-info-overlay to delete a question
   * 
   * @param questionid - the id of the question want to be deleted from firebase
   */
  showDeleteOverlay(questionid: string) {
    this.deleteQuestionID = questionid
    this.deleteQuestionOverlay = true;
  }

  openEditTestHeadComponent() {
    this.editTesthead = true;
  }

  stopLoop = (time: any) => {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  printTest() {
    window.print();
  }




}



// function html2canvas(nativeElement: any) {
//   throw new Error('Function not implemented.');
// }
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


/**
//  * This function is used to open the rangbar to set the height / padding bottom of a question
//  * When this function is called the current padding bottom of a question is set to default styleHeight
//  * @param pageIndex is the index of the dina4 page, first page is index 0
//  * @param pagePosition is the index of the question in a dinA4 page, starts at 0
//  */
//   async showRangeToStyleQuestion(pageIndex: number, pagePosition: number) {
//     await this.checkHeightOfAllPreviewQuestions();
//     this.editQuestionAtPreview = true;
//     this.currentEditQuestion = `${pageIndex}${pagePosition}`

//     let questionHeight = document.getElementById(`question${this.currentEditQuestion}`).style.paddingBottom;
//     let padding = questionHeight.replace('%', '');

//     this.rangebars.setValue({
//       styleHeight: Number(padding) * 2,
//       styleWidth: 10
//     });
//   }

//   closeEditQuestionPreview() {
//     this.editQuestionAtPreview = false;
//   }


//   setHeightQuestion(height: string) {
//     let questionHeight = document.getElementById(`question${this.currentEditQuestion}`);
//     questionHeight.style.paddingBottom = `${Number(height) / 2}%`;
//     setTimeout(() => {
//       this.checkHeightOfAllPreviewQuestions();
//     }, 5);
//   }

//   /**
//    * This function is used to open the rangbar to set the width of a image in a question 
//    * When this function is called the current width of an image is set to the default width of the image
//    * @param pageIndex is the index of the dina4 page, first page is index 0
//    * @param pagePosition is the index of the question/Photo in a dinA4 page, starts at 0
//    */
//   showRangeToStyleImage(pageIndex: number, pagePosition: number) {
//     this.editImageAtPreview = true;
//     if (pageIndex >= 0) {
//       this.currentEditQuestion = `${pageIndex}${pagePosition}`;
//       let image = document.getElementById(`questionImage${this.currentEditQuestion}`).style.width;
//       let imageSize = image.replace('%', '');
//       this.rangebars.setValue({
//         styleHeight: 10,
//         styleWidth: Number(imageSize),
//       });
//     }
//   }

//   closeRangeToStyleImage() {
//     this.editImageAtPreview = false
//   }


//   setImageSize(width: string) {
//     let image = this.service.getElement(`questionImage${this.currentEditQuestion}`);
//     image.style.width = `${width}%`;

//     setTimeout(() => {
//       this.checkHeightOfAllPreviewQuestions();
//     }, 5);
//   }










// private startDrawing(event: MouseEvent) {
  //   this.isDrawing = true;
  //   this.ctx.lineWidth = 0.1;
  //   this.ctx.strokeStyle = 'red'
  //   this.ctx.beginPath();
  //   this.ctx.moveTo(event.offsetX, event.offsetY);
  // }

  // private stopDrawing() {
  //   this.isDrawing = false;
  // }

  // private draw(event: MouseEvent) {
  //   if (!this.isDrawing) {
  //     return;
  //   }

  //   this.ctx.lineTo(event.offsetX, event.offsetY);
  //   this.ctx.stroke();
  // }


  // openEditTools(): void {
  //   const sampleImage = document.getElementById('dem');
  //   this.showMarkerArea(sampleImage);
  // }

  // showMarkerArea(target: any) {
  //   const markerArea = new markerjs2.MarkerArea(target);
  //   markerArea.addEventListener("render", (event) => (target.src = event.dataUrl));
  //   markerArea.show();
  //   markerArea.settings.defaultColor = 'black';
  //   markerArea.uiStyleSettings.toolbarOverflowBlockStyleColorsClassName = "bg-white";
  //   markerArea.availableMarkerTypes = markerArea.ALL_MARKER_TYPES;
  //   markerArea.settings.defaultStrokeWidth = 1;

  //   this.setToolbarStyleing();
  // }

  // setToolbarStyleing() {
  //   Array.from(document.getElementsByClassName('__markerjs2__0_toolbar')).forEach((ele) => {
  //     ele.id = 'toolbar';
  //   });

  // //   Array.from(document.getElementsByClassName('__markerjs2__0_toolbox')).forEach((ele) => {
  // //     ele.id = 'toolbox';
  // //   });

  //   // toolBar sytle
  //   let bar = document.getElementById('toolbar');
  //   bar.style.position = 'sticky';
  //   bar.style.top = '0';
  //   bar.style.zIndex = '5';
  //   bar.style.borderTopLeftRadius = '0px';
  //   bar.style.borderTopRightRadius = '0px';


  //   bar.addEventListener('click', (event) => {
  //     Array.from(document.getElementsByClassName('__markerjs2__0_toolbox-button-row')).forEach((ele) => {
  //       ele.id = 'buttonRow';
  //       console.log(ele);
  //     });

  //     let row = document.getElementById('buttonRow');
  //     row.style.flexDirection = 'column';
  //     row.style.width = '40px';
  //   })


  //   // toolBox
  //   let box = document.getElementById('toolbox');
  //   box.style.position = 'fixed';
  //   box.style.top = '100px';
  //   box.style.display = 'flex';
  //   box.style.flexDirection = 'column';
  //   box.style.width = '100px';
  //   box.style.borderRadius = '0';



  //   box.addEventListener('click', (event) => {
  //     Array.from(document.getElementsByClassName('__markerjs2__0_toolbox-panel-row')).forEach((ele) => {
  //       ele.id = 'panelRow';
  //     });

  //     let panel = document.getElementById('panelRow');
  //     panel.style.position = 'fixed';
  //     panel.style.top = '40px';
  //   })
  // }

  // this.ctx = this.canvas.nativeElement.getContext('2d');

  // this.canvas.nativeElement.addEventListener('mousedown', (event) => {
  //   this.startDrawing(event);
  // });
  // this.canvas.nativeElement.addEventListener('mouseup', () => {
  //   this.stopDrawing();
  // });
  // this.canvas.nativeElement.addEventListener('mouseout', () => {
  //   this.stopDrawing();
  // });
  // this.canvas.nativeElement.addEventListener('mousemove', (event) => {
  //   this.draw(event);
  // });
  // // this.canvas = this.canvasRef.nativeElement;
  // // this.ctx = this.canvas.getContext('2d');

  // // this.setCanvasBackground();
  // onDraw(point: { x: number, y: number }) {
  //   console.log(point.x, point.y);
  //   this.ctx.fillStyle = 'black';
  //   console.log(this.ctx.fillStyle);
  //   this.ctx.fillRect(point.x, point.y, 1,1);
  // }

  // private setCanvasBackground() {
  //   this.ctx.fillStyle = "white";
  //   this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  // }



  // saveHtmlAsPNG() {
  //   let node = document.getElementById('myDiv');
  //   htmlToImage.toPng(node)
  //     .then(function (dataUrl) {
  //       var img = new Image();
  //       img.src = dataUrl;
  //       img.style.width = '100vw'
  //       document.body.appendChild(img);
  //       window.open(img.src)
  //     })
  //     .catch(function (error) {
  //       console.error('oops, something went wrong!', error);
  //     });
  // }
