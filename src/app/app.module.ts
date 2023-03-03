import { Directive, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAnalytics,getAnalytics,ScreenTrackingService,UserTrackingService } from '@angular/fire/analytics';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideDatabase,getDatabase } from '@angular/fire/database';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';
import { provideStorage,getStorage } from '@angular/fire/storage';
import { QuestionsComponent } from './questions-list/questions/questions.component';
import { FormsModule } from '@angular/forms';
import { EditComponent } from './add/edit/edit.component';
import { EditorComponent } from './editor/editor.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HeaderComponent } from './header/header.component';
import { EditTestheadComponent } from './edit-testhead/edit-testhead.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpinnerComponent } from './sharedComps/spinner/spinner.component';
import { MatIconModule } from '@angular/material/icon';
import { InfoOverlayComponent } from './info-overlay/info-overlay.component';
import { LoginComponent } from './login/login.component';
import { StoredDocsComponent } from './stored-docs/stored-docs.component';
import { AccountComponent } from './account/account.component';
import { EditUserComponent } from './account/edit-user/edit-user.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    QuestionsComponent,
    EditComponent,
    EditorComponent,
    EditTestheadComponent,
    SpinnerComponent,
    InfoOverlayComponent,
    LoginComponent,
    StoredDocsComponent,
    AccountComponent,
    EditUserComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatIconModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ],
  providers: [
    ScreenTrackingService,UserTrackingService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
