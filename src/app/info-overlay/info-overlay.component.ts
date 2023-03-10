import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-info-overlay',
  templateUrl: './info-overlay.component.html',
  styleUrls: ['./info-overlay.component.scss'],
  providers: [dataTransferService]
})

export class InfoOverlayComponent implements OnInit {

  constructor(public data: dataTransferService) { }

  loading: boolean = false;

  @Output() closeTestDeleteOverlay = new EventEmitter<boolean>();
  @Output() closeQuestionDeleteOverlay = new EventEmitter<boolean>();
  @Output() closeSubuserDeleteOverlay = new EventEmitter<boolean>();


  @Input() questionID: string;
  @Input() deleteQuestionOverlay: boolean;
  @Input() newTestOverlay: boolean;

  
  @Input() deleteSubuserOverlay: Boolean;
  @Input() deleteSubuserId: string;

  ngOnInit(): void {
  }

  closeDeleteQuestionOverlay() {
    this.closeQuestionDeleteOverlay.emit();
    this.deleteQuestionOverlay = false;
  }

  closeNewTestOverlay() {
    this.closeTestDeleteOverlay.emit();
    this.newTestOverlay = false;
  }

  closeDeleteSubuserOverlay() {
    this.closeSubuserDeleteOverlay.emit();
    this.deleteSubuserOverlay = false;
  }

  deleteQuestion() {
    this.loading = true;
    this.data.deletedata(this.questionID);
    this.deleteQuestionOverlay = false;
    setTimeout(() => {

      this.closeQuestionDeleteOverlay.emit();
      this.loading = false;
    }, 2000);
  }

  deleteTest() {
    localStorage.removeItem('addedQuestions');
    localStorage.removeItem('currentTest');
    location.reload();
    setTimeout(() => {
      this.newTestOverlay = false;
      this.closeTestDeleteOverlay.emit();
    }, 1000);
  }

  deleteSubuser() {
    this.data.deleteSubuser(this.deleteSubuserId)
    location.reload();
    this.deleteSubuserOverlay = false;
    setTimeout(() => {

      this.closeSubuserDeleteOverlay.emit();
    }, 1000);
  }
}
