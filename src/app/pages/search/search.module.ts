import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoRootModule } from 'src/app/transloco-root.module';
import { MaterialModule } from 'src/app/material.module';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search.component';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';


@NgModule({
  declarations: [SearchComponent],
  imports: [
    CommonModule,
    LeafletModule,
    MaterialModule,
    SearchRoutingModule,
    TranslocoRootModule
  ]
})
export class SearchModule { }
