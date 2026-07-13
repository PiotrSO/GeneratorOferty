// --- ZMIENNE GLOBALNE DLA ZAKRESU PRAC ---
let tasksData = [];
let tasksDataDay = [];

// Domyślne zadania (odpowiadające starej tabeli, aby nie była pusta)


function getValue(id, def) { const el = document.getElementById(id); return el ? el.value : def; }
function safeSetText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }
function safeSetHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }

function upd() {
    const titleVal = getValue('iTitle', 'WSTĘPNA OFERTA\nNA USŁUGI PORZĄDKOWE');
    const client = getValue('iClient', '[NAZWA KLIENTA]');
    const addr = getValue('iAddr', '[adres klienta]');
    const date = getValue('iDate', '');
    const loc = getValue('iLoc', '[adres Obiektu]');
    const area = getValue('iArea', '...');
    const price = getValue('iPrice', '0,00');

    const dayRbh = parseFloat(getValue('iDayRbh', '0').replace(',', '.'));
    const dayFreq = getValue('iDayFreq', '5');
    const dayHours = getValue('iDayHours', '8:00 do 16:00');
    const eveRbh = parseFloat(getValue('iEveRbh', '0').replace(',', '.'));
    const eveFreq = getValue('iEveFreq', '5');
    const eveTime = getValue('iEveTime', '17:00');

    // Zapis stanu paska bocznego do localStorage
    const sidebarState = {
        title: titleVal,
        client: client,
        addr: addr,
        date: date,
        loc: loc,
        area: area,
        price: price,
        dayRbh: getValue('iDayRbh', '0'),
        dayFreq: dayFreq,
        dayHours: dayHours,
        eveRbh: getValue('iEveRbh', '0'),
        eveFreq: eveFreq,
        eveTime: eveTime
    };
    localStorage.setItem('oferta_sidebar_state', JSON.stringify(sidebarState));
    if (window.AppSync) {
        window.AppSync.triggerRefresh('offer');
    }

    const titleHtml = titleVal.replace(/\n/g, '<br>');
    const coverTitle = document.getElementById('oTitleCover');
    if (coverTitle) coverTitle.innerHTML = titleHtml;
    document.querySelectorAll('.ph-title-dynamic').forEach(el => el.innerHTML = titleHtml);

    safeSetText('oClient1', client);
    safeSetText('oDate2', date);
    safeSetText('oClient2', client);
    safeSetHTML('oAddr2', addr.replace(/\n/g, '<br>'));
    safeSetText('oArea2', area);
    safeSetText('oLoc2', loc);
    safeSetText('oPrice2', price);

    let serviceHtml = '<b>Usługa obejmuje:</b><br><br>';
    let hasService = false;
    if (dayRbh > 0) {
        serviceHtml += `- Serwis Dzienny, realizowany ${dayFreq} raz/y w tygodniu, w godzinach od ${dayHours}, ${dayRbh} roboczogodzin dziennie.<br>`;
        hasService = true;
    }
    if (eveRbh > 0) {
        const freqVal = parseFloat(eveFreq.replace(',', '.'));
        let weekly = (!isNaN(freqVal) && !isNaN(eveRbh)) ? freqVal * eveRbh : 0;
        serviceHtml += `- Wieczorny Serwis Porządkowy, realizowany ${eveFreq} raz/y w tygodniu, po godzinie ${eveTime}, średnio ${eveRbh} roboczogodziny dziennie, ${weekly} godzin tygodniowo<br>`;
        hasService = true;
    }
    if (!hasService) serviceHtml += '<span style="color:red; font-size:10px;">(Wpisz liczbę RBH w panelu bocznym)</span><br>';
    serviceHtml += '<br>Serwis świadczony w dni robocze z wyłączeniem dni ustawowo wolnych.';
    const serviceCell = document.getElementById('oServiceCell');
    if (serviceCell) serviceCell.innerHTML = serviceHtml;
}

