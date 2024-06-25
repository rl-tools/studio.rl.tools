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
    
    const agentRadius = parameters.AGENT_DIAMETER * scaleX / 2;
    
    // Draw agents and their actions
    for (let i = 0; i < parameters.N_AGENTS; i++) {
        const agent = state.agent_states[i];
        const posX = agent.position[0] * scaleX;
        const posY = agent.position[1] * scaleY;
        const orientation = -agent.orientation; // Negative orientation to match the canvas coordinate system
        
        // Draw agent body
        ctx.beginPath();
        ctx.arc(posX, posY, agentRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.stroke();
        
        // Draw agent orientation
        const endX = posX + agentRadius * Math.cos(orientation);
        const endY = posY + agentRadius * Math.sin(orientation);
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw actions (acceleration vectors)
        const agent_action = action[i];
        
        // Linear acceleration in the direction of orientation
        const accelMagnitude = agent_action[0] * scaleX;
        const accelX = accelMagnitude * Math.cos(orientation);
        const accelY = accelMagnitude * Math.sin(orientation);
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(posX + accelX, posY + accelY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrowhead for linear acceleration
        const angle = Math.atan2(accelY, accelX);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(posX + accelX, posY + accelY);
        ctx.lineTo(posX + accelX - headlen * Math.cos(angle - Math.PI / 6), posY + accelY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(posX + accelX, posY + accelY);
        ctx.lineTo(posX + accelX - headlen * Math.cos(angle + Math.PI / 6), posY + accelY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();

        // Draw circular arrow for angular acceleration
        const angularAccel = Math.max(-1, Math.min(1, -agent_action[1])); // Negative sign to match the canvas coordinate system
        const direction = Math.sign(angularAccel);
        const arrowRadius = agentRadius * 1.5;
        const arrowAngle = Math.PI / 3;
        const startAngle = orientation;
        const endAngle = orientation + arrowAngle * angularAccel;
        const arrowHeadSize = 10 * Math.abs(angularAccel);

        ctx.beginPath();
        ctx.arc(posX, posY, arrowRadius, startAngle, endAngle, angularAccel < 0);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrowhead for angular acceleration
        const arrowHeadAngle = endAngle - direction* arrowAngle * 0.05 - Math.PI / 2; 
        const arrowHeadX = posX + arrowRadius * Math.cos(endAngle);
        const arrowHeadY = posY + arrowRadius * Math.sin(endAngle);
        
        ctx.beginPath();
        ctx.moveTo(arrowHeadX, arrowHeadY);
        ctx.lineTo(
            arrowHeadX + direction * arrowHeadSize * Math.cos(arrowHeadAngle - Math.PI / 6),
            arrowHeadY + direction * arrowHeadSize * Math.sin(arrowHeadAngle - Math.PI / 6)
        );
        ctx.moveTo(arrowHeadX, arrowHeadY);
        ctx.lineTo(
            arrowHeadX + direction * arrowHeadSize * Math.cos(arrowHeadAngle + Math.PI / 6),
            arrowHeadY + direction * arrowHeadSize * Math.sin(arrowHeadAngle + Math.PI / 6)
        );
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
