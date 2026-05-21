        let appData = JSON.parse(JSON.stringify(window.defaultFullData));

        function init() {
            const parsedData = AppSync.loadTasks();
            if (parsedData) {
                if (parsedData.length < 27) {
                    syncToApp();
                } else {
                    appData = parsedData;
                }
            } else {
                syncToApp();
            }
            renderAll();
        }

        function renderAll() { renderEditor(); renderPreview(); }

        function renderEditor() {
            const container = document.getElementById('editor-list');
            container.innerHTML = '';
            appData.forEach((task, idx) => {
                const row = document.createElement('div');
                row.className = 'editor-row';
                row.innerHTML = `
                    <div class="row-top">
                        <input type="text" class="input-name" value="${task.name}" oninput="updateName(${idx}, this.value)">
                        <button class="btn-delete" onclick="removeTask(${idx})">Usuń</button>
                    </div>
                    <div class="options-wrapper">
                        ${renderOpt(idx, 'biuro', 'Biuro', task.biuro, task.biuroCus)}
                        ${renderOpt(idx, 'kuchnia', 'Kuchnia', task.kuchnia, task.kuchniaCus)}
                        ${renderOpt(idx, 'wc', 'Toalety', task.wc, task.wcCus)}
                    </div>
                `;
                container.appendChild(row);
            });
        }

        function renderOpt(idx, field, label, val, cus) {
            const optionsHTML = window.optionsList.map(opt => `<option value="${opt.v}" ${val === opt.v ? 'selected' : ''}>${opt.t}</option>`).join('');
            const showCus = val === 'other' ? 'block' : 'none';
            return `<div class="opt-group"><label>${label}</label><select onchange="updateVal(${idx}, '${field}', this.value)">${optionsHTML}</select>
                    <input type="text" class="custom-val-input" style="display:${showCus}" value="${cus}" oninput="updateCus(${idx}, '${field}Cus', this.value)"></div>`;
        }

        function renderPreview() {
            const theadRow = document.getElementById('preview-header-row');
            const tbody = document.getElementById('preview-body');
            tbody.innerHTML = ''; theadRow.innerHTML = ''; 
            let hasBiuro = false, hasKuchnia = false, hasWC = false;
            appData.forEach(t => { if (t.biuro !== '0') hasBiuro = true; if (t.kuchnia !== '0') hasKuchnia = true; if (t.wc !== '0') hasWC = true; });
            theadRow.innerHTML += `<th>Lp.</th><th>Czynność</th>`;
            if (hasBiuro) theadRow.innerHTML += `<th>Biuro</th>`;
            if (hasKuchnia) theadRow.innerHTML += `<th>Kuchnia</th>`;
            if (hasWC) theadRow.innerHTML += `<th>Toalety</th>`;
            let lp = 1, visible = 0;
            appData.forEach(task => {
                if (task.biuro !== '0' || task.kuchnia !== '0' || task.wc !== '0') {
                    visible++;
                    const tr = document.createElement('tr');
                    let rowHtml = `<td>${lp}.</td><td class="text-left">${task.name}</td>`;
                    if (hasBiuro) rowHtml += `<td>${getDisplay(task.biuro, task.biuroCus)}</td>`;
                    if (hasKuchnia) rowHtml += `<td>${getDisplay(task.kuchnia, task.kuchniaCus)}</td>`;
                    if (hasWC) rowHtml += `<td>${getDisplay(task.wc, task.wcCus)}</td>`;
                    tr.innerHTML = rowHtml; tbody.appendChild(tr); lp++;
                }
            });
            document.getElementById('empty-msg').style.display = visible === 0 ? 'block' : 'none';
        }

        function getDisplay(val, cus) { return val === 'other' ? (cus || 'Inne') : val; }

        function syncToApp() { AppSync.saveTasks(appData); }
        function manualSync() { syncToApp(); alert("Zsynchronizowano z ofertą."); }
        function resetToDefault() { if(confirm("Reset do domyślnych?")) { appData = JSON.parse(JSON.stringify(window.defaultFullData)); renderAll(); syncToApp(); } }
        function updateName(idx, val) { appData[idx].name = val; renderPreview(); syncToApp(); }
        function updateVal(idx, field, val) { appData[idx][field] = val; renderAll(); syncToApp(); }
        function updateCus(idx, field, val) { appData[idx][field] = val; renderPreview(); syncToApp(); }
        function addTask() { appData.push({ id: Date.now(), name: "Nowa czynność", biuro: "0", biuroCus: "", kuchnia: "0", kuchniaCus: "", wc: "0", wcCus: "" }); renderAll(); syncToApp(); }
        function removeTask(idx) { appData.splice(idx, 1); renderAll(); syncToApp(); }

        function loadData(input) {
            const file = input.files[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = function(e) { try { appData = JSON.parse(e.target.result); renderAll(); syncToApp(); } catch(err) {} };
            reader.readAsText(file); input.value = '';
        }

        function generateJPG() {
            html2canvas(document.getElementById("canvas-target"), { scale: 2 }).then(canvas => {
                const link = document.createElement('a'); link.download = 'Zakres.jpg'; link.href = canvas.toDataURL("image/jpeg", 0.9); link.click();
            });
        }
        init();