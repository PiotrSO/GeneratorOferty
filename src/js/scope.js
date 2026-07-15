        let appData = JSON.parse(JSON.stringify(window.defaultFullData));
        let appDataDay = JSON.parse(JSON.stringify(window.defaultFullData));

        function init() {
            const parsedData = AppSync.loadTasks();
            const parsedDataDay = localStorage.getItem('current_tasks_data_day');
            
            if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
                appData = parsedData;
            } else {
                appData = JSON.parse(JSON.stringify(window.defaultFullData));
                syncToApp('scope');
            }
            
            if (parsedDataDay) {
                try {
                    const parsedDay = JSON.parse(parsedDataDay);
                    if (Array.isArray(parsedDay) && parsedDay.length > 0) {
                        appDataDay = parsedDay;
                    } else {
                        appDataDay = JSON.parse(JSON.stringify(window.defaultFullData));
                        syncToAppDay('scope');
                    }
                } catch (e) {
                    appDataDay = JSON.parse(JSON.stringify(window.defaultFullData));
                    syncToAppDay('scope');
                }
            } else {
                appDataDay = JSON.parse(JSON.stringify(window.defaultFullData));
                syncToAppDay('scope');
            }
            renderAll();
        }

        function renderAll() { renderEditor(); renderEditorDay(); renderPreview(); renderPreviewDay(); }

        // ===== EDYTOR 1: ZAKRESY PRAC PORZĄDKOWYCH =====
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

        // ===== EDYTOR 2: ZAKRESY SERWISU DZIENNEGO =====
        function renderEditorDay() {
            const container = document.getElementById('editor-list-day');
            container.innerHTML = '';
            appDataDay.forEach((task, idx) => {
                const row = document.createElement('div');
                row.className = 'editor-row';
                row.innerHTML = `
                    <div class="row-top">
                        <input type="text" class="input-name" value="${task.name}" oninput="updateNameDay(${idx}, this.value)">
                        <button class="btn-delete" onclick="removeTaskDay(${idx})">Usuń</button>
                    </div>
                    <div class="options-wrapper">
                        ${renderOptDay(idx, 'biuro', 'Biuro', task.biuro, task.biuroCus)}
                        ${renderOptDay(idx, 'kuchnia', 'Kuchnia', task.kuchnia, task.kuchniaCus)}
                        ${renderOptDay(idx, 'wc', 'Toalety', task.wc, task.wcCus)}
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

        function renderOptDay(idx, field, label, val, cus) {
            const optionsHTML = window.optionsList.map(opt => `<option value="${opt.v}" ${val === opt.v ? 'selected' : ''}>${opt.t}</option>`).join('');
            const showCus = val === 'other' ? 'block' : 'none';
            return `<div class="opt-group"><label>${label}</label><select onchange="updateValDay(${idx}, '${field}', this.value)">${optionsHTML}</select>
                    <input type="text" class="custom-val-input" style="display:${showCus}" value="${cus}" oninput="updateCusDay(${idx}, '${field}Cus', this.value)"></div>`;
        }

        // ===== TABELA 1: ZAKRESY PRAC =====
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

        // ===== TABELA 2: ZAKRESY SERWISU DZIENNEGO =====
        function renderPreviewDay() {
            const theadRow = document.getElementById('preview-header-row-day');
            const tbody = document.getElementById('preview-body-day');
            tbody.innerHTML = ''; theadRow.innerHTML = ''; 
            let hasBiuro = false, hasKuchnia = false, hasWC = false;
            appDataDay.forEach(t => { if (t.biuro !== '0') hasBiuro = true; if (t.kuchnia !== '0') hasKuchnia = true; if (t.wc !== '0') hasWC = true; });
            theadRow.innerHTML += `<th>Lp.</th><th>Czynność</th>`;
            if (hasBiuro) theadRow.innerHTML += `<th>Biuro</th>`;
            if (hasKuchnia) theadRow.innerHTML += `<th>Kuchnia</th>`;
            if (hasWC) theadRow.innerHTML += `<th>Toalety</th>`;
            let lp = 1, visible = 0;
            appDataDay.forEach(task => {
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
            document.getElementById('empty-msg-day').style.display = visible === 0 ? 'block' : 'none';
        }

        function getDisplay(val, cus) { return val === 'other' ? (cus || 'Inne') : val; }

        // ===== SYNCHRONIZACJA TABELA 1 =====
        function syncToApp(source) { AppSync.saveTasks(appData, source); }
        function manualSync() { syncToApp('scope'); syncToAppDay('scope'); alert("Zsynchronizowano z ofertą."); }
        function resetToDefault() { if(confirm("Reset do domyślnych?")) { appData = JSON.parse(JSON.stringify(window.defaultFullData)); renderAll(); syncToApp('scope'); } }
        
        function updateName(idx, val) { appData[idx].name = val; renderPreview(); syncToApp('scope'); }
        function updateVal(idx, field, val) { appData[idx][field] = val; renderAll(); syncToApp('scope'); }
        function updateCus(idx, field, val) { appData[idx][field] = val; renderPreview(); syncToApp('scope'); }
        function addTask() { appData.push({ id: Date.now(), name: "Nowa czynność", biuro: "0", biuroCus: "", kuchnia: "0", kuchniaCus: "", wc: "0", wcCus: "" }); renderAll(); syncToApp('scope'); }
        function removeTask(idx) { appData.splice(idx, 1); renderAll(); syncToApp('scope'); }

        // ===== SYNCHRONIZACJA TABELA 2 =====
        function syncToAppDay(source) { AppSync.saveTasksDay(appDataDay, source); }
        function resetToDefaultDay() { if(confirm("Reset do domyślnych?")) { appDataDay = JSON.parse(JSON.stringify(window.defaultFullData)); renderAll(); syncToAppDay('scope'); } }
        
        function updateNameDay(idx, val) { appDataDay[idx].name = val; renderPreviewDay(); syncToAppDay('scope'); }
        function updateValDay(idx, field, val) { appDataDay[idx][field] = val; renderAll(); syncToAppDay('scope'); }
        function updateCusDay(idx, field, val) { appDataDay[idx][field] = val; renderPreviewDay(); syncToAppDay('scope'); }
        function addTaskDay() { appDataDay.push({ id: Date.now(), name: "Nowa czynność", biuro: "0", biuroCus: "", kuchnia: "0", kuchniaCus: "", wc: "0", wcCus: "" }); renderAll(); syncToAppDay('scope'); }
        function removeTaskDay(idx) { appDataDay.splice(idx, 1); renderAll(); syncToAppDay('scope'); }

        function loadData(input) {
            const file = input.files[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = function(e) { 
                try { 
                    const data = JSON.parse(e.target.result); 
                    if (Array.isArray(data) && data.every(item => item && typeof item.name === 'string')) {
                        appData = data; 
                        renderAll(); 
                        syncToApp('scope'); 
                    } else {
                        alert("Nieprawidłowy format pliku JSON z zadaniami.");
                    }
                } catch(err) {
                    alert("Błąd odczytu lub przetwarzania pliku JSON.");
                } 
            };
            reader.readAsText(file); input.value = '';
        }

        function generateJPG() {
            html2canvas(document.getElementById("canvas-target"), { scale: 2 }).then(canvas => {
                const link = document.createElement('a'); link.download = 'Zakres.jpg'; link.href = canvas.toDataURL("image/jpeg", 0.9); link.click();
            });
        }
        
        function generateJPGDay() {
            html2canvas(document.getElementById("canvas-target-day"), { scale: 2 }).then(canvas => {
                const link = document.createElement('a'); link.download = 'Zakres_Serwis_Dzienny.jpg'; link.href = canvas.toDataURL("image/jpeg", 0.9); link.click();
            });
        }
        
        window.refreshTasks = init;
        init();