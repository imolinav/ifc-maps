import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TranslocoRootModule } from 'src/app/transloco-root.module';

import { VisualizerRoutingModule } from './visualizer-routing.module';
import { VisualizerComponent } from './visualizer.component';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [VisualizerComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoRootModule,
    VisualizerRoutingModule,
    DragDropModule
  ]
})
export class VisualizerModule { }
