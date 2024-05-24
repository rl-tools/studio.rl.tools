function render(ctx, state, action) {
    console.log('Rendering, state:', state, 'action:', action);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(state["position[0]"], state["position[1]"], 20, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}