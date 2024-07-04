import * as THREE from "three"
import {OrbitControls} from "three-orbitcontrols"


function norm(a){
    return Math.sqrt(a.map(x => x**2).reduce((a, c) => a + c, 0))
}
  
function Matrix4FromRotMatTranspose(rotMat){
    const m = new THREE.Matrix4()
    m.set(
        rotMat[0][0], rotMat[1][0], rotMat[2][0], 0,
        rotMat[0][1], rotMat[1][1], rotMat[2][1], 0,
        rotMat[0][2], rotMat[1][2], rotMat[2][2], 0,
        0, 0, 0, 1)
    return m
}

function Matrix4FromRotMat(rotMat){
    const m = new THREE.Matrix4()
    m.set(
        rotMat[0][0], rotMat[0][1], rotMat[0][2], 0,
        rotMat[1][0], rotMat[1][1], rotMat[1][2], 0,
        rotMat[2][0], rotMat[2][1], rotMat[2][2], 0,
        0, 0, 0, 1)
    return m
}




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

        const capture = false;

        this.renderer = new THREE.WebGLRenderer( {canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: capture} );
        this.renderer.setPixelRatio(this.devicePixelRatio)
        this.renderer.setClearColor(0xffffff, 0);
        
        this.renderer.setSize(width/this.devicePixelRatio, height/this.devicePixelRatio);


        // canvasContainer.appendChild(this.renderer.domElement );

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.simulator = new THREE.Group()
        this.simulator.rotation.set(-Math.PI/2, 0, 0)

        this.scene.add(this.simulator)

        var light = new THREE.AmbientLight( 0xffffff,0.5 ); // soft white light
        this.scene.add(light);
        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.4 )
        directionalLight.position.set(-100, 100, 0)
        directionalLight.target.position.set(0, 0, 0)
        this.scene.add( directionalLight )
        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 )
        directionalLight.position.set(0, 100, 100)
        directionalLight.target.position.set(0, 0, 0)
        this.scene.add( directionalLight )
        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.2 )
        directionalLight.position.set(0, 100, -100)
        directionalLight.target.position.set(0, 0, 0)
        this.scene.add( directionalLight )

        this.camera.position.set(3.3, 1.4, 0.00)
        this.camera.quaternion.set(-0.14, 0.70, 0.14, 0.68)
        this.controls.target.set(0.0, 0.0, 0.0)
        this.controls.update()

        this.camera_set = false
    }

}


