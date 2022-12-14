import { Component, OnInit } from '@angular/core';
import { overlaysService } from 'src/app/services/overlays.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],

})
export class SpinnerComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

}
