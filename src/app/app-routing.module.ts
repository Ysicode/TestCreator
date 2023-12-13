import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { BacklogComponent } from './backlog/backlog.component';
import { DemoComponent } from './login/demo/demo.component';
import { LoginComponent } from './login/login.component';
import { QuestionsComponent } from './questions-list/questions/questions.component';
import { StoredDocsComponent } from './stored-docs/stored-docs.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: QuestionsComponent },
  { path: 'ablage', component: StoredDocsComponent },
  { path: 'account', component: AccountComponent },
  { path: 'backlog', component: BacklogComponent },
  { path: 'demo', component: DemoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
