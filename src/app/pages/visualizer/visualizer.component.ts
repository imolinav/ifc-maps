import {
  AfterContentInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IfcService } from 'src/app/services/ifc/ifc.service';
import { IfcSpace, IfcStair, IfcWall } from 'web-ifc';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent implements OnInit, AfterContentInit {
  ifcId: string;
  spaces: (IfcStair | IfcSpace | IfcWall)[];
  itemSelected: number;
  loading = false;
  elementsExpanded = true;
  optionsExpanded = false;
  transparent: boolean = true;

  @ViewChild('threeContainer', { static: true }) container?: ElementRef;

  constructor(
    private ifcService: IfcService, 
    private route: ActivatedRoute,
    private translocoService: TranslocoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((res) => {
      this.ifcId = res['id'];
    });
  }

  async ngAfterContentInit() {
    if (this.ifcId) {
      this.loadModel(`assets/ifc/${this.ifcId}.ifc`);
    }
  }

  async loadModel(url: string) {
    this.loading = true;
    const container = this.getContainer();
    if (container) {
      this.ifcService.startIfcViewer(container);
      await this.ifcService.loadIfcUrl(url);
      this.spaces = await this.ifcService.getSpaces('stair');
    }
    this.loading = false;
  }

  async getSpaces(type: string) {
    this.spaces = await this.ifcService.getSpaces(type);
  }

  private getContainer() {
    if (!this.container) return null;
    return this.container.nativeElement as HTMLElement;
  }

  highlightElement(elementId: number, on: boolean) {
    if (on) {
      this.ifcService.highlightElement(elementId);
    } else {
      this.ifcService.removeHighlight();
    }
  }

  selectElement(elementId: number) {
    if (this.itemSelected && this.itemSelected === elementId) {
      this.ifcService.unselectElement();
      this.itemSelected = null;
    } else {
      this.ifcService.selectElement(elementId);
      this.itemSelected = elementId;
    }
  }

  readModel(event) {
    const file = event.target.files[0];
    const ifcUrl = URL.createObjectURL(file);
    this.loadModel(ifcUrl);
  }

  expandElements() {
    this.optionsExpanded = false;
    this.elementsExpanded = !this.elementsExpanded;
  }

  expandOptions() {
    this.elementsExpanded = false;
    this.optionsExpanded = !this.optionsExpanded;
  }

  toggleTransparency() {
    this.transparent = !this.transparent;
    this.ifcService.toggleTransparency(this.transparent);
  }
}