// --- RENDEROWANIE TABELI ZAKRESU (STRONA 3) ---
function renderTasksTable() {
    console.log("DEBUG renderTasksTable: tasksData =", tasksData);
    console.log("DEBUG localStorage current_tasks_data =", localStorage.getItem('current_tasks_data'));
    const theadRow = document.getElementById('tasks-thead-row');
    const tbody = document.getElementById('tasks-tbody');
    if (!theadRow || !tbody) return;

    tbody.innerHTML = '';
    theadRow.innerHTML = '';

    // Sprawdź które kolumny mają dane
    let hasBiuro = false, hasKuchnia = false, hasWC = false;
    tasksData.forEach(t => {
        if (t.biuro && t.biuro !== '0') hasBiuro = true;
        if (t.kuchnia && t.kuchnia !== '0') hasKuchnia = true;
        if (t.wc && t.wc !== '0') hasWC = true;
    });

    // Nagłówki
    theadRow.innerHTML += `<th class="col-id">Lp.</th><th>Czynność</th>`;
    if (hasBiuro) theadRow.innerHTML += `<th class="col-freq">Biuro</th>`;
    if (hasKuchnia) theadRow.innerHTML += `<th class="col-freq">Kuchnia</th>`;
    if (hasWC) theadRow.innerHTML += `<th class="col-freq">Toalety</th>`;

    // Wiersze
    let lp = 1;
    tasksData.forEach(task => {
        const showRow = (task.biuro && task.biuro !== '0') ||
            (task.kuchnia && task.kuchnia !== '0') ||
            (task.wc && task.wc !== '0');

        if (showRow) {
            const tr = document.createElement('tr');
            let rowHtml = `<td>${lp}.</td><td class="text-left">${task.name}</td>`;

            const val = (v, c) => {
                if (!v || v === '0') return '-';
                if (v === 'other') return c || '(brak)';
                return v;
            };

            if (hasBiuro) rowHtml += `<td>${val(task.biuro, task.biuroCus)}</td>`;
            if (hasKuchnia) rowHtml += `<td>${val(task.kuchnia, task.kuchniaCus)}</td>`;
            if (hasWC) rowHtml += `<td>${val(task.wc, task.wcCus)}</td>`;

            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
            lp++;
        }
    });
}

// --- RENDEROWANIE TABELI ZAKRESU SERWISU DZIENNEGO (STRONA 3a) ---
function renderTasksTableDay() {
    const theadRow = document.getElementById('tasks-thead-row-day');
    const tbody = document.getElementById('tasks-tbody-day');
    if (!theadRow || !tbody) return;

    tbody.innerHTML = '';
    theadRow.innerHTML = '';

    // Sprawdź które kolumny mają dane
    let hasBiuro = false, hasKuchnia = false, hasWC = false;
    tasksDataDay.forEach(t => {
        if (t.biuro && t.biuro !== '0') hasBiuro = true;
        if (t.kuchnia && t.kuchnia !== '0') hasKuchnia = true;
        if (t.wc && t.wc !== '0') hasWC = true;
    });

    if (!hasBiuro && !hasKuchnia && !hasWC) return;

    // Nagłówki
    theadRow.innerHTML += `<th class="col-id">Lp.</th><th>Czynność</th>`;
    if (hasBiuro) theadRow.innerHTML += `<th class="col-freq">Biuro</th>`;
    if (hasKuchnia) theadRow.innerHTML += `<th class="col-freq">Kuchnia</th>`;
    if (hasWC) theadRow.innerHTML += `<th class="col-freq">Toalety</th>`;

    // Wiersze
    let lp = 1;
    tasksDataDay.forEach(task => {
        const showRow = (task.biuro && task.biuro !== '0') ||
            (task.kuchnia && task.kuchnia !== '0') ||
            (task.wc && task.wc !== '0');

        if (showRow) {
            const tr = document.createElement('tr');
            let rowHtml = `<td>${lp}.</td><td class="text-left">${task.name}</td>`;

            const val = (v, c) => {
                if (!v || v === '0') return '-';
                if (v === 'other') return c || '(brak)';
                return v;
            };

            if (hasBiuro) rowHtml += `<td>${val(task.biuro, task.biuroCus)}</td>`;
            if (hasKuchnia) rowHtml += `<td>${val(task.kuchnia, task.kuchniaCus)}</td>`;
            if (hasWC) rowHtml += `<td>${val(task.wc, task.wcCus)}</td>`;

            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
            lp++;
        }
    });
}

