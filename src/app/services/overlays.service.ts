import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class overlaysService {
  loading = false;
   windowScrollTop() {
    window.scrollTo(0, 0);
   }

   onEvent(event: Event) {
      event.stopPropagation();
    }

    getClientWidth(id: string) {
      return document.getElementById(id).clientWidth;
    }
    getClientHeight(id: string) {
      return document.getElementById(id).clientHeight;
    }

    getElement(id: string) {
      return document.getElementById(id);
    }

    addClasslist(id: string, classList: string) {
      document.getElementById(id).classList.add(classList);
    }
  
    removeClasslist(id: string, classList: string) {
      document.getElementById(id).classList.remove(classList);
    }   

    squareRows(id: string, index: number) {
       return `
       <div id="row${id}${index}" class="d_flex" style="width: 100%">   
       </div>
    `;
    }


    squareColumns(totalColumns: number, i: number, j: number) {
      return `
      <div id="square${i}${j}" style="border-top: 1px solid #c6c3c3;
      border-right: 1px solid #c6c3c3;
      width: ${100 / totalColumns}%; aspect-ratio: 1 / 1">       
      </div>
      `;
   }

    lines() {
      return `
      <div style="width: 100%; height: 1px; background: #c6c3c3; margin-bottom: 4.7%; margin-top: 4.7%;">
      </div>
      `;
    }

}