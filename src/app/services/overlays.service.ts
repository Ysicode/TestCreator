import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class overlaysService {

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

    squareColumns() {
       return `
       <div style="border-top: 1px solid grey;
       border-right: 1px solid grey;
       width: 5mm;
       height: 5mm;">       
       </div>
       `;
    }

    squareRows(pageIndex: number, pagePosition: number, index: number) {
       return `
       <div id="row${pageIndex}${pagePosition}${index}" class="d_flex">   
       </div>
    `;
    }

    lines() {
      return `
      <div style="width: 100%; height: 1px; background: grey; margin-bottom: 5mm; margin-top: 5mm;">
      </div>
      `;
    }

}