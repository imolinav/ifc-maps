import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisualizerComponent } from './visualizer.component';


const routes: Routes = [
  { path: ':id', component: VisualizerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VisualizerRoutingModule { }
