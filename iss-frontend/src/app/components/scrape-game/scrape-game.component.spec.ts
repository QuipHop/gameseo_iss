import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrapeGameComponent } from './scrape-game.component';

describe('ScrapeGameComponent', () => {
  let component: ScrapeGameComponent;
  let fixture: ComponentFixture<ScrapeGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrapeGameComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScrapeGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
