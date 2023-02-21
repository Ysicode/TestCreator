import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { dataTransferService } from '../services/dataTransfer.service';

@Component({
  selector: 'app-info-overlay',
  templateUrl: './info-overlay.component.html',
  styleUrls: ['./info-overlay.component.scss'],
  providers: [dataTransferService]
})

export class InfoOverlayComponent implements OnInit {

  constructor(public dataService: dataTransferService) { }

  @Input() questionID: string;
  @Output() closeInfoOverlay = new EventEmitter<boolean>();

  loading: boolean = false;
  @Input() deleteQuestionOverlay: boolean;

  ngOnInit(): void {
  }

  closeDeleteQuestionOverlay() {
    this.closeInfoOverlay.emit();
    this.deleteQuestionOverlay = false;
  }

  deleteQuestion() {
    this.loading = true;
    this.dataService.deletedata(this.questionID);
    setTimeout(() => {
      this.closeInfoOverlay.emit();
      this.deleteQuestionOverlay = false;
      this.loading = false;
    }, 2000);
  }

  logData() {
    console.log(this.dataService.loaded)
  }



}
