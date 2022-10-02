import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import EditorJS from '@editorjs/editorjs';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, AfterViewInit {

  @ViewChild('editor', { read: ElementRef, static: true })
  editorElement: ElementRef;
  private editor: EditorJS;
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initializeEditor();
}

private initializeEditor(): void {
  this.editor = new EditorJS({
    minHeight: 200,
    holder: this.editorElement.nativeElement
  })
}

}
