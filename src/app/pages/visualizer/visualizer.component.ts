import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IfcService } from 'src/app/services/ifc/ifc.service';
import { IfcElement, IGNORED_TYPES, IfcElements } from './visualizer.constants';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent implements OnInit, AfterContentInit {
  ifcId: string;
  spaces: IfcElement[];
  itemSelected: any;
  loading = false;
  elementsExpanded = false;
  transparencyExpanded = false;
  layersExpanded = false;
  infoExpanded = false;
  elementsHidden: number[] = [];
  transparent = true;
  elementClip = false;
  planeClip = false;
  floors: IfcElement[];
  buildingFloors: { expressID: number; floor: number; height: number }[];
  currentFloor = 0;
  spaceTypes: { type: string; obj: number }[] = [];
  fileUrl = 'assets/ifc/';

  @ViewChild('threeContainer', { static: true }) container?: ElementRef;
  @ViewChild('planeContainer') planeContainer?: ElementRef;

  constructor(private ifcService: IfcService, private route: ActivatedRoute, private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.params.subscribe((res) => {
      this.ifcId = res['id'];
      this.spaceTypes = this.ifcService.getSpaceTypes(
        `${this.fileUrl}${this.ifcId}.ifc`
      );
    });
  }

  async ngAfterContentInit() {
    if (this.ifcId) {
      this.loadModel(`${this.fileUrl}${this.ifcId}.ifc`);
    }
  }

  private async loadModel(url: string) {
    this.loading = true;
    const container = this.getContainer();
    if (container) {
      this.ifcService.startIfcViewer(container);
      await this.ifcService.loadIfcUrl(url);
      this.spaces = await this.ifcService.getSpaces('IFCSPACE');
      console.log(this.spaces);
      this.floors = await this.ifcService.getSpaces('IFCBUILDINGSTOREY');
      this.floors.sort(
        (a, b) => 0 - (a.Elevation.value > b.Elevation.value ? -1 : 1)
      );
      this.buildingFloors = this.calculateFloors(this.floors);
    }
    container.ondblclick = async () => {
      const element = await this.ifcService.pick();
      // console.log(element);
      this.elementClip = false;
      this.planeClip = false;
      if (
        this.itemSelected &&
        this.elementsHidden.indexOf(this.itemSelected.expressID) === -1
      ) {
        this.ifcService.showElement([this.itemSelected.expressID], false);
      }
      if (element !== -1) {
        this.itemSelected = element;
      } else {
        this.itemSelected = null;
        this.ifcService.unselectElement();
      }
    };
    this.loading = false;
  }

  async getSpaces(type: string) {
    this.spaces = await this.ifcService.getSpaces(type);
  }

  private getContainer() {
    if (!this.container) return null;
    return this.container.nativeElement as HTMLElement;
  }

  private getPlaneContainer() {
    if (!this.planeContainer) return null;
    return this.planeContainer.nativeElement as HTMLElement;
  }

  highlightElement(expressId: number, on: boolean) {
    if (on) {
      this.ifcService.highlightElement([expressId]);
    } else {
      this.ifcService.removeHighlights();
    }
  }

  selectElement(expressId: number) {
    this.ifcService.unselectElement();
    this.ifcService.removeAllClippingPlanes();
    this.elementClip = false;
    this.planeClip = false;
    if (this.itemSelected && this.itemSelected.expressID === expressId) {
      this.itemSelected = null;
    } else {
      this.ifcService.getElementSelected(expressId).then((res) => {
        this.itemSelected = res;
        const floor = this.buildingFloors.find(
          (item) => item.expressID === this.itemSelected.expressID
        );
        if (floor) {
          this.selectFloor(floor);
        } else if(this.elementsHidden.indexOf(expressId) === -1) {
          this.ifcService.selectElement(expressId);
        }
      });
    }
  }

  private selectFloor(floor: {
    expressID: number;
    floor: number;
    height: number;
  }) {
    this.elementClip = true;
    const selectedFloor = this.buildingFloors.find(
      (f) => f.floor === floor.floor
    );
    this.currentFloor = selectedFloor.floor;
    this.ifcService.toggleFloorClippingPlane(
      selectedFloor.height,
      this.buildingFloors[0].height
    );
  }

  toggleElements() {
    this.elementsExpanded = !this.elementsExpanded;
  }

  toggleTransparency() {
    this.transparencyExpanded = !this.transparencyExpanded;
  }

  updateTransparency(transparencyValue: number, toggle?: boolean) {
    if (toggle) {
      this.transparent = !this.transparent;
    }
    this.ifcService.changeTransparency(
      this.transparent,
      transparencyValue / 100
    );
  }

  toggleLayers() {
    this.layersExpanded = !this.layersExpanded;
  }

  toggleClippingPlane() {
    this.elementClip = !this.elementClip;
    this.ifcService.toggleClippingPlane(
      this.elementClip,
      this.itemSelected.expressID
    );
    if (
      !this.elementClip &&
      this.buildingFloors.find(
        (item) => item.expressID === this.itemSelected.expressID
      )
    ) {
      this.itemSelected = null;
    }
  }

  toggleElement() {
    const index = this.elementsHidden.indexOf(this.itemSelected.expressID);
    if (index >= 0) {
      this.elementsHidden.splice(index, 1);
      this.ifcService.showElement([this.itemSelected.expressID], true);
    } else {
      this.elementsHidden.push(this.itemSelected.expressID);
      this.ifcService.hideElement([this.itemSelected.expressID]);
    }
  }

  private calculateFloors(floors: IfcElement[]) {
    let sub = floors.findIndex((x) => x.Elevation.value >= 0);
    let buildingFloors: { expressID: number; floor: number; height: number }[] =
      [];
    if (sub > 0) {
      for (let i = 0; i < sub; i++) {
        const floorNum = Number(floors[i].Name.value.match(/-?\d+/)[0])
          ? Number(floors[i].Name.value.match(/-?\d+/)[0])
          : i - sub;
        buildingFloors.push({
          expressID: floors[i].expressID,
          floor: floorNum,
          height: floors[i].Elevation.value,
        });
      }
    }
    console.log(floors);
    for (let j = sub; j < floors.length; j++) {
      /* const floorNum = Number(floors[j].Name.value.match(/-?\d+/)[0])
        ? Number(floors[j].Name.value.match(/-?\d+/)[0])
        : j - sub; */
      buildingFloors.push({
        expressID: floors[j].expressID,
        floor: j,
        height: floors[j].Elevation.value,
      });
    }
    this.currentFloor = buildingFloors[sub].floor;
    return buildingFloors;
  }

  toggleFloor(floor: number) {
    const floorSelected = this.buildingFloors.find((f) => f.floor === floor);
    this.selectElement(floorSelected.expressID);
  }

  floorUp() {
    const selectedFloor = this.buildingFloors.find(
      (f) => f.floor > this.currentFloor
    );
    if (selectedFloor) {
      this.currentFloor = selectedFloor.floor;
      this.selectElement(selectedFloor.expressID);
    }
  }

  floorDown() {
    for (let i = this.buildingFloors.length - 1; i >= 0; i--) {
      if (this.buildingFloors[i].floor < this.currentFloor) {
        this.currentFloor = this.buildingFloors[i].floor;
        this.selectElement(this.buildingFloors[i].expressID);
        break;
      }
    }
  }

  checkIfFloorSelected() {
    return this.buildingFloors.some(
      (floor) => floor.expressID === this.itemSelected.expressID
    );
  }

  mySortingFunction = (a, b) => {
    return a.key > b.key ? -1 : 1;
  };

  isObject(item: any) {
    return typeof item === 'object';
  }

  planeFromClip() {
    this.planeClip = !this.planeClip;
    this.ref.detectChanges();
    if (this.planeClip) {
      const planeContainer = this.getPlaneContainer();
      if (planeContainer) {
        this.ifcService.startPlaneViewer(planeContainer);
        this.ifcService.loadPlaneUrl(`${this.fileUrl}${this.ifcId}.ifc`);
      }
    } else {
      this.ifcService.removePlaneView();
    }
  }

  refreshPlane() {
    this.ifcService.createPlaneFromClip();
  }
}
