
let renderFunction;
let exampleState;
let exampleAction;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const topSection = document.getElementById('topSection');
const overlayToggle = document.getElementById('overlayToggle');
const resizeHandle = document.getElementById('resizeHandle');

async function loadDefaults() {
    try {
        const renderResponse = await fetch('./default_render.js');
        const exampleResponse = await fetch('./default_example_state_action.json');
        const limitsResponse = await fetch('./default_limits_state_action.txt');

        if (!renderResponse.ok || !exampleResponse.ok || !limitsResponse.ok) {
            throw new Error('Failed to load default files.');
        }

        const renderCode = await renderResponse.text();
        const exampleStateAction = await exampleResponse.text();
        const stateActionLimits = await limitsResponse.text();

        const renderCodeTextarea = document.getElementById('renderCode')
        renderCodeTextarea.value = renderCode;
        renderCodeTextarea.rows = renderCode.split('\n').length;
        const exampleStateActionTextarea = document.getElementById('exampleStateAction')
        exampleStateActionTextarea.value = exampleStateAction;
        exampleStateActionTextarea.rows = exampleStateAction.split('\n').length;
        const stateActionLimitsTextarea = document.getElementById('stateActionLimits')
        stateActionLimitsTextarea.value = stateActionLimits;
        stateActionLimitsTextarea.rows = stateActionLimits.split('\n').length;

        parseExampleStateAction(exampleStateAction);
        createSliders(parseLimits(stateActionLimits), render);
        updateRenderFunction();
    } catch (error) {
        console.error('Error loading default files:', error);
    }
}

function updateRenderFunction() {
    const renderCode = document.getElementById('renderCode').value;
    let functionBody = renderCode.substring(renderCode.indexOf("{") + 1, renderCode.lastIndexOf("}"));
    renderFunction = new Function('ctx', 'state', 'action', functionBody);
    render();
}

function parseExampleStateAction(text) {
    const parsed = JSON.parse(text);
    exampleState = parsed.state;
    exampleAction = parsed.action;
}

function parseLimits(limitText) {
    const limits = {};
    const lines = limitText.split('\n');
    for (const line of lines) {
        if (line.trim() !== '') {
            const [path, range] = line.split('=');
            const [min, max] = range.trim().slice(1, -1).split(',').map(Number);
            limits[path.trim()] = [min, max];
        }
    }
    return limits;
}

function createSliders(limits, onChangeCallback) {
    const container = document.getElementById('sliders');
    container.innerHTML = '';
    for (const [path, [min, max]] of Object.entries(limits)) {
        const label = document.createElement('label');
        label.textContent = path;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = (max - min) / 100;
        slider.value = getValueFromPath(path);
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = Number(slider.value).toPrecision(3);

        slider.oninput = () => {
            setValueFromPath(path, Number(slider.value));
            valueDisplay.textContent = Number(slider.value).toPrecision(3);
            onChangeCallback();
        };
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        container.appendChild(document.createElement('br'));
    }
}

function getValueFromPath(path) {
    const keys = path.split('.');
    let value = keys.shift() === 'state' ? exampleState : exampleAction;
    while (keys.length) {
        const key = keys.shift();
        if (key.includes('[')) {
            const [base, index] = key.split('[');
            value = value[base][Number(index.slice(0, -1))];
        } else {
            value = value[key];
        }
    }
    return value;
}

function setValueFromPath(path, value) {
    if (path.startsWith('state')) {
        const keys = path.replace('state.', '').split('.');
        let target = exampleState;
        while (keys.length > 1) {
            const key = keys.shift();
            if (key.includes('[')) {
                const [base, index] = key.split('[');
                target = target[base][Number(index.slice(0, -1))];
            } else {
                target = target[key];
            }
        }
        const finalKey = keys[0];
        if (finalKey.includes('[')) {
            const [base, index] = finalKey.split('[');
            target[base][Number(index.slice(0, -1))] = value;
        } else {
            target[finalKey] = value;
        }
    } else if (path.startsWith('action')) {
        const index = path.match(/\d+/)[0]; // Extract the index from "action[0]"
        exampleAction[Number(index)] = value;
    }
}

function render() {
    if (renderFunction) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(() => renderFunction(ctx, exampleState, exampleAction));
        renderFunction(ctx, exampleState, exampleAction);
    }
}

document.getElementById('exampleStateAction').addEventListener('input', () => {
    parseExampleStateAction(document.getElementById('exampleStateAction').value);
    render();
});

document.getElementById('stateActionLimits').addEventListener('input', () => {
    const limits = parseLimits(document.getElementById('stateActionLimits').value);
    createSliders(limits, render);
});

document.getElementById('renderCode').addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        updateRenderFunction();
    }
});

function overlayToggleCallback(checked){
    if (checked) {
        topSection.classList.add('sticky');
        resizeHandle.classList.remove('hidden');
    } else {
        topSection.classList.remove('sticky');
        resizeHandle.classList.add('hidden');
    }
}

overlayToggleCallback(overlayToggle.checked);

overlayToggle.addEventListener('change', (event) => {
    overlayToggleCallback(event.target.checked)
});

resizeHandle.addEventListener('mousedown', (event) => {
    event.preventDefault();
    document.addEventListener('mousemove', resizeOverlay);
    document.addEventListener('mouseup', stopResizing);
});

function resizeOverlay(event) {
    const newHeight = event.clientY - topSection.getBoundingClientRect().top;
    topSection.style.height = `${newHeight}px`;
    const scaleFactor = newHeight / canvas.height;
    canvas.style.transform = `scale(${scaleFactor})`;
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.width = `${canvas.width * scaleFactor}px`;
    canvasContainer.style.width = `${canvas.height * scaleFactor}px`;
}

function stopResizing() {
    document.removeEventListener('mousemove', resizeOverlay);
    document.removeEventListener('mouseup', stopResizing);
}

window.addEventListener('load', () => {
    loadDefaults();
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateRenderFunction);
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', loadDefaults);
})