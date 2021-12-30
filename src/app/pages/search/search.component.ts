// TODO add/update IFC model
// TODO popup
import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as Leaflet from 'leaflet';
import { MarkerService } from 'src/app/services/leaflet/marker/marker.service';
import { PopupService } from 'src/app/services/leaflet/popup/popup.service';
import {
  NominatimService,
  SearchResult,
  DetailResult,
} from 'src/app/services/api/nominatim/nominatim.service';
import { TranslocoService } from '@ngneat/transloco';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = Leaflet.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
Leaflet.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, AfterViewInit {
  lat = 39.46987;
  lon = -0.37673;
  zoom = 13;

  resultShape: Leaflet.Polygon;
  searchResult: SearchResult[];
  selectedBuilding: DetailResult;
  hasIFC = false;
  searching = false;
  dataHeaders = {
    26: 'Calle',
    16: 'Población',
    12: 'Zona',
    10: 'Provincia',
    8: 'Comunidad autónoma',
    5: 'Código postal',
    4: 'País'
  };

  private map: Leaflet.Map;

  private initMap(): void {
    this.map = Leaflet.map('map', {
      center: [this.lat, this.lon],
      zoom: this.zoom,
      zoomControl: false
    });

    const tiles = Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);
  }

  constructor(
    private markerService: MarkerService,
    private nominatimService: NominatimService,
    private popupService: PopupService,
    private translocoService: TranslocoService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.markerService.createMarkers(this.map);
  }

  search(searchText: string) {
    this.searching = true;
    this.nominatimService.search(searchText).subscribe((res: SearchResult[]) => {
      this.searching = false;
      this.searchResult = res;
    });
  }

  searchInput(event: KeyboardEvent, searchText: string) {
    if (event.key === 'Enter') {
      this.search(searchText);
    }
  }

  resultDetail(i: number) {
    if (this.resultShape) {
      this.map.removeLayer(this.resultShape);
    }
    this.nominatimService
      .details(
        this.getOsmType(this.searchResult[i].osm_type),
        this.searchResult[i].osm_id,
        this.searchResult[i].class
      )
      .subscribe((res: DetailResult) => {
        this.selectedBuilding = res;

        const coordinates =
          this.selectedBuilding.geometry.type === 'LineString'
            ? this.selectedBuilding.geometry.coordinates
            : this.selectedBuilding.geometry.coordinates[0];

        for (const coordinate of coordinates) {
          const foo = coordinate[0];
          coordinate[0] = coordinate[1];
          coordinate[1] = foo;
        }
        // TODO check on server if IFC exists and wrap rest of function on subscribe
        this.hasIFC = true;
        this.resultShape = Leaflet.polygon(coordinates, { color: 'red' });
        this.resultShape.on('click', () => {
          // ? Popup with info ?
          // TODO fix open on second click
          const popup = this.popupService.createPopupIFC(true, res.osm_id);
          this.resultShape.bindPopup(popup);
        });
        this.resultShape.addTo(this.map);
        this.map.flyTo(
          [
            this.selectedBuilding.centroid.coordinates[1],
            this.selectedBuilding.centroid.coordinates[0],
          ],
          19
        );
      });
  }

  putIFC(id: number) {
    console.log(id);
  }

  private getOsmType(type: string) {
    if (type === 'way') {
      return 'W';
    }
    return '';
  }

  getResultType(category: string) {
    switch (category) {
      case 'building':
        return { text: this.translocoService.translate('SEARCH.DETAIL.CATEGORIES.BUILDING'), icon: 'building' };
      case 'highway':
        return { text: this.translocoService.translate('SEARCH.DETAIL.CATEGORIES.HIGHWAY'), icon: 'distribute-horizontal' };
      default:
        return { text: '', icon: '' }
    }
  }

  zoomIn() {
    this.map.zoomIn();
    this.zoom++;
  }

   zoomOut() {
    this.map.zoomOut();
    this.zoom--;
  }

  localize() {
    this.map.locate({ setView: true });
  }
}
