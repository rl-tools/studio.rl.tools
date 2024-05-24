function render(ctx, state, action) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const canvasWidth = ctx.canvas.width;
    
    const pendulumLength = canvasWidth * 0.2;
    const bobRadius = canvasWidth * 0.02; 
    const pivotRadius = canvasWidth * 0.01;

    // Adjust theta to be 0 when pendulum is downwards
    const adjustedTheta = state.theta - Math.PI;

    const pendulumX = centerX + pendulumLength * Math.sin(adjustedTheta);
    const pendulumY = centerY + pendulumLength * Math.cos(adjustedTheta);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pendulumX, pendulumY);
    ctx.lineWidth = canvasWidth * 0.008;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pendulumX, pendulumY, bobRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, pivotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.stroke();

    // Draw torque arc
    const torqueMagnitude = -action[0];
    const arrowRadius = canvasWidth * 0.08
    const magnitudeRadians = (Math.PI * 2 / 3 * torqueMagnitude);
    const startAngle = Math.PI/2 + (torqueMagnitude > 0 ? 0 : magnitudeRadians); 
    const endAngle   = Math.PI/2 + (torqueMagnitude < 0 ? 0 : magnitudeRadians);

    ctx.beginPath();
    ctx.arc(centerX, centerY, arrowRadius, startAngle, endAngle);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = canvasWidth * 0.008;
    ctx.stroke();

    // Draw arrowhead
    const arrowAngle = torqueMagnitude > 0 ? endAngle : startAngle;
    const arrowX = centerX + arrowRadius * Math.cos(arrowAngle);
    const arrowY = centerY + arrowRadius * Math.sin(arrowAngle);

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - canvasWidth * 0.02 * Math.cos(arrowAngle - 0.3), arrowY - canvasWidth * 0.02 * Math.sin(arrowAngle - 0.3));
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - canvasWidth * 0.02 * Math.cos(arrowAngle + 0.3), arrowY - canvasWidth * 0.02 * Math.sin(arrowAngle + 0.3));
    ctx.stroke();
}

