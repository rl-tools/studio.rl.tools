export async function render(ui_state, parameters, state, action) {
    ui_state.box.position.set(state.position.x, state.position.y, state.position.z)
    const width = ui_state.canvas.width
    const height = ui_state.canvas.height
    ui_state.camera.aspect =  width / height
    ui_state.camera.updateProjectionMatrix()
    ui_state.renderer.setSize(width/ui_state.devicePixelRatio, height/ui_state.devicePixelRatio)
    ui_state.controls.update()
    ui_state.renderer.render(ui_state.scene, ui_state.camera);

}