// --- DYNAMICZNA NUMERACJA STRON ---
function updatePageNumbers() {
    let hasDayTasks = false;
    tasksDataDay.forEach(task => {
        if ((task.biuro && task.biuro !== '0') ||
            (task.kuchnia && task.kuchnia !== '0') ||
            (task.wc && task.wc !== '0')) {
            hasDayTasks = true;
        }
    });

    const pageDay = document.getElementById('page-daytime-tasks');
    if (pageDay) {
        if (hasDayTasks) {
            pageDay.style.display = 'block';
        } else {
            pageDay.style.display = 'none';
        }
    }

    const pages = Array.from(document.querySelectorAll('.workspace .page'));
    const visiblePages = pages.filter(p => p.style.display !== 'none');
    const totalPages = visiblePages.length;

    let currentPageIndex = 1;
    visiblePages.forEach((page) => {
        const numDisplay = page.querySelector('.page-num-display');
        if (numDisplay) {
            numDisplay.innerText = `${currentPageIndex}/${totalPages}`;
        }
        currentPageIndex++;
    });
}

// --- FUNKCJA WCZYTYWANIA JSON Z GENERATORA ---
function loadTasksJSON(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                tasksData = data; // Nadpisz dane
                AppSync.saveTasks(data); // Zapisz na stałe!
                renderTasksTable(); // Odśwież tabelę
                updatePageNumbers(); // Aktualizuj numery stron
                if (window.parent && window.parent.forceRefreshAll) { window.parent.forceRefreshAll(); } // Odśwież resztę aplikacji
                alert("Zakres prac wczytany pomyślnie!");
            } else {
                alert("Nieprawidłowy format pliku JSON.");
            }
        } catch (err) { alert("Błąd odczytu pliku JSON"); }
    };
    reader.readAsText(file);
    input.value = ''; // Reset inputu
}

// Obsługa obrazków
function handleFileSelect(evt, imgId) {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = e.target.result;
            img.style.display = 'block';
            saveImages(); // Zapisujemy stan po zmianie
            if (window.AppSync) {
                window.AppSync.triggerRefresh('offer');
            }
        }
        if (imgId === 'mainLogoCover') {
            document.querySelectorAll('.logo-header').forEach(el => el.src = e.target.result);
        }
    };
    reader.readAsDataURL(file);
}

