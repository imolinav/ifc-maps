import { Component } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tfm-viqui';
  selectLang = 'val';
  constructor(private translocoService: TranslocoService) {
    this.selectLanguage();
  }

  selectLanguage(language: string = this.selectLang) {
    this.translocoService.setActiveLang(language);
  }
}
