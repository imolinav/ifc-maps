import * as THREE from 'three';
import { DoubleSide, MeshLambertMaterial, Object3D, Vector3 } from 'three';
import {
  LoaderSettings,
  IFCSPACE,
  IFCWALL,
  IFCSTAIR,
  IFCCOLUMN,
  IfcSpace,
  IfcWall,
  IfcStair,
  IfcColumn,
  IFCFURNISHINGELEMENT,
  IFCBEAM,
  IFCSLAB,
  IFCRAILING,
  IFCWINDOW,
  IFCBUILDINGSTOREY,
  IfcFurnishingElement,
  IfcBeam,
  IfcSlab,
  IfcRailing,
  IfcWindow,
  IfcBuildingStorey,
  IfcDoor,
  IfcRamp,
  IfcPile,
  IFCDOOR,
  IFCPILE,
  IFCRAMP,
} from 'web-ifc';
import { IfcViewerAPI } from 'web-ifc-viewer';

export class IfcService {
  currentModel = -1;
  ifcViewer?: IfcViewerAPI;
  container?: HTMLElement;
  modelId: number;
  scene: Object3D;
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
  spacesPromise: Promise<IfcStair[]>;
  onSelectActions: ((modelID: number, id: number) => void)[];
  ifcProductsType: { [modelID: number]: { [expressID: number]: number } };
  webConfig: LoaderSettings = {
    COORDINATE_TO_ORIGIN: true,
    USE_FAST_BOOLS: false,
  };
  spacesTypes = [
    { type: 'SPACE', obj: IFCSPACE },
    { type: 'WALL', obj: IFCWALL },
    { type: 'STAIR', obj: IFCSTAIR },
    { type: 'COLUMN', obj: IFCCOLUMN },
    { type: 'FURNISHING_ELEMENT', obj: IFCFURNISHINGELEMENT },
    { type: 'BEAM', obj: IFCBEAM },
    { type: 'SLAB', obj: IFCSLAB },
    { type: 'RAILING', obj: IFCRAILING },
    { type: 'DOOR', obj: IFCDOOR },
    { type: 'WINDOW', obj: IFCWINDOW },
    { type: 'PILE', obj: IFCPILE },
    { type: 'RAMP', obj: IFCRAMP },
    { type: 'BUILDING_STOREY', obj: IFCBUILDINGSTOREY },
  ];

  constructor() {
    this.onSelectActions = [];
    this.ifcProductsType = {};
  }

  startIfcViewer(container: HTMLElement) {
    if (!container) return this.notFoundError('container');
    this.container = container;
    this.setupIfcScene();
    this.setupInputs();
  }

  setupIfcScene() {
    if (!this.container) return;
    const preselectMaterial = this.newMaterial(0xfbc02d, 0.2);
    const selectMaterial = this.newMaterial(0xfbc02d, 0.5);
    this.ifcViewer = new IfcViewerAPI({
      container: this.container,
      preselectMaterial,
      selectMaterial,
    });
    this.ifcViewer?.addAxes();
    this.ifcViewer?.IFC.setWasmPath('assets/wasm/');
    this.ifcViewer?.IFC.applyWebIfcConfig(this.webConfig);
    this.ifcViewer?.toggleClippingPlanes();
  }

  setupInputs() {
    if (!this.container) return;
    this.container.onclick = this.handleClick;
    this.container.onmousemove = this.handleMouseMove;
  }

  subscribeOnSelect(action: (modelID: number, id: number) => void) {
    this.onSelectActions.push(action);
  }

  loadIfc(file: File) {
    this.ifcViewer?.IFC.loadIfc(file, true);
  }

  async loadIfcUrl(url: string) {
    await this.ifcViewer?.IFC.loadIfcUrl(url, false).then((res) => {
      console.log(res);
      this.modelId = res.modelID;
      this.ifcViewer?.IFC.setModelTranslucency(res.modelID, true, 0.1, true);
    });
  }

