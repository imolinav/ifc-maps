import { DoubleSide, MeshLambertMaterial } from 'three';
import { LoaderSettings } from 'web-ifc';
import { IfcViewerAPI } from 'web-ifc-viewer';

export class IfcService {
  currentModel = -1;
  ifcViewer?: IfcViewerAPI;
  container?: HTMLElement;
  onSelectActions: ((modelID: number, id: number) => void)[];
  ifcProductsType: { [modelID: number]: { [expressID: number]: number } };
  webConfig: LoaderSettings = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: false };

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
    const preselectMaterial = this.newMaterial(0xFBC02D, 0.2);
    const selectMaterial = this.newMaterial(0xFBC02D, 0.5);
    this.ifcViewer = new IfcViewerAPI({
      container: this.container,
      preselectMaterial,
      selectMaterial
    });
    this.ifcViewer.IFC.setWasmPath('assets/wasm/');
    this.ifcViewer.IFC?.applyWebIfcConfig(this.webConfig);
  }

  setupInputs() {
    if (!this.container) return;
    this.container.onclick = this.handleClick;
    this.container.ondblclick = this.handleDoubleClick;
    this.container.onmousemove = this.handleMouseMove;
  }

  subscribeOnSelect(action: (modelID: number, id: number) => void) {
    this.onSelectActions.push(action);
  }

  loadIfc(file: File) {
    this.ifcViewer?.IFC.loadIfc(file, true);
  }

  loadIfcUrl(url: string) {
    this.ifcViewer?.IFC.loadIfcUrl(`assets/ifc/${url}.ifc`, false, (event) => {
      const progress = event.loaded / event.total * 100;
      console.log(`Progress: ${progress}%`);
    }).then((res) => {
      console.log(res)
      this.ifcViewer?.IFC.setModelTranslucency(res.modelID, true, 0.1, true);
    });
  }

  select(modelID: number, expressID: number, pick = true) {
    if (pick) this.ifcViewer?.IFC.pickIfcItemsByID(modelID, [expressID]);
    this.currentModel = modelID;
    this.onSelectActions.forEach((action) => action(modelID, expressID));
  }

  async pick() {
    const found = await this.ifcViewer?.IFC.pickIfcItem();
    if (found == null || found == undefined) return;
    this.select(found.modelID, found.id, false);
  }

  private handleClick = (_event: Event) => {

  };

  private handleDoubleClick = async (event: Event) => {
    await this.pick();
  };

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
      side: DoubleSide
    });
  }
}
