import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoRootModule } from 'src/app/transloco-root.module';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search.component';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';


@NgModule({
  declarations: [SearchComponent],
  imports: [
    CommonModule,
    SearchRoutingModule,
    LeafletModule,
    TranslocoRootModule
  ]
})
export class SearchModule { }
