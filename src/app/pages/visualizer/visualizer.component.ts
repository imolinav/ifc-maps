import { AfterContentInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IfcService } from 'src/app/services/ifc/ifc.service';
import { IfcSpace, IfcStair, IfcWall } from 'web-ifc';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss']
})
export class VisualizerComponent implements OnInit, AfterContentInit {

  ifcId: string;
  spaces: IfcStair[];
  itemSelected: number;

  @ViewChild('threeContainer', { static: true }) container?: ElementRef;

  constructor(private ifcService: IfcService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(res => {
      this.ifcId = res['id'];
    })
  }

  async ngAfterContentInit() {
    const container = this.getContainer();
    if(container) { 
      this.ifcService.startIfcViewer(container);
      await this.ifcService.loadIfcUrl(this.ifcId);
      // TODO: check this Promise so it doesn't block the previous one
      this.spaces = await this.ifcService.getSpaces();
    }
  }

  private getContainer() {
    if (!this.container) return null;
    return this.container.nativeElement as HTMLElement;
  }

  highlightElement(elementId: number, on: boolean) {
    if(on) {
      this.ifcService.highlightElement(elementId);
    } else {
      this.ifcService.removeHighlight();
    }
  }

  selectElement(elementId: number) {
    if(this.itemSelected && this.itemSelected === elementId) {
      this.ifcService.unselectElement();
      this.itemSelected = null;
    } else {
      this.ifcService.selectElement(elementId);
      this.itemSelected = elementId;
    }
  }

}
