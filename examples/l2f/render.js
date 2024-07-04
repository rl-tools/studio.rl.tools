import * as THREE from "three"
export async function render(ui_state, parameters, state, action) {
    ui_state.drone.drone.position.set(...state.position)
    ui_state.drone.drone.quaternion.copy(new THREE.Quaternion(state.orientation[1], state.orientation[2], state.orientation[3], state.orientation[0]).normalize())
    const width = ui_state.canvas.width/ui_state.devicePixelRatio
    const height = ui_state.canvas.height/ui_state.devicePixelRatio
    ui_state.camera.aspect =  width / height
    ui_state.camera.updateProjectionMatrix()
    ui_state.renderer.setPixelRatio(ui_state.devicePixelRatio)
    ui_state.renderer.setSize(width, height)

    ui_state.controls.update()
    ui_state.renderer.render(ui_state.scene, ui_state.camera);
}
