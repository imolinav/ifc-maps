import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { MarkerService } from './services/marker/marker.service';
import { PopupService } from './services/popup/popup.service';
import { ShapeService } from './services/shape/shape.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    MarkerService,
    PopupService,
    ShapeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
