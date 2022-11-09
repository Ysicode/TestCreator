import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTestheadComponent } from './edit-testhead.component';

describe('EditTestheadComponent', () => {
  let component: EditTestheadComponent;
  let fixture: ComponentFixture<EditTestheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTestheadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTestheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
