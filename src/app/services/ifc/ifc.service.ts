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
       * normal será:
       * - (1, 0, 0) para moverme a lo largo de la X
       * - (0, 1, 0) para moverme a lo largo de la Y
       * - (0, 0, 1) para moverme a lo largo de la Z
       * Dependiendo de en que plano este el elemento seleccionado (falta saber esto).
       * 
       * point será el punto medio de la caga que enmarque el elemento seleccionado.
       */
      const normal = new Vector3(1, 0, 0);
      const point = new Vector3(0, 0, 0);
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

    this.scene = new THREE.Scene();
    this.ifcViewer?.context.scene.scene;

    // const subset = this.ifcViewer?.IFC.loader.ifcManager.createSubset({ scene: this.ifcViewer?.context.getScene(), modelID: found.modelID, ids: [found.id], removePrevious: true });
    // console.log(subset);
    
    this.ifcViewer.IFC.getSpatialStructure(found.modelID, true).then(res => console.log(res));

    console.log('GetCoordinationMatrix', this.ifcViewer?.IFC.loader.ifcManager.ifcAPI.GetCoordinationMatrix(found.modelID));
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
}
