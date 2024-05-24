function render(ctx, state, action) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.arc(state.position[0], state.position[1], action[0], 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(state.position[0], state.position[1]);
    ctx.lineTo(state.position[0] + Math.cos(state.orientation.test) * 50, state.position[1] + Math.sin(state.orientation.test) * 50);
    ctx.stroke();
}
