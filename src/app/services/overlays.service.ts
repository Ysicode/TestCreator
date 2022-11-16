import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class overlaysService {

   windowScrollTop() {
    window.scrollTo(0, 0);
   }

}