import { Component, OnInit } from '@angular/core';
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss']
})
export class VisualizerComponent implements OnInit {

  scene: Scene;

  constructor() { }

  ngOnInit(): void {
    this.scene = new Scene();

    const size = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const aspect = size.width / size.height;
    const camera = new PerspectiveCamera(75, aspect);
    camera.position.z = 15;
    camera.position.y = 13;
    camera.position.x = 8;

    const lightColor = 0xffffff;

    const ambientLight = new AmbientLight(lightColor, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(lightColor, 1);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

    //Sets up the renderer, fetching the canvas of the HTML
    const threeCanvas = document.getElementById("three-canvas");
    const renderer = new WebGLRenderer({
        canvas: threeCanvas,
        alpha: true
    });

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    //Creates grids and axes in the scene
    const grid = new GridHelper(50, 30);
    this.scene.add(grid);

    const axes = new AxesHelper();
    // axes.material.depthTest = false;
    axes.renderOrder = 1;
    this.scene.add(axes);

    //Creates the orbit controls (to navigate the scene)
    const controls = new OrbitControls(camera, threeCanvas);
    controls.enableDamping = true;
    controls.target.set(-2, 0, 0);

    //Animation loop
    const animate = () => {
      controls.update();
      renderer.render(this.scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", () => {
      size.width = window.innerWidth;
      size.height = window.innerHeight;
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
      renderer.setSize(size.width, size.height);
    });

    const ifcLoader = new IFCLoader();
    ifcLoader.ifcManager.setWasmPath('./src/assets/wasms/');
    ifcLoader.load('./assets/ifcs/Viviendas_Augusta.ifc', (ifcModel) => this.scene.add(ifcModel));

    /* const input = document.getElementById('file-input');
    input.addEventListener('change', (changed) => {
      const file = changed.target['files'][0];
      let ifcURL = URL.createObjectURL(file);
      ifcLoader.load(
        ifcURL,
        (ifcModel) => this.scene.add(ifcModel.mesh)
      )
    }, false); */
    
  }

}
