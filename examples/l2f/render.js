import * as THREE from "three"
export async function render(ui_state, parameters, state, action) {
    ui_state.drone.drone.position.set(state.position.x, state.position.y, state.position.z)
    ui_state.drone.drone.quaternion.copy(new THREE.Quaternion(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w).normalize())
    const width = ui_state.canvas.width
    const height = ui_state.canvas.height
    console.log("Setting size to ", width, height)
    ui_state.camera.aspect =  width / height
    ui_state.camera.updateProjectionMatrix()
    ui_state.renderer.setSize(width/ui_state.devicePixelRatio, height/ui_state.devicePixelRatio)

    ui_state.controls.update()
    ui_state.renderer.render(ui_state.scene, ui_state.camera);

}