  select(modelID: number, expressID: number, pick = true) {
    if (pick) this.ifcViewer?.IFC.pickIfcItemsByID(modelID, [expressID]);
    this.currentModel = modelID;
    this.onSelectActions.forEach((action) => action(modelID, expressID));
  }

  async getSpaces(type: string) {
    let obj: number;
    for (let item of this.spacesTypes) {
      if (item.type === type) {
        obj = item.obj;
        break;
      }
    }
    return await this.ifcViewer?.IFC.loader.ifcManager.getAllItemsOfType(
      0,
      obj,
      true
    );
  }

  toggleClippingPlane(on: boolean) {
    if(on) {
      /**
       * Falta que dependiendo la cara del modelo que selecciono el valor de la normal sea positivo o negativo
       */

      const selection = this.ifcViewer?.IFC.selection.mesh;
      const x = Math.abs(selection.geometry.boundingBox.max.x - selection.geometry.boundingBox.min.x);
      const y = Math.abs(selection.geometry.boundingBox.max.y - selection.geometry.boundingBox.min.y);
      const z = Math.abs(selection.geometry.boundingBox.max.z - selection.geometry.boundingBox.min.z);

      const direction = -1;

      let normal: Vector3;
      if(x < y && x < z) {
        normal = new Vector3(direction, 0, 0);
      } else if(y < x && y < z) {
        normal = new Vector3(0, direction, 0);
      } else {
        normal = new Vector3(0, 0, direction);
      }

      const point = new Vector3(
        (selection.geometry.boundingBox.max.x + selection.geometry.boundingBox.min.x)/2,
        (selection.geometry.boundingBox.max.y + selection.geometry.boundingBox.min.y)/2,
        (selection.geometry.boundingBox.max.z + selection.geometry.boundingBox.min.z)/2
      );

      this.ifcViewer?.clipper.createFromNormalAndCoplanarPoint(normal, point);
    } else {
      this.ifcViewer?.clipper.deleteAllPlanes();
    }
  }

  async pick() {
    const found = await this.ifcViewer?.IFC.pickIfcItem(true);
    this.ifcViewer?.clipper.deleteAllPlanes();
    if (!found) return -1;
    this.select(found.modelID, found.id, false);
    return found.id;
  }

  private handleClick = (_event: Event) => {};

  private handleMouseMove = (_event: Event) => {
    this.ifcViewer?.IFC.prePickIfcItem();
  };

  private notFoundError(item: string) {
    throw new Error(`ERROR: ${item} could not be found!`);
  }

  private newMaterial(color: number, opacity: number) {
    return new MeshLambertMaterial({
      color,
      opacity,
      transparent: true,
      depthTest: false,
      side: DoubleSide,
    });
  }

  highlightElement(elementId: number) {
    this.ifcViewer?.IFC.highlight.pickByID(this.modelId, [elementId]);
  }

  selectElement(elementId: number) {
    this.ifcViewer?.IFC.selection.pickByID(this.modelId, [elementId], true);
  }

  unselectElement() {
    this.ifcViewer?.IFC.unpickIfcItems();
  }

  removeHighlight() {
    this.ifcViewer?.IFC.unHighlightIfcItems();
  }

  toggleTransparency(on: boolean) {
    this.ifcViewer?.IFC.setModelTranslucency(this.modelId, on, 0.1, true);
  }

  changeTransparency(on: boolean, value: number) {
    this.ifcViewer?.IFC.setModelTranslucency(this.modelId, on, value, true);
  }

  getSpaceTypes() {
    return this.spacesTypes;
  }

  hideElement(expressId: number) {
    this.ifcViewer?.IFC.loader.ifcManager.hideItems(this.modelId, [expressId]);
    this.unselectElement();
  }

  showElement(expressId: number) {
    this.ifcViewer?.IFC.loader.ifcManager.showItems(this.modelId, [expressId]);
    this.selectElement(expressId);
  }
}
