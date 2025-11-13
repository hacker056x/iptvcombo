document.addEventListener('DOMContentLoaded', () => {
    const filenameInput = document.getElementById('filename');
    const countInput = document.getElementById('count');
    const suffixSelect = document.getElementById('suffixType');
    const generateBtn = document.getElementById('generateBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    const copyBtn = document.getElementById('copyBtn');
    const output = document.getElementById('output');
    const counter = document.getElementById('counter');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const speedEl = document.getElementById('speed');

    let worker = null;
    let allCombos = [];
    let startTime = 0;
    let lastUpdate = 0;
    const displayLimit = 500; // Mostrar últimos 500 combos

    generateBtn.addEventListener('click', () => {
        const count = Math.min(parseInt(countInput.value) || 0, 1000000);
        const filename = filenameInput.value.trim() || 'iptv_combos';

        if (count < 1) return alert('Cantidad mínima: 1');
        if (!filename) return alert('Nombre de archivo requerido');

        // Reset
        allCombos = [];
        output.textContent = 'Iniciando generación...\n';
        counter.textContent = '0';
        saveBtn.disabled = true;
        copyBtn.disabled = true;
        generateBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        speedEl.textContent = '0 combos/s';
        startTime = Date.now();
        lastUpdate = startTime;

        // Iniciar worker
        if (worker) worker.terminate();
        worker = new Worker('worker.js');
        worker.postMessage({ type: 'start', count, suffixType: suffixSelect.value });

        let generated = 0;
        let lastSpeed = 0;

        const updateUI = () => {
            if (!worker) return;

            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            const speed = elapsed > 0 ? Math.round(generated / elapsed) : 0;

            // Actualizar barra
            const progress = Math.min(Math.round((generated / count) * 100), 100);
            progressFill.style.width = progress + '%';
            progressText.textContent = progress + '%';

            // Velocidad (solo cada 200ms)
            if (now - lastUpdate > 200) {
                speedEl.textContent = `${speed.toLocaleString()} combos/s`;
                lastUpdate = now;
                lastSpeed = speed;
            } else {
                speedEl.textContent = `${lastSpeed.toLocaleString()} combos/s`;
            }

            // Contador
            counter.textContent = generated.toLocaleString();

            // Mostrar últimos combos
            const display = allCombos.slice(-displayLimit);
            output.textContent = display.join('\n') + (allCombos.length > displayLimit ? `\n\n... y ${allCombos.length - displayLimit} más` : '');
            output.scrollTop = output.scrollHeight;

            requestAnimationFrame(updateUI);
        };

        requestAnimationFrame(updateUI);

        worker.onmessage = function(e) {
            const { type, generated: gen, total, chunk, combos } = e.data;

            if (type === 'progress') {
                generated = gen;
                allCombos.push(...chunk);
            }

            if (type === 'done') {
                allCombos.push(...combos);
                generated = allCombos.length;
                finishGeneration();
            }
        };
    });

    stopBtn.addEventListener('click', () => {
        if (worker) {
            worker.postMessage({ type: 'stop' });
            worker.terminate();
        }
        finishGeneration();
    });

    function finishGeneration() {
        if (worker) worker.terminate();
        worker = null;
        generateBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        progressContainer.style.display = 'none';
        saveBtn.disabled = false;
        copyBtn.disabled = false;

        // Mostrar todo
        output.textContent = allCombos.join('\n');
        counter.textContent = allCombos.length.toLocaleString();
        speedEl.textContent = '¡Completado!';

        generateBtn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
        setTimeout(() => generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generar', 2000);
    }

    saveBtn.addEventListener('click', () => {
        const blob = new Blob([allCombos.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameInput.value.trim()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(allCombos.join('\n')).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar', 2000);
        });
    });
});