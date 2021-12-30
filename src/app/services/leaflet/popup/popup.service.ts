import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  constructor() {}

  createPopupDescription(data: any): string {
    return (
      `` +
      `<div><b>Edificio:</b> ${data.title}</div>` +
      `<div><b>Tipo:</b> ${data.description}</div>`
    );
  }

  createPopupIFC(ifcExists: boolean, osmId: number) {
    let popup = `` +
    `<div>El edificio seleccionado ${ ifcExists ? ' ' : 'no ' }tiene un modelo IFC vinculado.</div>` +
    `<div>¿Que quiere hacer?</div>`;
    if (ifcExists) {
      popup = popup + `<div><a class="btn btn-primary btn-sm w-100 mt-3" href="visualizer/${osmId}">Ver modelo</a></div>`;
    }
    popup = popup + `<div><button class="btn btn-secondary btn-sm w-100 mt-3" (click)="prueba(${osmId})">${ ifcExists ? 'Actualizar' : 'Añadir' } modelo</button></div>`;
    return popup;
  }

  prueba(id: number) {
    console.log(id);
  }
}
