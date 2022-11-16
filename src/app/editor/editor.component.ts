import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import EditorJS from '@editorjs/editorjs';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, AfterViewInit {

  @ViewChild('questionEditor', { read: ElementRef, static: true })
  questionEditorElement: ElementRef;
  private questionEditor: EditorJS;

  @ViewChild('answerEditor', { read: ElementRef, static: true })
  answerEditorElement: ElementRef;
  private answerEditor: EditorJS;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initializeQuestionEditor();
    this.initializeAnswerEditor();
  }

  private initializeQuestionEditor(): void {
    this.questionEditor = new EditorJS({
      minHeight: 200,
      holder: this.questionEditorElement.nativeElement
    })
  }

  private initializeAnswerEditor() {
    this.answerEditor = new EditorJS({
      minHeight: 200,
      holder: this.answerEditorElement.nativeElement
    })
  }

}
