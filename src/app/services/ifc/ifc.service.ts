import { DoubleSide, MeshLambertMaterial, Vector3 } from 'three';
import {
  LoaderSettings,
  IFCSPACE,
  IFCWALL,
  IFCSTAIR,
  IFCCOLUMN,
  IFCFURNISHINGELEMENT,
  IFCBEAM,
  IFCSLAB,
  IFCRAILING,
  IFCWINDOW,
  IFCBUILDINGSTOREY,
  IFCDOOR,
  IFCPILE,
  IFCRAMP,
} from 'web-ifc';
import { IfcViewerAPI } from 'web-ifc-viewer';
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
interface IfcElement {
  expressID: number;
  Name: {
    value: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class IfcService {
  ifcViewer?: IfcViewerAPI;
  ifcModel: any;
  container?: HTMLElement;
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
  ignoredTypes = [
    'IFCCONNECTIONCURVEGEOMETRY',
    'IFCRELCONNECTSPATHELEMENTS',
    'IFCRELFILLSELEMENT',
    'IFCTELECOMADDRESS',
    'IFCAPPLICATION',
    'IFCORGANIZATION',
    'IFCACTORROLE',
    'IFCPERSON',
    'IFCPERSONANDORGANIZATION',
    'IFCOWNERHISTORY',
    'IFCPOSTALADDRESS',
    'IFCMEMBERTYPE',
    'IFCMEMBER',
    'IFCSANITARYTERMINALTYPE',
    'IFCCARTESIANPOINT',
    'IFCPOLYLOOP',
    'IFCFACEOUTERBOUND',
    'IFCFACE',
    'IFCOPENSHELL',
    'IFCFLOWTERMINAL',
    // 'IFCFURNISHINGELEMENTTYPE',
    // 'IFCFURNISHINGELEMENT',
    // 'IFCWALL',
    // 'IFCBEAMTYPE',
    // 'IFCBEAM',
    // 'IFCSLABTYPE',
    // 'IFCSLAB',
    // 'IFCRAILINGTYPE',
    // 'IFCRAILING',
    // 'IFCSTAIR',
    'IFCRELVOIDSELEMENT',
    'IFCOPENINGELEMENT',
    'IFCPLANE',
    'IFCPOLYGONALBOUNDEDHALFSPACE',
    'IFCARBITRARYCLOSEDPROFILEDEF',
    'IFCBOOLEANCLIPPINGRESULT',
    'IFCWINDOWLININGPROPERTIES',
    'IFCWINDOWSTYLE',
    // 'IFCWINDOW',
    'IFCDOORLININGPROPERTIES',
    'IFCDOORSTYLE',
    'IFCCLOSEDSHELL',
    'IFCFACEBOUND',
    'IFCFACETEDBREP',
    'IFCCIRCLE',
    'IFCPOLYLINE',
    'IFCGEOMETRICCURVESET',
    // 'IFCDOOR',
    // 'IFCCOLUMNTYPE',
    // 'IFCCOLUMN',
    'IFCRELCONTAINEDINSPATIALSTRUCTURE',
    // 'IFCRELDEFINESBYTYPE',
    // 'IFCWALLTYPE',
    // 'IFCBOUNDINGBOX',
    'IFCRELASSOCIATESMATERIAL',
    'IFCMATERIALLAYER',
    'IFCMATERIALLAYERSET',
    'IFCMATERIALLAYERSETUSAGE',
    // 'IFCMATERIAL',
    'IFCGEOMETRICREPRESENTATIONSUBCONTEXT',
    'IFCGEOMETRICREPRESENTATIONCONTEXT',
    'IFCCOLOURRGB',
    'IFCSURFACESTYLESHADING',
    'IFCSURFACESTYLE',
    'IFCPRESENTATIONSTYLEASSIGNMENT',
    'IFCSTYLEDITEM',
    'IFCAXIS2PLACEMENT2D',
    'IFCRECTANGLEPROFILEDEF',
    'IFCEXTRUDEDAREASOLID',
    'IFCPRESENTATIONLAYERASSIGNMENT',
    'IFCVECTOR',
    'IFCLINE',
    'IFCTRIMMEDCURVE',
    'IFCSHAPEREPRESENTATION',
    'IFCPRODUCTDEFINITIONSHAPE',
    // 'IFCWALLSTANDARDCASE',
    // 'IFCBUILDINGSTOREY',
    // 'IFCBUILDING',
    'IFCLOCALPLACEMENT',
    'IFCDIRECTION',
    'IFCAXIS2PLACEMENT3D',
    'IFCRELAGGREGATES',
    'IFCSITE',
    'IFCRELDEFINESBYPROPERTIES',
    'IFCPROPERTYSINGLEVALUE',
    'IFCPROPERTYSET',
    'IFCMONETARYUNIT',
    'IFCDERIVEDUNIT',
    'IFCDERIVEDUNITELEMENT',
    'IFCCONVERSIONBASEDUNIT',
    'IFCDIMENSIONALEXPONENTS',
    'IFCMEASUREWITHUNIT',
    'IFCSIUNIT',
    'IFCUNITASSIGNMENT',
    'IFCPROJECT',
    'IFCSHELLBASEDSURFACEMODEL',
  ];

  constructor(private httpClient: HttpClient) {
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
    if (!this.container) return;
    this.container.onclick = this.handleClick;
    this.container.onmousemove = this.handleMouseMove;
  }

  /* subscribeOnSelect(action: (modelID: number, id: number) => void) {
    this.onSelectActions.push(action);
  } */

  async loadIfc(file: File) {
    await this.ifcViewer?.IFC.loadIfc(file, true).then((res) => {
      this.ifcModel = res;
      this.ifcViewer?.IFC.setModelTranslucency(res.modelID, true, 0.1, true);
    });
  }

  async loadIfcUrl(url: string) {
    await this.ifcViewer?.IFC.loadIfcUrl(url, false).then((res) => {
      // console.log(res);
      this.ifcModel = res;
      this.ifcViewer?.IFC.setModelTranslucency(res.modelID, true, 0.1, true);
    });
  }

  select(modelID: number, expressId: number, pick = true) {
    if (pick) this.ifcViewer?.IFC.pickIfcItemsByID(modelID, [expressId]);
    this.onSelectActions.forEach((action) => action(modelID, expressId));
  }

  async getSpaces(type: string) {
    let obj: number;
    for (let item of this.spacesTypes) {
      if (item.type === type) {
        obj = item.obj;
        break;
      }
    }
    return (await this.ifcViewer?.IFC.loader.ifcManager.getAllItemsOfType(
      this.ifcModel.modelID,
      obj,
      true
    )) as IfcElement[];
  }

  toggleClippingPlane(on: boolean, expressId: number) {
    if (on) {
      const modelCenter = {
        x:
          (this.ifcModel?.['geometry'].boundingBox.max.x +
            this.ifcModel?.['geometry'].boundingBox.min.x) /
          2,
        y:
          (this.ifcModel?.['geometry'].boundingBox.max.y +
            this.ifcModel?.['geometry'].boundingBox.min.y) /
          2,
        z:
          (this.ifcModel?.['geometry'].boundingBox.max.z +
            this.ifcModel?.['geometry'].boundingBox.min.z) /
          2,
      };

      const selection = this.ifcViewer?.IFC.selection.mesh;
      const selectionAxis = {
        x: {
          size: Math.abs(
            selection.geometry.boundingBox.max.x -
              selection.geometry.boundingBox.min.x
          ),
          center:
            (selection.geometry.boundingBox.max.x +
              selection.geometry.boundingBox.min.x) /
            2,
        },
        y: {
          size: Math.abs(
            selection.geometry.boundingBox.max.y -
              selection.geometry.boundingBox.min.y
          ),
          center:
            (selection.geometry.boundingBox.max.y +
              selection.geometry.boundingBox.min.y) /
            2,
        },
        z: {
          size: Math.abs(
            selection.geometry.boundingBox.max.z -
              selection.geometry.boundingBox.min.z
          ),
          center:
            (selection.geometry.boundingBox.max.z +
              selection.geometry.boundingBox.min.z) /
            2,
        },
      };

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
      this.removeAllClippingPlanes();
      this.showElement([expressId], true);
    }
  }

  toggleFloorClippingPlane(height: number, minHeight: number) {
    // this.removeAllClippingPlanes();
    const modelCenter = {
      x:
        (this.ifcModel?.['geometry'].boundingBox.max.x +
          this.ifcModel?.['geometry'].boundingBox.min.x) /
        2,
      z:
        (this.ifcModel?.['geometry'].boundingBox.max.z +
          this.ifcModel?.['geometry'].boundingBox.min.z) /
        2,
    };
    const normal = new Vector3(0, -1, 0);
    const planeHeight =
      this.ifcModel?.['geometry'].boundingBox.min.y +
      Math.abs(minHeight / 1000) +
      height / 1000;
    const point = new Vector3(modelCenter.x, planeHeight, modelCenter.z);
    this.ifcViewer?.clipper.createFromNormalAndCoplanarPoint(normal, point);
  }

  removeAllClippingPlanes() {
    this.ifcViewer?.clipper.deleteAllPlanes();
  }

  async pick() {
    const found = await this.ifcViewer?.IFC.pickIfcItem(true);
    this.ifcViewer?.clipper.deleteAllPlanes();
    if (!found) return -1;
    this.select(found.modelID, found.id, false);
    const element = await this.getElementSelected(found.id);
    return element;
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

  highlightElement(expressId: number[]) {
    this.ifcViewer?.IFC.highlight.pickByID(this.ifcModel.modelID, expressId);
  }

  selectElement(expressId: number) {
    this.ifcViewer?.IFC.selection.pickByID(
      this.ifcModel.modelID,
      [expressId],
      true
    );
  }

  unselectElement() {
    this.ifcViewer?.IFC.unpickIfcItems();
  }

  removeHighlights() {
    this.ifcViewer?.IFC.unHighlightIfcItems();
  }

  changeTransparency(on: boolean, value: number) {
    this.ifcViewer?.IFC.setModelTranslucency(
      this.ifcModel.modelID,
      on,
      value,
      true
    );
  }

  getSpaceTypes() {
    // return this.spacesTypes;
    this.httpClient
      .get('assets/ifc/1014016356.ifc', { responseType: 'text' })
      .subscribe((res) => {
        console.log(res);
        const textRes = '' + res;
        let spaces = [];

        textRes.match(/(?<==).*?(?=\()/g).map((item) => {
          if (spaces.indexOf(item) === -1 && this.ignoredTypes.indexOf(item) === -1 && item.indexOf('TYPE') === -1) {
            spaces.push(item);
          }
        });
        console.log(spaces);
      });
  }

  hideElement(expressId: number[]) {
    this.ifcViewer?.IFC.loader.ifcManager.hideItems(
      this.ifcModel.modelID,
      expressId
    );
    this.unselectElement();
  }

  showElement(expressId: number[], select?: boolean) {
    this.ifcViewer?.IFC.loader.ifcManager.showItems(
      this.ifcModel.modelID,
      expressId
    );
    if (select) {
      expressId.forEach((element) => this.selectElement(element));
    }
  }

  async getElementSelected(expressId: number) {
    return this.ifcViewer?.IFC.getProperties(
      this.ifcModel.modelID,
      expressId,
      true
    );
  }
}
