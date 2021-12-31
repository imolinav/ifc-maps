// TODO add/update IFC model
import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as Leaflet from 'leaflet';
import {
  NominatimService,
  SearchResult,
  DetailResult,
} from 'src/app/services/api/nominatim/nominatim.service';
import { TranslocoService } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';

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
const valenciaData = '../../../assets/data/valencia/points.geojson';
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
    4: 'País',
  };
  resultTypes: { 
    type: string; 
    data: { 
      text: string; 
      icon: string 
    }
  }[];

  private map: Leaflet.Map;

  private initMap(): void {
    this.map = Leaflet.map('map', {
      center: [this.lat, this.lon],
      zoom: this.zoom,
      zoomControl: false,
    });
    Leaflet.control.scale().addTo(this.map);
    this.map.addEventListener('zoom', (event) => {
      this.zoom = event.target._zoom;
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
    this.createMarkers(this.map);
  }

  constructor(
    private nominatimService: NominatimService,
    private translocoService: TranslocoService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.resultTypes = [
      {
        type: 'building',
        data: {
          text: this.translocoService.translate(
            'SEARCH.DETAIL.CATEGORIES.BUILDING'
          ),
          icon: 'location_city',
        },
      },
      {
        type: 'highway',
        data: {
          text: this.translocoService.translate(
            'SEARCH.DETAIL.CATEGORIES.HIGHWAY'
          ),
          icon: 'directions_car',
        },
      },
      {
        type: 'natural',
        data: {
          text: this.translocoService.translate(
            'SEARCH.DETAIL.CATEGORIES.NATURE'
          ),
          icon: 'nature_people',
        },
      },
    ];
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  search(searchText: string) {
    this.searching = true;
    this.nominatimService
      .search(searchText)
      .subscribe((res: SearchResult[]) => {
        this.searching = false;
        if (res.length > 0) {
          console.log(res);
          this.searchResult = res;
        }
      });
  }

  searchInput(event: KeyboardEvent, searchText: string) {
    if (event.key === 'Enter' && searchText !== '') {
      this.search(searchText);
    } else if (searchText === '') {
      this.searchResult = null;
    }
  }

  resultDetail(osmId: number, osmType?: string, classType?: string) {
    if (!osmType) {
      osmType = 'way';
    }
    if (!classType) {
      classType = 'building';
    }
    if (this.resultShape) {
      this.map.removeLayer(this.resultShape);
    }
    this.nominatimService
      .details(this.getOsmType(osmType), osmId, classType)
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
        this.map
          .flyTo(
            [
              this.selectedBuilding.centroid.coordinates[1],
              this.selectedBuilding.centroid.coordinates[0],
            ],
            19
          )
          .on('zoomend', () => {
            if (this.resultShape) {
              this.resultShape.addTo(this.map);
            }
          });
        this.zoom = 19;
      });
  }

  putIFC(id: number) {
    console.log(id);
  }

  getResultType(type: string) {
    let result: { text: string; icon: string };
    for (let item of this.resultTypes) {
      if (item.type === type) {
        result = item.data;
        break;
      }
    }
    if (!result) {
      result = {
        text: this.translocoService.translate('SEARCH.DETAIL.CATEGORIES.PLACE'),
        icon: 'place',
      };
    }
    console.log(result);
    return result;
  }

  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  localize() {
    this.map.locate({ setView: true });
  }

  goBack() {
    this.selectedBuilding = null;
    this.map.removeLayer(this.resultShape);
    this.resultShape = null;
  }

  private createMarkers(map: Leaflet.Map) {
    this.httpClient.get(valenciaData).subscribe((res: any) => {
      for (const c of res.features) {
        const lon = c.geometry.coordinates[0];
        const lat = c.geometry.coordinates[1];
        const marker = Leaflet.marker([lat, lon]);
        marker.addEventListener('click', () => {
          this.resultDetail(c.properties.id);
        });
        marker.addTo(map);
      }
    });
  }

  private getOsmType(type: string) {
    if (type === 'way') {
      return 'W';
    }
    return '';
  }
}
