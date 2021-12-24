import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VisualizerRoutingModule } from './visualizer-routing.module';
import { VisualizerComponent } from './visualizer.component';


@NgModule({
  declarations: [VisualizerComponent],
  imports: [
    CommonModule,
    VisualizerRoutingModule
  ]
})
export class VisualizerModule { }
