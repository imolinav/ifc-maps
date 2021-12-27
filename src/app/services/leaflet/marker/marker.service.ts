import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Leaflet from 'leaflet';
import { PopupService } from '../popup/popup.service';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  valenciaData = '../../../assets/data/valencia/points.geojson';

  constructor(private httpClient: HttpClient, private popupService: PopupService) { }

  createMarkers(map: Leaflet.Map): void {
    this.httpClient.get(this.valenciaData).subscribe((res: any) => {
      for (const c of res.features) {
        const lon = c.geometry.coordinates[0];
        const lat = c.geometry.coordinates[1];
        const marker = Leaflet.marker([lat, lon]);
        marker.bindPopup(this.popupService.createPopupDescription(c.properties));
        marker.addTo(map);
      }
    });
  }
}
