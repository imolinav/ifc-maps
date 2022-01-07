import {
  AfterContentInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IfcService } from 'src/app/services/ifc/ifc.service';
import {
  IfcBeam,
  IfcBuildingStorey,
  IfcColumn,
  IfcDoor,
  IfcFurnishingElement,
  IfcPile,
  IfcRailing,
  IfcRamp,
  IfcSlab,
  IfcSpace,
  IfcStair,
  IfcWall,
  IfcWindow,
} from 'web-ifc';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent implements OnInit, AfterContentInit {
  ifcId: string;
  spaces: (
    | IfcSpace
    | IfcWall
    | IfcColumn
    | IfcStair
    | IfcFurnishingElement
    | IfcBeam
    | IfcSlab
    | IfcRailing
    | IfcDoor
    | IfcWindow
    | IfcPile
    | IfcRamp
    | IfcBuildingStorey
  )[];
  itemSelected: any;
  loading = false;
  elementsExpanded = false;
  optionsExpanded = false;
  infoExpanded = false;
  elementsHidden: number[] = [];
  transparent: boolean = true;
  elementClip: boolean = false;
  spaceTypes: { type: string; obj: number }[];

  @ViewChild('threeContainer', { static: true }) container?: ElementRef;

  constructor(private ifcService: IfcService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((res) => {
      this.ifcId = res['id'];
    });
    this.spaceTypes = this.ifcService.getSpaceTypes();
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
      this.spaces = await this.ifcService.getSpaces('STAIR');
    }
    container.ondblclick = async () => {
      const element = await this.ifcService.pick();
      console.log(element);
      this.elementClip = false;
      if(this.itemSelected) {
        this.ifcService.showElement([this.itemSelected.expressID], false);
      }
      if(element !== -1) {
        this.itemSelected = element;
      } else {
        this.itemSelected = null;
        this.ifcService.unselectElement();
        this.elementClip = false;
      }
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

  highlightElement(expressId: number, on: boolean) {
    if (on) {
      this.ifcService.highlightElement([expressId]);
    } else {
      this.ifcService.removeHighlights();
    }
  }

  async selectElement(expressId: number) {
    this.ifcService.unselectElement();
    if (this.itemSelected && this.itemSelected.expressID === expressId) {
      this.itemSelected = null;
    } else {
      if(this.elementsHidden.indexOf(expressId) === -1) {
        this.ifcService.selectElement(expressId);
      }
      this.itemSelected = await this.ifcService.getElementSelected(expressId);
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

  toggleTransparency(transparencyValue: number) {
    this.transparent = !this.transparent;
    this.ifcService.changeTransparency(this.transparent, transparencyValue/100);
  }

  updateTransparency(transparencyValue: number) {
    this.ifcService.changeTransparency(this.transparent, transparencyValue/100);
  }

  toggleClippingPlane() {
    this.elementClip = !this.elementClip;
    this.ifcService.toggleClippingPlane(this.elementClip, this.itemSelected.expressID);
  }

  toggleElement() {
    const index = this.elementsHidden.indexOf(this.itemSelected.expressID);
    if(index >= 0) {
      this.elementsHidden.splice(index, 1);
      this.ifcService.showElement([this.itemSelected.expressID], true);
    } else {
      this.elementsHidden.push(this.itemSelected.expressID);
      this.ifcService.hideElement([this.itemSelected.expressID]);
    }
  }
}