class Drone{
  constructor(model, origin, envParams, displayIMUCoordinateSystem, displayActions){
    // console.log(model)
    this.origin = origin
    this.model = model
    this.envParams = envParams
    this.droneFrame = new THREE.Group()
    this.drone = new THREE.Group()
    // this.drone.add((new CoordinateSystem()).get())
    // this.drone.add((new CoordinateSystem(10 * this.scale, 0.1 * this.scale)).get())
    this.scale = model.mass
    const material = new THREE.MeshLambertMaterial({color: 0xAAAAAA})
    const clockwise_rotor_material = new THREE.MeshLambertMaterial({color: 0x00FF00})
    const counter_clockwise_rotor_material = new THREE.MeshLambertMaterial({color: 0xFF0000})

    const coordinateSystemLength = Math.cbrt(this.scale)
    const coordinateSystemThickness = 0.01 * coordinateSystemLength

    const centerSize = Math.cbrt(this.scale) / 15
    const centerForm = new THREE.BoxGeometry(centerSize, centerSize, centerSize*0.3)
    const center = new THREE.Mesh( centerForm, material);
    // this.drone.quaternion.set(Math.sqrt(0.5), Math.sqrt(0.5), 0,0) // ENUtoNED
    this.imuGroup = new THREE.Group()
    this.imuGroup.position.set(...model.imu.pose.position)
    this.imuGroup.quaternion.set(model.imu.pose.orientation[3], model.imu.pose.orientation[0], model.imu.pose.orientation[1], model.imu.pose.orientation[2])
    if (displayIMUCoordinateSystem) {
      this.imuGroup.add((new CoordinateSystem([0, 0, 0], coordinateSystemLength, coordinateSystemThickness)).get())
    }
    this.drone.add(this.imuGroup)
    this.drone.add(center)

    this.rotors = []

    const averageArmLength = model.rotors.map(rotor => norm(rotor.pose.position)).reduce((a, c) => a + c, 0) / model.rotors.length
    for(const [rotorIndex, rotor] of model.rotors.entries()){
      let rotorCageRadiusFactor = 1
      let rotorCageThicknessFactor = 1
      if (this.envParams != null){
        const rotorParams = this.envParams.rotors[rotorIndex]
        // console.log(this.envParams)
        if (rotorParams.thrust_curve.factors[1].constructor == Object){
          if (Array.isArray(rotorParams.thrust_curve.factors[1].parameters)){
            const mean1 = rotorParams.thrust_curve.factors[1].parameters.reduce((a, c)=>a+c, 0) / rotorParams.thrust_curve.factors[1].parameters.length
            rotorCageThicknessFactor = rotor.thrust_curve.factor_1/mean1
          }
          else{
            if ("upper" in rotorParams.thrust_curve.factors[1]){
              rotorCageThicknessFactor = rotor.thrust_curve.factor_1/((rotorParams.thrust_curve.factors[1].upper - rotorParams.thrust_curve.factors[1].lower)/2 + rotorParams.thrust_curve.factors[1].lower)
            }
          }
        }
        if (rotorParams.thrust_curve.factors[2].constructor == Object){
          if (Array.isArray(rotorParams.thrust_curve.factors[2].parameters)){
            const mean2 = rotorParams.thrust_curve.factors[2].parameters.reduce((a, c)=>a+c, 0) / rotorParams.thrust_curve.factors[2].parameters.length
            rotorCageThicknessFactor = rotor.thrust_curve.factor_2/mean2
          }
          else{
            if ("upper" in rotorParams.thrust_curve.factors[2]){
              rotorCageThicknessFactor = rotor.thrust_curve.factor_2/((rotorParams.thrust_curve.factors[2].upper - rotorParams.thrust_curve.factors[2].lower)/2 + rotorParams.thrust_curve.factors[2].lower)
            }
          }
        }
      }
      const rotorCageRadius =  averageArmLength/3 * Math.sqrt(rotorCageRadiusFactor)
      const rotorCageThickness = averageArmLength/20 * Math.sqrt(rotorCageThicknessFactor)
      const armGroup = new THREE.Group()
      const length = norm(rotor.pose.position)
      const armDiameter = averageArmLength/10
      const armLength = length - rotorCageRadius
      const armForm = new THREE.CylinderGeometry( armDiameter/2, armDiameter/2, armLength, 8 );
      const rot = new THREE.Quaternion(); // Geometry extends in y -> transform y to relative pos
      rot.setFromUnitVectors(new THREE.Vector3(...[0, 1, 0]), (new THREE.Vector3(...rotor.pose.position)).normalize());
      armGroup.quaternion.set(rot.x, rot.y, rot.z, rot.w)

      const arm = new THREE.Mesh(armForm, material)
      arm.position.set(0, armLength/2, 0)
      armGroup.add(arm)

      const rotorGroup = new THREE.Group()
      rotorGroup.position.set(...rotor.pose.position)
      rotorGroup.quaternion.set(rotor.pose.orientation[3], rotor.pose.orientation[0], rotor.pose.orientation[1], rotor.pose.orientation[2])
      // rotorGroup.add((new CoordinateSystem([0, 0, 0], 0.1, 0.01)).get())
      const rotorCageForm = new THREE.TorusGeometry(rotorCageRadius, rotorCageThickness, 16, 32 );
      const cageMaterial = (rotor.spin_orientation_clockwise ? clockwise_rotor_material : counter_clockwise_rotor_material)// new THREE.MeshLambertMaterial({color: 0xAAAAAA})
      const rotorCage = new THREE.Mesh(rotorCageForm, cageMaterial)
      rotorGroup.add(rotorCage)

      const forceArrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0 ), 0, 0x000000);
      if(displayActions){
        rotorGroup.add(forceArrow)
      }

      this.drone.add(rotorGroup)
      this.drone.add(armGroup)
      this.droneFrame.add(this.drone)
      this.rotors.push({
        forceArrow,
        rotorCage
      })
    }

  }
  get(){
    return this.droneFrame
  }
  setState(state){
    const mat = Matrix4FromRotMat(state.pose.orientation)
    this.droneFrame.quaternion.setFromRotationMatrix(mat)
    this.droneFrame.position.set(state.pose.position[0] + this.origin[0], state.pose.position[1] + this.origin[1], state.pose.position[2] + this.origin[2])
    const avg_rot_rate = state.rotor_states.reduce((a, c) => a + c["power"], 0)/state.rotor_states.length
    state.rotor_states.map((rotorState, i) => {
      const forceArrow = this.rotors[i].forceArrow
      const rotorCage = this.rotors[i].rotorCage
      const min_rpm = this.model.rotors[i].min_rpm
      const max_rpm = this.model.rotors[i].max_rpm


      const rot_rate = rotorState["power"]
      const force_magnitude = (rot_rate - avg_rot_rate)/max_rpm * 10///1000
      forceArrow.setDirection(new THREE.Vector3(0, 0, rot_rate)) //Math.sign(force_magnitude)))
      forceArrow.setLength(Math.cbrt(this.this.scale)/10) //Math.abs(force_magnitude))
    })
  }

}

export async function init(canvas, options){
    const state = new State(canvas, options)
    await state.initialize()
    return state
}

export async function episode_init(ui_state, parameters){
    const camera_distance = (parameters.ui ? parameters.ui.camera_distance || 1 : 1)
    const scale = parameters.mass/0.1 * camera_distance
    if(!ui_state.camera_set){
      ui_state.camera.position.set(3.3 * scale, 1.4 * scale, 0.00)
      ui_state.camera_set = true
    }
    if(ui_state.drone){
      ui_state.simulator.remove(ui_state.drone.get())
    }
    ui_state.drone = new Drone(parameters)
    ui_state.simulator.add(ui_state.drone.get())
}