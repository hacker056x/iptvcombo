// worker.js
const firstNames = ['John','Jane','Alex','Emma','Luis','Ana','Carlos','Maria','Jose','Laura','David','Sofia','Pablo','Lucia','Diego','Valeria','Mateo','Isabella','Juan','Camila'];
const lastNames = ['Smith','Doe','Brown','Wilson','Taylor','Johnson','Lee','Garcia','Martinez','Lopez','Perez','Gomez','Rodriguez','Fernandez','Torres','Sanchez','Ramirez','Cruz','Morales','Ortiz'];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateCombo(type) {
    let name = randomFrom(firstNames);
    let suffix = '';
    let password = randomFrom(lastNames);

    switch(parseInt(type)) {
        case 1: suffix = Math.floor(Math.random() * 151) + 1900; break;
        case 2: suffix = Math.floor(Math.random() * 1001); break;
        case 3: suffix = String.fromCharCode(65 + Math.floor(Math.random() * 52)); break;
        case 4: name = String.fromCharCode(65 + Math.floor(Math.random() * 52)) + name; break;
        case 5: name = String(Math.floor(Math.random() * 1000)).padStart(3,'0') + name; break;
        case 6: name = (Math.floor(Math.random() * 151) + 1900) + name; break;
        case 7: name = (Math.floor(Math.random() * 151) + 1900) + name; suffix = String(Math.floor(Math.random() * 1000)).padStart(3,'0'); break;
        case 8: name = String(Math.floor(Math.random() * 1000)).padStart(3,'0') + name; suffix = Math.floor(Math.random() * 151) + 1900; break;
        case 9: name = String(Math.floor(Math.random() * 1000)).padStart(3,'0') + name; suffix = String(Math.floor(Math.random() * 1000)).padStart(3,'0'); break;
        case 10: name = Math.floor(Math.random() * (123456-123+1)) + 123 + name; break;
        case 11: suffix = Math.floor(Math.random() * (123456-123+1)) + 123; break;
        case 12: suffix = '0'.repeat(Math.floor(Math.random() * 4) + 1); break;
        case 13: return generateCombo(Math.floor(Math.random() * 12) + 1);
        case 15: break;
    }
    return `${name}${suffix}:${password}`;
}

let unique = new Set();
let buffer = [];
const chunkSize = 1000; // Más rápido

self.onmessage = function(e) {
    const { type, count, suffixType } = e.data;

    if (type === 'start') {
        unique.clear();
        buffer = [];
        let generated = 0;

        const sendChunk = () => {
            if (buffer.length > 0) {
                self.postMessage({
                    type: 'progress',
                    generated,
                    total: count,
                    chunk: buffer
                });
                buffer = [];
            }
        };

        const interval = setInterval(() => {
            for (let i = 0; i < chunkSize && generated < count; i++) {
                let combo;
                do {
                    combo = generateCombo(suffixType);
                } while (unique.has(combo));
                unique.add(combo);
                buffer.push(combo);
                generated++;
            }

            sendChunk();

            if (generated >= count) {
                clearInterval(interval);
                sendChunk();
                self.postMessage({ type: 'done', combos: buffer });
            }
        }, 0);
    }
};