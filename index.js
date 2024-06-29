

window.addEventListener('load', () => {
    let renderFunction;
    let exampleStateAction;
    let exampleParameters;
    let stateActionLimits;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const topSection = document.getElementById('topSection');
    const overlayToggle = document.getElementById('overlayToggle');
    const resizeHandle = document.getElementById('resizeHandle');
    const resizeHandleInner = document.getElementById('resizeHandleInner');

    function resizeEditor(editorContainer, editor){
        const rowHeight = editor.renderer.lineHeight || 20;
        const numberOfRows = Math.max(3, editor.session.getLength());
        const newHeight = numberOfRows * rowHeight;
        editorContainer.style.height = `${newHeight}px`;
        editor.resize();
    }

    function makeEditor(element){
        return ace.edit(element, {
            mode: "ace/mode/javascript",
            selectionStyle: "text",
            theme: "ace/theme/tomorrow"
        })
    }

    const vimBindingsToggle = document.getElementById('vimBindingsToggle');

    const exampleParametersEditorContainer = document.getElementById('exampleParameters')
    const exampleParametersEditor = makeEditor(exampleParametersEditorContainer);
    const exampleStateActionEditorContainer = document.getElementById('exampleStateAction')
    const exampleStateActionEditor = makeEditor(exampleStateActionEditorContainer);
    const stateActionLimitsEditorContainer = document.getElementById('stateActionLimits')
    const stateActionLimitsEditor = makeEditor(stateActionLimitsEditorContainer);
    const renderCodeEditorContainer = document.getElementById('renderCode')
    const renderCodeEditor = makeEditor(renderCodeEditorContainer);

    function toggleVimBindings(state){
        for(const editor of [exampleParametersEditor, exampleStateActionEditor, stateActionLimitsEditor, renderCodeEditor]){
            editor.setKeyboardHandler(state ? 'ace/keyboard/vim' : '');
        }
    }
    vimBindingsToggle.addEventListener('change', (event) => {
        localStorage.setItem("vim_bindings", event.target.checked)
        toggleVimBindings(event.target.checked)
    });
    const vimBindingsEnabled = localStorage.getItem("vim_bindings") != null ? localStorage.getItem("vim_bindings") === "true" : false;
    vimBindingsToggle.checked = vimBindingsEnabled;
    toggleVimBindings(vimBindingsEnabled);

    

    async function loadDefaults(example, forceReload) {
        try {
            const renderResponse = await fetch(`./examples/${example}/render.js`);
            const exampleParametersResponse = await fetch(`./examples/${example}/example_parameters.json`);
            const exampleStateActionResponse = await fetch(`./examples/${example}/example_state_action.json`);
            const limitsResponse = await fetch(`./examples/${example}/limits_state_action.txt`);

            if (!renderResponse.ok || !exampleParametersResponse.ok || !exampleStateActionResponse.ok || !limitsResponse.ok) {
                throw new Error('Failed to load default files.');
            }

            exampleParameters = localStorage.getItem("example_parameters") != null && !forceReload ? localStorage.getItem("example_parameters") : await exampleParametersResponse.text();
            exampleParametersEditor.setValue(exampleParameters, -1);
            resizeEditor(exampleParametersEditorContainer, exampleParametersEditor)
            localStorage.setItem("example_parameters", exampleParameters)

            exampleStateAction = localStorage.getItem("example_state_action") != null && !forceReload ? localStorage.getItem("example_state_action") : await exampleStateActionResponse.text();
            exampleStateActionEditor.setValue(exampleStateAction, -1);
            resizeEditor(exampleStateActionEditorContainer, exampleStateActionEditor)
            localStorage.setItem("example_state_action", exampleStateAction)

            const stateActionLimits = localStorage.getItem("limits_state_action") != null && !forceReload ? localStorage.getItem("limits_state_action") : await limitsResponse.text();
            stateActionLimitsEditor.setValue(stateActionLimits, -1);
            resizeEditor(stateActionLimitsEditorContainer, stateActionLimitsEditor)
            localStorage.setItem("limits_state_action", stateActionLimits)

            const renderCode = localStorage.getItem("render") != null && !forceReload ? localStorage.getItem("render") : await renderResponse.text();
            renderCodeEditor.setValue(renderCode, -1);
            resizeEditor(renderCodeEditorContainer, renderCodeEditor)


            setTimeout(updateRenderFunction, 100);
        } catch (error) {
            console.error('Error loading default files:', error);
        }
    }

    function updateRenderFunction() {
        try {
            exampleParameters = JSON.parse(exampleParametersEditor.getValue());
        }
        catch (error) {
            alert(`Error parsing example parameters:\n${error.message}\nYou might want to reset to default values (button at the bottom of the page).`);
            return
        }
        try {
            exampleStateAction = JSON.parse(exampleStateActionEditor.getValue());
        }
        catch (error) {
            alert(`Error parsing example state and action:\n${error.message}\nYou might want to reset to default values (button at the bottom of the page).`);
            return
        }

        try {
            stateActionLimits = parseLimits(stateActionLimitsEditor.getValue())
            createSliders(stateActionLimits, render)
        }
        catch (error) {
            alert(`Error parsing state and action limits:\n${error}\nYou might want to reset to default values (button at the bottom of the page).`)
            return
        }
        const renderCode = renderCodeEditor.getValue();
        localStorage.setItem("render", renderCode)
        try {
            let functionBody = renderCode.substring(renderCode.indexOf("{") + 1, renderCode.lastIndexOf("}"));
            renderFunction = new Function('ctx', 'parameters', 'state', 'action', functionBody);
            render();
        }
        catch (error) {
            alert(`Error parsing the render function:\n${error.message}\nYou might want to reset to default values (button at the bottom of the page).`)
            return
        }
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
        let value = exampleStateAction;
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
            const keys = path.split('.');
            let target = exampleStateAction;
            while (keys.length > 1) {
                const key = keys.shift();
                target = target[key];
            }
            const finalKey = keys[0];
            if (finalKey.includes('[')) {
                const [base, index] = finalKey.split('[');
                target[base][Number(index.slice(0, -1))] = value;
            } else {
                target[finalKey] = value;
            }
        exampleStateActionEditor.setValue(JSON.stringify(exampleStateAction, null, 4), -1);
        const stateActionTextareaEvent = new Event('input');
        exampleStateActionEditorContainer.dispatchEvent(stateActionTextareaEvent);
    }

    function render() {
        if (renderFunction) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            requestAnimationFrame(() => renderFunction(ctx, exampleParameters, exampleStateAction.state, exampleStateAction.action));
            renderFunction(ctx, exampleParameters, exampleStateAction.state, exampleStateAction.action);
        }
    }

    document.getElementById('exampleParameters').addEventListener('input', () => {
        localStorage.setItem("example_parameters", exampleParametersEditor.getValue())
    });

    document.getElementById('exampleStateAction').addEventListener('input', () => {
        localStorage.setItem("example_state_action", exampleStateActionEditor.getValue())
    });

    document.getElementById('stateActionLimits').addEventListener('input', () => {
        localStorage.setItem("limits_state_action", stateActionLimitsEditor.getValue())
    });


    function ctrl_enter_callback(event){
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            updateRenderFunction();
        }
    } 

    document.getElementById('renderCode').addEventListener('keydown', ctrl_enter_callback);
    document.getElementById('exampleParameters').addEventListener('keydown', ctrl_enter_callback);
    document.getElementById('exampleStateAction').addEventListener('keydown', ctrl_enter_callback);
    document.getElementById('stateActionLimits').addEventListener('keydown', ctrl_enter_callback);



    function resetButtonCallback(example){
        const confirmed = confirm(`Are you sure you want to load the ${example} example? This will overwrite your changes`)
        if (confirmed){
            if(localStorage.getItem("example_parameters") != null){
                localStorage.removeItem("example_parameters")
            }
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
    }

    const urlParams = new URLSearchParams(window.location.search);
    let default_environment = "acrobot";
    let forceReload = false;
    if(urlParams.has('force')){
        default_environment = urlParams.get('force')
        forceReload = true;
        topSection.style.height = `80vh`;
    }
    loadDefaults(default_environment, forceReload);
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateRenderFunction);
    document.getElementById('resetButtonPendulumSimple').addEventListener('click', () => resetButtonCallback("pendulum-simple"));
    document.getElementById('resetButtonPendulum').addEventListener('click', () => resetButtonCallback("pendulum"));
    document.getElementById('resetButtonAcrobot').addEventListener('click', () => resetButtonCallback("acrobot"));

    const ratio = window.devicePixelRatio || 1;

    const canvas_container = document.querySelector('.canvas-container');
    const onResize = () => {
        const size = Math.min(canvas_container.clientWidth, canvas_container.clientHeight);
        canvas.width = size * ratio;
        canvas.height = size * ratio;

        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        render()
    }
    onResize();
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === canvas_container) {
                onResize();
            }
        }
    });
    window.addEventListener('resize', onResize);
    resizeObserver.observe(canvas_container);

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
        // canvas_container.style.width = canvas_container.clientHeight;
    }

    function stopResizing() {
        document.removeEventListener('mousemove', resizeOverlay);
        document.removeEventListener('mouseup', stopResizing);
    }
})