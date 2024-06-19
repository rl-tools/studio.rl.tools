function render(ctx, parameters, state, action) {

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const scaleX = canvasWidth / parameters.ARENA_WIDTH;
    const scaleY = canvasHeight / parameters.ARENA_HEIGHT;

    // Draw the bottleneck barrier
    const barrierX = (parameters.ARENA_WIDTH / 2 - parameters.BARRIER_WIDTH / 2) * scaleX;
    const barrierWidth = parameters.BARRIER_WIDTH * scaleX;
    const bottleneckTopY = (parameters.BOTTLENECK_POSITION - parameters.BOTTLENECK_WIDTH / 2) * scaleY;
    const bottleneckBottomY = (parameters.BOTTLENECK_POSITION + parameters.BOTTLENECK_WIDTH / 2) * scaleY;

    ctx.fillStyle = 'gray';
    ctx.fillRect(barrierX, 0, barrierWidth, bottleneckTopY);
    ctx.fillRect(barrierX, bottleneckBottomY, barrierWidth, canvasHeight - bottleneckBottomY);

    // Draw agents
    for (let i = 0; i < parameters.N_AGENTS; i++) {
        const agent = state.agent_states[i];
        const posX = agent.position[0] * scaleX;
        const posY = agent.position[1] * scaleY;
        const orientation = agent.orientation;
        const radius = parameters.AGENT_DIAMETER * scaleX / 2;

        // Draw agent body
        ctx.beginPath();
        ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.stroke();

        // Draw agent orientation
        const endX = posX + radius * Math.cos(orientation);
        const endY = posY + radius * Math.sin(orientation);

        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw actions (acceleration vectors)
    for (let i = 0; i < parameters.N_AGENTS; i++) {
        const agent = state.agent_states[i];
        const agent_action = action[i];
        const posX = agent.position[0] * scaleX;
        const posY = agent.position[1] * scaleY;

        // Linear acceleration in the direction of orientation
        const accelMagnitude = agent_action[0] * scaleX;
        const accelX = accelMagnitude * Math.cos(agent.orientation);
        const accelY = accelMagnitude * Math.sin(agent.orientation);

        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(posX + accelX, posY + accelY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(accelY, accelX);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(posX + accelX, posY + accelY);
        ctx.lineTo(posX + accelX - headlen * Math.cos(angle - Math.PI / 6), posY + accelY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(posX + accelX, posY + accelY);
        ctx.lineTo(posX + accelX - headlen * Math.cos(angle + Math.PI / 6), posY + accelY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
}
