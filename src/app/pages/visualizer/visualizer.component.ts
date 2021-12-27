import { AfterContentInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IfcService } from 'src/app/services/ifc/ifc.service';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss']
})
export class VisualizerComponent implements OnInit, AfterContentInit {

  ifc: IfcService;
  ifcId: string;

  @ViewChild('threeContainer', { static: true }) container?: ElementRef;

  constructor(service: IfcService, private route: ActivatedRoute) {
    this.ifc = service;
  }

  ngOnInit(): void {
    this.route.params.subscribe(res => {
      this.ifcId = res['id'];
    })
  }

  ngAfterContentInit() {
    const container = this.getContainer();
    if(container) { 
      this.ifc.startIfcViewer(container);
      this.ifc.loadIfcUrl(this.ifcId);
    }
  }

  private getContainer() {
    if (!this.container) return null;
    return this.container.nativeElement as HTMLElement;
  }

}
