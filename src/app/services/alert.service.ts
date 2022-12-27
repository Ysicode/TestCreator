import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
alert = false;
  constructor() { }


  showAlert(alertText: any) {
    return `
        <div> 
        ${alertText}      
        </div>
      `;
  }
}
