import { makeBindingParser } from '@angular/compiler';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { collection, collectionData, doc, Firestore } from '@angular/fire/firestore';
import { NgForm } from '@angular/forms';
import { deleteDoc } from '@firebase/firestore';
import { ArrowType } from 'markerjs2';
import { Observable } from 'rxjs';
import { EditComponent } from 'src/app/add/edit/edit.component';
import { dataTransferService } from 'src/app/services/dataTransfer.service';
import { overlaysService } from 'src/app/services/overlays.service';


@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  providers: [overlaysService, dataTransferService]
})

export class QuestionsComponent implements OnInit {
  @ViewChild(EditComponent, { static: true }) editComp: EditComponent;
  @ViewChild("search") searchInput: ElementRef;

  //variables for the Questions list view
  // dataFromFirestore$: Observable<any>;
  // testHeadFromFirestore$: Observable<any>;
  filteredQuestions = [];
  loaded = false;

  currentQuestion: any;
  currentAnswer: any;
  currentId: string;
  public totalQuestionsNumber: number = 0;
  public infoOverlay: boolean = false;

  // variables for the new question window
  editMode: boolean = false;
  overlay: boolean = false;

  //multi used variables
  currentTestPoints: number = 0;
  currentTestTime: number = 0;

  //variables for the preview window
  @ViewChild("rangeSliderForm") rangebars: NgForm;
  addedToTest = [];
  dinA4Pages = [];
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
  wrongPassword: boolean = false;
  logedIn: Boolean = false;
  file: any;
  sampleSolution = false;

  // Filter And Search variables
  openFilter = false;
  search = false;
  searchactive = false;
  currentSearch = '';
  //Filter Variables

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

  constructor(private firestore: Firestore, public service: overlaysService, public data: dataTransferService) { }
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


  async ngOnInit(): Promise<void> {
    await this.data.loadtestHead();
    await this.data.loadSubjectsAndClasses();
    await this.data.loadQuestions();
    await this.getCurrentTestFromLocalStorage();
  }

  getTotalQuestionNumber() {
    this.totalQuestionsNumber = 0;
    for (let i = 0; i < this.data.loadedQuestions.length; i++) {
      if (!document.getElementById(`questionListView${i}`).classList.contains('d_none')) {
        this.totalQuestionsNumber++
      }
    }
  }

  addCurrentTestToLocalStorage() {
    localStorage.setItem("currentTest", JSON.stringify(this.test));
  }

  async getCurrentTestFromLocalStorage() {
    if (!localStorage.getItem('currentTest')) return
    this.service.loading = true;
    let loadedTestFromStorage = localStorage.getItem('currentTest');
    this.test = JSON.parse(loadedTestFromStorage);
    setTimeout(() => {
      this.setQuestionNumber();
      this.renderSquaresAndLinesOfQuestionsInTest();
      this.styleAddedQuestionsInListViewAfterLoadingTestData();
      this.service.loading = false;
    }, 1000);
  }

  styleAddedQuestionsInListViewAfterLoadingTestData() {
    for (let a = 0; a < this.data.loadedQuestions.length; a++) {
      for (let i = 0; i < this.test.pages.length; i++) {
        for (let j = 0; j < this.test.pages[i][0].length; j++) {
          if (this.test.pages[i][0][j].id == this.data.loadedQuestions[a]['id']) {
            this.styleAddButton(a, 'add_styling', this.data.loadedQuestions[a]['schwierigkeit']);
          }
        }
      }
    }
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
      this.currentId = '2883993553545543545353345'
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
    this.addCurrentTestToLocalStorage();
  }

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
      this.addCurrentTestToLocalStorage();
    }, 200);
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

  deleteEmptyPages(i: number) {
    if (this.pageIsEmpty(i) && i != 0) {
      this.test.pages.pop();
    }
  }

  async moveUpQuestionAndDeleteEmptyPages(i: number, paperHeight: number) {
    if (!this.pageIsEmpty(i) && await this.spaceForFirstQuestion(i, paperHeight)) {
      const question = this.test.pages[i][0].shift();
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
    let contentHeight = i == 1 ? this.getHeight('testhead') : 0;
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
   
    // await this.stopLoop(10);
    // this.question_number = 0;
    // for (let i = 0; i < this.test.pages.length; i++) {
    //   for (let j = 0; j < this.test.pages[i][0].length; j++) {
    //     this.question_number++;
    //     this.stopLoop(5);
    //     let questionNumber = this.element(`question_number${i}${j}`)
    //     questionNumber.innerHTML = `${this.question_number}`;
    //     questionNumber.classList.add('test_number_opacity_zero');
    //   }
    // }
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
      // console.log('startheight', startHeight, 'e<Client', e.clientY, 'startY', startY);

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
    this.test.pages[pageIndex][0][pagePosition]['questionHeight'] = question.style.height;
    this.addCurrentTestToLocalStorage();
  }

  /**
   * this function is used to set an interval to multiple call 2 functions while resizing a question
   * @param mouse - is a string parameter to either start or stop the interval
   */
  checkHeightsInterval(mode: string) {
    if (mode === 'start') {
      this.checkHeightsAndSetQuestionNumberInterval = setInterval(() => {
        this.checkHeightOfAllPreviewQuestions();
        console.log('hello');
        this.setQuestionNumber();
      }, 70)
    }
    if (mode === 'stop') {
      clearInterval(this.checkHeightsAndSetQuestionNumberInterval);
      console.log('stop');
    }
  }

  resizeImage(pageIndex: number, pagePosition: number, questionPosition: number) {
    this.currentEditImage = `${pageIndex}${pagePosition}${questionPosition}`
    let startX: number, startWidth: number;
    let resizer = this.element(`resizeImage${this.currentEditImage}`);
    let image = this.element(`img_edit_wrapper${this.currentEditImage}`);
    let question = this.element(`question${pageIndex}${pagePosition}`);
    let questionWidth = this.getWidth(`question${pageIndex}${pagePosition}`);
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
    this.test.pages[pageIndex][0][pagePosition]['frage']['blocks'][questionPosition]['width'] = image.style.width;
    this.addCurrentTestToLocalStorage();
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
      for (let j = 0; j < this.test.pages[i][0].length; j++) {
        await this.stopLoop(100)
        if (this.test.pages[i][0][j]['whitespace']) {
          await this.getSquaresAndLines(i, j);
        }
      }
    }
  }

  pageIsEmpty(i: number) {
    return this.test.pages[i][0].length == 0;
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




  openEditTestHeadComponent() {
    this.editTesthead = true;
  }

  log(info: any) {
console.log(info)
  }

  stopLoop = (time: any) => {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  // closeEditTestHead() {
  //   this.editTesthead = false;
  // }

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
