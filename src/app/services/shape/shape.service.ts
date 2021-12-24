import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {

  constructor(private httpClient: HttpClient) { }

  getShapes() {
    return this.httpClient.get('../../../assets/data/valencia/shapes.geojson');
  }
}