// --- NOWA FUNKCJA DO ŁADOWANIA DANYCH Z KALKULATORA ---
function applyCalcData(calcData) {
    if (!calcData) return;

    if (calcData.selectedPrice) document.getElementById('iPrice').value = calcData.selectedPrice;
    if (calcData.clientName) document.getElementById('iClient').value = calcData.clientName;
    if (calcData.officeArea) document.getElementById('iArea').value = calcData.officeArea;

    // Zmiana formatu daty z kalendarza (YYYY-MM-DD) na polski (DD.MM.YYYY)
    if (calcData.calcDate) {
        const d = new Date(calcData.calcDate);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            document.getElementById('iDate').value = `${day}.${month}.${d.getFullYear()}`;
        } else {
            document.getElementById('iDate').value = calcData.calcDate;
        }
    }
    upd(); // Odśwież widok na dokumencie
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicjalizacja domyślna dla tabeli
    tasksData = defaultTasksInit;
    tasksDataDay = [];

    // 2. Próba wczytania danych z localStorage (jeśli istnieją i nie są puste)
    const loadedTasks = AppSync.loadTasks();
    if (loadedTasks && Array.isArray(loadedTasks) && loadedTasks.length > 0) {
        tasksData = loadedTasks;
    } else {
        tasksData = defaultTasksInit;
    }

    const savedTasksDay = localStorage.getItem('current_tasks_data_day');
    if (savedTasksDay) {
        try {
            const parsedDay = JSON.parse(savedTasksDay);
            if (Array.isArray(parsedDay)) {
                tasksDataDay = parsedDay;
            }
        } catch (e) {
            console.error("Błąd parsowania zadań dziennych:", e);
            tasksDataDay = [];
        }
    }

    // Wczytywanie stanu paska bocznego Oferty
    const savedSidebar = localStorage.getItem('oferta_sidebar_state');
    if (savedSidebar) {
        try {
            const state = JSON.parse(savedSidebar);
            const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
            setVal('iTitle', state.title);
            setVal('iClient', state.client);
            setVal('iAddr', state.addr);
            setVal('iDate', state.date);
            setVal('iLoc', state.loc);
            setVal('iArea', state.area);
            setVal('iPrice', state.price);
            setVal('iDayRbh', state.dayRbh);
            setVal('iDayFreq', state.dayFreq);
            setVal('iDayHours', state.dayHours);
            setVal('iEveRbh', state.eveRbh);
            setVal('iEveFreq', state.eveFreq);
            setVal('iEveTime', state.eveTime);
        } catch (e) {
            console.error("Błąd wczytywania stanu paska bocznego oferty:", e);
        }
    }

    const savedCalc = AppSync.loadCalculator() ? JSON.stringify(AppSync.loadCalculator()) : null;
    if (savedCalc) {
        applyCalcData(JSON.parse(savedCalc));
    }

    // --- NOWE: Przywracanie obrazów ---
    restoreImages();

    renderTasksTable();
    renderTasksTableDay();
    upd();
    updatePageNumbers();

    // 3. Nasłuchiwanie na zmiany "na żywo" z innych zakładek/iframe
    window.addEventListener('storage', (e) => {
        if (e.key === 'current_tasks_data') {
            try {
                const parsed = e.newValue ? JSON.parse(e.newValue) : null;
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                    tasksData = parsed;
                } else {
                    tasksData = defaultTasksInit;
                }
            } catch (err) {
                tasksData = defaultTasksInit;
            }
            renderTasksTable();
            updatePageNumbers();
        }
        if (e.key === 'current_tasks_data_day') {
            try {
                tasksDataDay = e.newValue ? JSON.parse(e.newValue) : [];
            } catch (err) {
                tasksDataDay = [];
            }
            renderTasksTableDay();
            updatePageNumbers();
        }
        if (e.key === 'kalkulator_v3_1') {
            try {
                if (e.newValue) {
                    applyCalcData(JSON.parse(e.newValue));
                }
            } catch (err) {
                console.error("Błąd synchronizacji kalkulatora:", err);
            }
        }
        if (e.key === 'oferta_images_state') {
            restoreImages();
        }
    });

    // Bindowanie uploadu obrazków
    const bindUpload = (inputId, imgId) => {
        const input = document.getElementById(inputId);
        if (input) input.addEventListener('change', (e) => {
            handleFileSelect(e, imgId);
        });
    };
    bindUpload('f_ref1', 'ref1'); bindUpload('f_ref2', 'ref2');
    bindUpload('f_ref3', 'ref3'); bindUpload('f_ref4', 'ref4');
    bindUpload('f_ref5', 'ref5'); bindUpload('f_ref6', 'ref6');
    bindUpload('fileMainLogo', 'mainLogoCover');
    bindUpload('fileRzfLogo', 'logoRzf');
    bindUpload('fileBg', 'bgCover');
});

// --- FUNKCJE DLA OBRAZÓW (PERSISTENCE) ---
function saveImages() {
    const state = {};
    const ids = ['ref1', 'ref2', 'ref3', 'ref4', 'ref5', 'ref6', 'mainLogoCover', 'logoRzf', 'bgCover'];
    ids.forEach(id => {
        const img = document.getElementById(id);
        if (img && img.src && !img.src.includes('http')) {
            state[id] = img.src;
        }
    });
    localStorage.setItem('oferta_images_state', JSON.stringify(state));
}

