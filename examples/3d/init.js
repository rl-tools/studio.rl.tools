import * as THREE from "three"
import {OrbitControls} from "three-orbitcontrols"


class State{
    constructor(canvas, {devicePixelRatio}){
        this.canvas = canvas
        this.devicePixelRatio = devicePixelRatio
        this.cursor_grab = true // Instruct the embedding code to make the cursor a grab cursor
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
        this.box = null
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
export async function episode_init(ui_state, parameters){
    if(ui_state.box){
        ui_state.scene.remove(ui_state.box)
    }
    ui_state.box = new THREE.Mesh(new THREE.BoxGeometry(parameters.depth, parameters.height, parameters.width), new THREE.MeshLambertMaterial({color: 0x6fd0cb})); //0x00FF00}));
    ui_state.scene.add(ui_state.box)
}
export async function init(canvas, parameters, options){
    const state = new State(canvas, parameters, options)
    await state.initialize()
    return state
}