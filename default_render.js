function render(ctx, state, action) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const canvasWidth = ctx.canvas.width;
    
    const pendulumLength = canvasWidth * 0.2;
    const bobRadius = canvasWidth * 0.02; 
    const pivotRadius = canvasWidth * 0.01;

    const pendulumX = centerX + pendulumLength * Math.sin(state.theta);
    const pendulumY = centerY + pendulumLength * Math.cos(state.theta);

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

    const torqueMagnitude = action[0];
    const arrowRadius = canvasWidth * 0.04 + canvasWidth * 0.06 * Math.abs(torqueMagnitude);
    const arrowAngle = torqueMagnitude > 0 ? -Math.PI / 2 : Math.PI / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, arrowRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.beginPath();
    const arrowX = centerX + arrowRadius * Math.cos(arrowAngle);
    const arrowY = centerY + arrowRadius * Math.sin(arrowAngle);
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - canvasWidth * 0.02 * Math.cos(arrowAngle - 0.3), arrowY - canvasWidth * 0.02 * Math.sin(arrowAngle - 0.3));
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - canvasWidth * 0.02 * Math.cos(arrowAngle + 0.3), arrowY - canvasWidth * 0.02 * Math.sin(arrowAngle + 0.3));
    ctx.stroke();
}
