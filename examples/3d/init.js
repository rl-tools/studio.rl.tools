import * as THREE from "three"
import {OrbitControls} from "three-orbitcontrols"


class State{
    constructor(canvas, parameters, {devicePixelRatio}){
        this.canvas = canvas
        this.devicePixelRatio = devicePixelRatio
        this.parameters = parameters
    }
    async initialize(){
        const width = this.canvas.width
        const height = this.canvas.height
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 40, width / height, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer( {canvas: this.canvas, antialias: true, alpha: true} );
        this.renderer.setPixelRatio(this.devicePixelRatio)
        this.renderer.setClearColor(0xffffff, 0);
        this.renderer.setSize(width/this.devicePixelRatio, height/this.devicePixelRatio);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.box = new THREE.Mesh(new THREE.BoxGeometry(this.parameters.depth, this.parameters.height, this.parameters.width), new THREE.MeshLambertMaterial({color: 0x00FF00}));
        this.scene.add(this.box)
        var light = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(light);
        let intensity = 0.2;
        [-100, 100].map((x) => {
            [-100, 100].map((z) => {
                intensity += 0.1
                var directionalLight = new THREE.DirectionalLight(0xffffff, intensity)
                directionalLight.position.set(x, 100, z)
                directionalLight.target.position.set(0, 0, 0)
                this.scene.add(directionalLight)
            })
        })
        this.camera.position.set(3, 1., 0.0)
        this.camera.quaternion.set(-0.14, 0.70, 0.14, 0.68)
        this.controls.target.set(0.0, 0.0, 0.0)
        this.controls.update()
    }

}
export async function init(canvas, parameters, options){
    const state = new State(canvas, parameters, options)
    await state.initialize()
    return state
}