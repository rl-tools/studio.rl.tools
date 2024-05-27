
let renderFunction;
let exampleState;
let exampleAction;
let stateActionLimits;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const topSection = document.getElementById('topSection');
const overlayToggle = document.getElementById('overlayToggle');
const resizeHandle = document.getElementById('resizeHandle');
const resizeHandleInner = document.getElementById('resizeHandleInner');

async function loadDefaults(example) {
    try {
        const renderResponse = await fetch(`./examples/${example}/render.js`);
        const exampleResponse = await fetch(`./examples/${example}/example_state_action.json`);
        const limitsResponse = await fetch(`./examples/${example}/limits_state_action.txt`);

        if (!renderResponse.ok || !exampleResponse.ok || !limitsResponse.ok) {
            throw new Error('Failed to load default files.');
        }

        let exampleStateAction = localStorage.getItem("example_state_action") != null ? localStorage.getItem("example_state_action") : await exampleResponse.text();
        const exampleStateActionTextarea = document.getElementById('exampleStateAction')
        exampleStateActionTextarea.value = exampleStateAction;
        exampleStateActionTextarea.rows = exampleStateAction.split('\n').length;

        const renderCode = localStorage.getItem("render") != null ? localStorage.getItem("render") : await renderResponse.text();
        const renderCodeTextarea = document.getElementById('renderCode')
        renderCodeTextarea.value = renderCode;
        renderCodeTextarea.rows = renderCode.split('\n').length;

        const stateActionLimits = localStorage.getItem("limits_state_action") != null ? localStorage.getItem("limits_state_action") : await limitsResponse.text();
        const stateActionLimitsTextarea = document.getElementById('stateActionLimits')
        stateActionLimitsTextarea.value = stateActionLimits;
        stateActionLimitsTextarea.rows = stateActionLimits.split('\n').length;

        setTimeout(updateRenderFunction, 100);
    } catch (error) {
        console.error('Error loading default files:', error);
    }
}

function updateRenderFunction() {
    try {
        parseExampleStateAction(document.getElementById('exampleStateAction').value);
    }
    catch (error) {
        alert(`Error parsing example state and action:\n${error.message}\nYou might want to reset to default values (button at the bottom of the page).`);
        return
    }

    try {
        stateActionLimits = parseLimits(document.getElementById('stateActionLimits').value)
        createSliders(stateActionLimits, render)
    }
    catch (error) {
        alert(`Error parsing state and action limits:\n${error}\nYou might want to reset to default values (button at the bottom of the page).`)
        return
    }
    const renderCode = document.getElementById('renderCode').value;
    localStorage.setItem("render", renderCode)
    try {
        let functionBody = renderCode.substring(renderCode.indexOf("{") + 1, renderCode.lastIndexOf("}"));
        renderFunction = new Function('ctx', 'state', 'action', functionBody);
        render();
    }
    catch (error) {
        alert(`Error parsing the render function:\n${error.message}\nYou might want to reset to default values (button at the bottom of the page).`)
        return
    }
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
    const exampleStateActionTextarea = document.getElementById('exampleStateAction')
    exampleStateActionTextarea.value = JSON.stringify({ state: exampleState, action: exampleAction }, null, 4);
    const stateActionTextareaEvent = new Event('input');
    exampleStateActionTextarea.dispatchEvent(stateActionTextareaEvent);
}

function render() {
    if (renderFunction) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(() => renderFunction(ctx, exampleState, exampleAction));
        renderFunction(ctx, exampleState, exampleAction);
    }
}

document.getElementById('exampleStateAction').addEventListener('input', () => {
    localStorage.setItem("example_state_action", document.getElementById('exampleStateAction').value)
});

document.getElementById('stateActionLimits').addEventListener('input', () => {
    localStorage.setItem("limits_state_action", document.getElementById('stateActionLimits').value)
});


function ctrl_enter_callback(event){
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        updateRenderFunction();
    }
} 

document.getElementById('renderCode').addEventListener('keydown', ctrl_enter_callback);
document.getElementById('exampleStateAction').addEventListener('keydown', ctrl_enter_callback);
document.getElementById('stateActionLimits').addEventListener('keydown', ctrl_enter_callback);

function overlayToggleCallback(checked){
    if (checked) {
        topSection.classList.add('sticky');
        resizeHandle.classList.remove('hidden');
        resizeHandleInner.classList.remove('hidden');
    } else {
        topSection.classList.remove('sticky');
        resizeHandle.classList.add('hidden');
        resizeHandleInner.classList.add('hidden');
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
    const newHeight = event.clientY - topSection.getBoundingClientRect().top - 20; // -20 for the padding
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


function resetButtonCallback(example){
    if(localStorage.getItem("example_state_action") != null){
        localStorage.removeItem("example_state_action")
    }
    if(localStorage.getItem("limits_state_action") != null){
        localStorage.removeItem("limits_state_action")
    }
    if(localStorage.getItem("render") != null){
        localStorage.removeItem("render")
    }
    loadDefaults(example);
}

window.addEventListener('load', () => {
    loadDefaults("pendulum");
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateRenderFunction);
    document.getElementById('resetButtonPendulum').addEventListener('click', () => resetButtonCallback("pendulum"));
    document.getElementById('resetButtonAcrobot').addEventListener('click', () => resetButtonCallback("acrobot"));
})