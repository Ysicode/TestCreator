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

  @Output() closeInfoOverlay = new EventEmitter<boolean>();

  @Input() questionID: string;
  @Input() deleteQuestionOverlay: boolean;
  @Input() newTestOverlay: boolean;
  @Input() deleteSubuserOverlay: Boolean;
  @Input() deleteSubuserId: string;

  ngOnInit(): void {
  }

  closeDeleteQuestionOverlay() {
    this.closeInfoOverlay.emit();
    this.deleteQuestionOverlay = false;
  }

  closeNewTestOverlay() {
    this.closeInfoOverlay.emit();
    this.newTestOverlay = false;
  }

  closeDeleteSubuserOverlay() {
    this.closeInfoOverlay.emit();
    this.deleteSubuserOverlay = false;
  }

  deleteQuestion() {
    this.loading = true;
    this.data.deletedata(this.questionID);
    setTimeout(() => {
      this.closeInfoOverlay.emit();
      this.deleteQuestionOverlay = false;
      this.loading = false;
    }, 2000);
  }

  deleteTest() {
    localStorage.removeItem('addedQuestions');
    localStorage.removeItem('currentTest');
    location.reload();
    setTimeout(() => {
      this.closeInfoOverlay.emit();
      this.newTestOverlay = false;
    }, 1000);
  }

  deleteSubuser() {
    this.data.deleteSubuser(this.deleteSubuserId)
    location.reload();
    setTimeout(() => {
      this.closeInfoOverlay.emit();
      this.deleteSubuserOverlay = false;
    }, 1000);
  }
}
