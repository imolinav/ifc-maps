import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';

import { HttpClientModule } from '@angular/common/http';
import { IfcService } from './services/ifc/ifc.service';
import { MarkerService } from './services/leaflet/marker/marker.service';
import { PopupService } from './services/leaflet/popup/popup.service';
import { ShapeService } from './services/leaflet/shape/shape.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslocoRootModule } from './transloco-root.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    TranslocoRootModule,
    BrowserAnimationsModule,
    MaterialModule
  ],
  providers: [
    IfcService,
    MarkerService,
    PopupService,
    ShapeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
