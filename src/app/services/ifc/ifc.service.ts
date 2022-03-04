import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first } from 'rxjs';
import { Box3, BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { LoaderSettings } from 'web-ifc';
import { IfcViewerAPI } from 'web-ifc-viewer';
import {
  IGNORED_TYPES,
  IfcElements,
  IfcElement,
  IfcModel
} from '../../pages/visualizer/visualizer.constants';

@Injectable({
  providedIn: 'root',
})
export class IfcService {
  ifcViewer?: IfcViewerAPI;
  planeViewer?: IfcViewerAPI;
  ifcModel: IfcModel;
  container?: HTMLElement;
  planeContainer?: HTMLElement;
  onSelectActions: ((modelID: number, id: number) => void)[];
  ifcProductsType: { [modelID: number]: { [expressID: number]: number } };
  webConfig: LoaderSettings = {
    COORDINATE_TO_ORIGIN: true,
    USE_FAST_BOOLS: false,
  };

  constructor(private httpClient: HttpClient) {
    this.onSelectActions = [];
    this.ifcProductsType = {};
  }

  startIfcViewer(container: HTMLElement) {
    if (!container) {
      return this.notFoundError('container');
    }
    this.container = container;
    this.setupIfcScene();
    this.setupInputs();
  }

  setupIfcScene() {
    if (!this.container) {
      return;
    }
    const preselectMaterial = this.newMaterial(0xfbc02d, 0.2);
    const selectMaterial = this.newMaterial(0xfbc02d, 0.5);
    this.ifcViewer = new IfcViewerAPI({
      container: this.container,
      preselectMaterial,
      selectMaterial,
    });
    this.ifcViewer?.IFC.loader.ifcManager.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast
    );
    this.ifcViewer?.IFC.setWasmPath('assets/wasm/');
    this.ifcViewer?.IFC.applyWebIfcConfig(this.webConfig);
    this.ifcViewer?.toggleClippingPlanes();
  }

  setupInputs() {
    if (!this.container) {
      return;
    }
    this.container.onclick = this.handleClick;
    this.container.onmousemove = this.handleMouseMove;
  }

  startPlaneViewer(planeContainer: HTMLElement) {
    if (!planeContainer) {
      return this.notFoundError('planeContainer');
    }
    this.planeContainer = planeContainer;
    this.setupPlaneScene();
  }

  setupPlaneScene() {
    if (!this.planeContainer) {
      return;
    }
    this.planeViewer = new IfcViewerAPI({
      container: this.planeContainer
    });
    this.planeViewer?.IFC.setWasmPath('assets/wasm/');
    this.planeViewer?.IFC.applyWebIfcConfig(this.webConfig);
    this.planeViewer?.toggleClippingPlanes();
  }

  /* subscribeOnSelect(action: (modelID: number, id: number) => void) {
    this.onSelectActions.push(action);
  } */

  async loadIfc(file: File) {
    await this.ifcViewer?.IFC.loadIfc(file, true).then((res) => {
      this.ifcModel = res;
      this.changeTransparency(true, 0.1);
    });
  }

  async loadIfcUrl(url: string) {
    await this.ifcViewer?.IFC.loadIfcUrl(url, false).then((res) => {
      this.ifcModel = res;
      // console.log(this.ifcModel);
      this.changeTransparency(true, 0.1);
    });
  }

  async loadPlaneUrl(url: string) {
    await this.planeViewer?.IFC.loadIfcUrl(url, false).then((res) => {
      this.createPlaneFromClip();
    });
  }

  select(modelID: number, expressId: number, pick = true) {
    if (pick) this.ifcViewer?.IFC.selector.pickIfcItemsByID(modelID, [expressId]);
    this.onSelectActions.forEach((action) => action(modelID, expressId));
  }

  async getSpaces(type: string) {
    let obj = IfcElements[type];
    return (await this.ifcViewer?.IFC.loader.ifcManager.getAllItemsOfType(
      this.ifcModel.modelID,
      obj,
      true
    )) as IfcElement[];
  }

  private getModelCenter() {
    return {
      x:
        (this.ifcModel?.geometry.boundingBox.max.x +
          this.ifcModel?.geometry.boundingBox.min.x) /
        2,
      y:
        (this.ifcModel?.geometry.boundingBox.max.y +
          this.ifcModel?.geometry.boundingBox.min.y) /
        2,
      z:
        (this.ifcModel?.geometry.boundingBox.max.z +
          this.ifcModel?.geometry.boundingBox.min.z) /
        2,
    };
  }

  private getElementBoundingBox(selection: Mesh) {
    const geometry = new BufferGeometry();
    const coordinates = [];
    const alreadySaved = new Set();
    const position = selection.geometry.attributes['position'];
    
    for (let i = 0; i < selection.geometry.index.array.length; i++) {
      if(!alreadySaved.has(selection.geometry.index.array[i])){
        coordinates.push(position.getX(selection.geometry.index.array[i]));
        coordinates.push(position.getY(selection.geometry.index.array[i]));
        coordinates.push(position.getZ(selection.geometry.index.array[i]));
        alreadySaved.add(selection.geometry.index.array[i]);
      }
    }

    const vertices = Float32Array.from(coordinates);
    geometry.setAttribute('position', new BufferAttribute(vertices, selection.geometry.index.count));
    const mesh = new Mesh(geometry);

    const boundingBox = new Box3();
    boundingBox.setFromObject(mesh);
    return boundingBox;
  }

  private getSelectionAxisFromBoundingBox(boundingBox: Box3) {
    return {
      x: {
        size: Math.abs(
          boundingBox.max.x -
          boundingBox.min.x
        ),
        center:
          (boundingBox.max.x +
            boundingBox.min.x) /
          2,
      },
      y: {
        size: Math.abs(
          boundingBox.max.y -
            boundingBox.min.y
        ),
        center:
          (boundingBox.max.y +
            boundingBox.min.y) /
          2,
      },
      z: {
        size: Math.abs(
          boundingBox.max.z -
            boundingBox.min.z
        ),
        center:
          (boundingBox.max.z +
            boundingBox.min.z) /
          2,
      },
    };
  }

  toggleClippingPlane(on: boolean, expressId: number) {
    if (on) {
      const modelCenter = this.getModelCenter();
      const boundingBox = this.getElementBoundingBox(this.ifcViewer?.IFC.selector.selection.mesh);
      const selectionAxis = this.getSelectionAxisFromBoundingBox(boundingBox);

      let direction = 1;

      let normal: Vector3;
      if (
        selectionAxis.x.size < selectionAxis.y.size &&
        selectionAxis.x.size < selectionAxis.z.size
      ) {
        if (selectionAxis.x.center > modelCenter.x) {
          direction = -1;
        }
        normal = new Vector3(direction, 0, 0);
      } else if (
        selectionAxis.y.size < selectionAxis.x.size &&
        selectionAxis.y.size < selectionAxis.z.size
      ) {
        if (selectionAxis.y.center > modelCenter.y) {
          direction = -1;
        }
        normal = new Vector3(0, direction, 0);
      } else {
        if (selectionAxis.z.center > modelCenter.z) {
          direction = -1;
        }
        normal = new Vector3(0, 0, direction);
      }

      const point = new Vector3(
        selectionAxis.x.center,
        selectionAxis.y.center,
        selectionAxis.z.center
      );

      this.ifcViewer?.clipper.createFromNormalAndCoplanarPoint(normal, point);
      this.unselectElement();
    } else {
      this.removePlanes(this.ifcViewer);
      this.showElement([expressId], true);
    }
  }

  toggleFloorClippingPlane(height: number, minHeight: number) {
    const modelCenter = {
      x:
        (this.ifcModel?.geometry.boundingBox.max.x +
          this.ifcModel?.geometry.boundingBox.min.x) /
        2,
      z:
        (this.ifcModel?.geometry.boundingBox.max.z +
          this.ifcModel?.geometry.boundingBox.min.z) /
        2,
    };
    const normal = new Vector3(0, -1, 0);
    const planeHeight =
      this.ifcModel?.geometry.boundingBox.min.y +
      Math.abs(minHeight / 1000) +
      height / 1000;
    const point = new Vector3(modelCenter.x, planeHeight, modelCenter.z);
    this.ifcViewer?.clipper.createFromNormalAndCoplanarPoint(normal, point);
  }

  async pick() {
    const found = await this.ifcViewer?.IFC.selector.pickIfcItem(true);
    this.removePlanes(this.ifcViewer);
    if (!found) return -1;
    this.select(found.modelID, found.id, false);
    return this.getElementSelected(found.id);
  }

  private handleClick = (_event: Event) => {};

  private handleMouseMove = (_event: Event) => {
    this.ifcViewer?.IFC.selector.prePickIfcItem();
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

  highlightElement(expressId: number[]) {
    this.ifcViewer?.IFC.selector.highlight.pickByID(this.ifcModel.modelID, expressId)
  }

  selectElement(expressId: number) {
    this.ifcViewer?.IFC.selector.selection.pickByID(
      this.ifcModel.modelID,
      [expressId],
      true
    );
  }

  unselectElement() {
    this.ifcViewer?.IFC.selector.unpickIfcItems();
  }

  removeHighlights() {
    this.ifcViewer?.IFC.selector.unHighlightIfcItems();
  }

  changeTransparency(on: boolean, value: number) {
    const materials = this.ifcModel.material;
    if(Array.isArray(materials)) {
      materials.forEach(material => {
        material.transparent = on;
        material.opacity = value;
      });
    } else {
      materials.transparent = on;
      materials.opacity = value;
    }
  }

  getSpaceTypes(modelId: string) {
    let spaces = [];
    this.httpClient
      .get(modelId, { responseType: 'text' })
      .pipe(first())
      .subscribe((res) => {
        const textRes = '' + res;
        textRes.match(/(?<==).*?(?=\()/g).map((item) => {
          if (!spaces.find(element => element.type === item) && IGNORED_TYPES.indexOf(item) === -1 && item.indexOf('TYPE') === -1) {
            spaces.push({ type: item, obj: IfcElements[item] });
          }
        });
      });
      return spaces;
  }

  hideElement(expressId: number[]) {
    /* this.ifcViewer?.IFC.loader.ifcManager.hideItems(
      this.ifcModel.modelID,
      expressId
    );
    this.unselectElement(); */
  }

  showElement(expressId: number[], select?: boolean) {
    /* this.ifcViewer?.IFC.loader.ifcManager.showItems(
      this.ifcModel.modelID,
      expressId
    );
    if (select) {
      expressId.forEach((element) => this.selectElement(element));
    } */
  }

  async getElementSelected(expressId: number) {
    return this.ifcViewer?.IFC.getProperties(
      this.ifcModel.modelID,
      expressId,
      true
    );
  }

  createPlaneFromClip() {
    this.removePlanes(this.planeViewer);
    const clippingPlane = this.ifcViewer?.clipper.planes[0];
    this.planeViewer?.clipper.createFromNormalAndCoplanarPoint(clippingPlane.normal, clippingPlane.arrowBoundingBox.position);
  }

  removePlaneView() {
    this.removePlanes(this.planeViewer);
  }

  removeAllClippingPlanes() {
    this.removePlanes(this.ifcViewer);
  }

  private removePlanes(viewer: IfcViewerAPI) {
    viewer?.clipper.deleteAllPlanes();
    const clippingPlanes = viewer?.clipper['context'].clippingPlanes;
    for (let plane of clippingPlanes) {
      viewer?.clipper['context'].removeClippingPlane(plane);
    }
  }

}
