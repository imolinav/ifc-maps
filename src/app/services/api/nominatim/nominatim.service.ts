import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LatLngExpression } from 'leaflet';

export interface SearchResult {
  boundingbox: string[];
  class: string;
  display_name: string;
  importance: number;
  lat: string;
  licence: string;
  lon: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  type: string;
}

export interface DetailResult {
  address: [
    {
      admin_level: number;
      class: string;
      distance: number;
      isaddress: boolean;
      localname: string;
      osm_id: number;
      osm_type: string;
      place_id: number;
      place_type: string;
      rank_address: number;
      type: string;
    }
  ];
  addresstags: {
    city: string;
    housenumber: string;
    postcode: string;
    street: string;
  };
  admin_level: number;
  calculated_importance: number;
  calculated_postcode: string;
  calculated_wikipedia: string;
  category: string;
  centroid: {
    coordinates: number[];
    type: string;
  };
  country_code: string;
  extratags: {
    'building:levels': string;
    'building:levels:underground': string;
    description: string;
    height: string;
  };
  geometry: {
    coordinates: [] | LatLngExpression[][];
    type: string;
  };
  housenumber: string;
  importance: number;
  indexed_date: string;
  isarea: boolean;
  localname: string;
  names: string[];
  osm_id: number;
  osm_type: string;
  parent_place_id: number;
  place_id: number;
  rank_address: number;
  rank_search: number;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class NominatimService {

  API_URL = 'https://nominatim.openstreetmap.org/';

  constructor(private httpClient: HttpClient) { }

  search(searchParam: string) {
    return this.httpClient.get(`${this.API_URL}search?format=json&q=${searchParam}`);
  }

  details(osmType: string, osmId: number, type: string) {
    return this.httpClient.get(`${this.API_URL}details?osmtype=${osmType}&osmid=${osmId}&class=${type}&addressdetails=1&hierarchy=0&group_hierarchy=1&polygon_geojson=1&format=json`);
  }

  direction(lat: number, lon: number) {
    return this.httpClient.get(`${this.API_URL}reverse?lat=${lat}&lon=${lon}&format=json&extratags=1&namedetails=1&polygon_geojson=1`);
  }
}
