import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredDocsComponent } from './stored-docs.component';

describe('StoredDocsComponent', () => {
  let component: StoredDocsComponent;
  let fixture: ComponentFixture<StoredDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoredDocsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoredDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
