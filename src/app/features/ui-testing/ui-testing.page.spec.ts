import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UITestingPage } from './ui-testing.page';

describe('UITestingPage', () => {
  let component: UITestingPage;
  let fixture: ComponentFixture<UITestingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UITestingPage],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UITestingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
