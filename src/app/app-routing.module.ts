import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { QuestionsComponent } from './questions-list/questions/questions.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: QuestionsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