function restoreImages() {
    // DIAGNOSTYKA
    const diag = document.getElementById('diag-status');
    const logDiag = (msg) => { if (diag) diag.innerHTML += msg + '<br>'; console.log(msg); };
    if (diag) diag.innerHTML = '';

    logDiag("Inicjalizacja wczytywania...");
    const saved = localStorage.getItem('oferta_images_state');
    logDiag("🌐 Tryb przeglądarki (zasoby z pamięci lokalnej)");

    const ids = ['ref1', 'ref2', 'ref3', 'ref4', 'ref5', 'ref6', 'mainLogoCover', 'logoRzf', 'bgCover'];
    let state = {};
    if (saved) {
        try { state = JSON.parse(saved); logDiag("✅ Wczytano stan z pamięci"); } catch (e) { logDiag("❌ Błąd pamięci"); }
    }

    let stateChanged = false;

    ids.forEach(id => {
        const img = document.getElementById(id);
        if (!img) return;

        // 1. Priorytet: localStorage (ręcznie wybrane lub zbuforowane)
        if (state[id] && state[id] !== "" && state[id] !== "null") {
            img.src = state[id];
            img.style.display = 'block';
            if (id === 'mainLogoCover') document.querySelectorAll('.logo-header').forEach(el => el.src = state[id]);
        }
        // 2. Jeśli nie ma w pamięci, spróbuj użyć protokołu local-ss (odświeżenie src)
        else {
            const currentSrc = img.getAttribute('src');
            if (currentSrc && !currentSrc.startsWith('data:') && !currentSrc.startsWith('local-ss://')) {
                // Dodaj prefiks protokołu jeśli go nie ma
                const newSrc = 'local-ss://' + currentSrc;
                img.src = newSrc;
                img.style.display = 'block';
                logDiag(`🔄 ${id}: Ustawiono protokół local-ss`);
            }
        }
    });

    if (stateChanged) {
        localStorage.setItem('oferta_images_state', JSON.stringify(state));
    }
}

function resetImages() {
    if (confirm("UWAGA: Wszystkie własne zmiany zostaną usunięte. Czy na pewno chcesz zresetować grafiki?")) {
        localStorage.removeItem('oferta_images_state');
        localStorage.setItem('oferta_images_ver', '5');
        if (window.AppSync) {
            window.AppSync.triggerRefresh('offer');
        }
        location.reload();
    }
}

if (localStorage.getItem('oferta_images_ver') !== '5') {
    localStorage.removeItem('oferta_images_state');
    localStorage.setItem('oferta_images_ver', '5');
}

// Funkcja globalna - most dla Dashboardu (Musi być POZA DOMContentLoaded)
window.syncData = function () {
    console.log("Oferta: Synchronizacja wymuszona przez Dashboard");

    // 1. Pobierz zadania wieczorne/ogólne
    const loadedTasks = AppSync.loadTasks();
    if (loadedTasks && Array.isArray(loadedTasks) && loadedTasks.length > 0) {
        tasksData = loadedTasks;
    } else {
        tasksData = defaultTasksInit;
    }
    renderTasksTable();

    // 2. Pobierz zadania serwisu dziennego
    const savedTasksDay = localStorage.getItem('current_tasks_data_day');
    if (savedTasksDay) {
        try {
            const parsedDay = JSON.parse(savedTasksDay);
            if (Array.isArray(parsedDay)) {
                tasksDataDay = parsedDay;
            }
        } catch (e) {
            console.error("Błąd parsowania zadań dziennych przy synchronizacji:", e);
        }
    } else {
        tasksDataDay = [];
    }
    renderTasksTableDay();

    // 3. Pobierz dane z kalkulatora
    const savedCalc = AppSync.loadCalculator() ? JSON.stringify(AppSync.loadCalculator()) : null;
    if (savedCalc) {
        applyCalcData(JSON.parse(savedCalc));
    }

    updatePageNumbers();
};

function saveAsPDF() {
    if (window.electronAPI) {
        let clientName = document.getElementById('iClient').value;
        if (!clientName || clientName === '[NAZWA KLIENTA]') clientName = 'Oferta';

        const btn = document.querySelector('.btn-print');
        const oldText = btn.innerText;
        btn.innerText = "GENEROWANIE PDF...";
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        // Serializujemy gotowy widok z prawej strony
        const workspaceHTML = document.querySelector('.workspace').outerHTML;

        setTimeout(() => {
            window.electronAPI.savePDF(`${clientName}.pdf`, workspaceHTML);
        }, 100);

        window.electronAPI.onPDFSaved(() => {
            btn.innerText = oldText;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        });
    } else {
        window.print();
    }
}

if (window.electronAPI) { window.electronAPI.onLoadWorkspace((html) => { const ws = document.querySelector('.workspace'); if (ws) ws.outerHTML = html; }); }