const rowDefinitions = [
        { id: 1, name: "Czas sprzątania 1x [h]", type: 'input' },
        { id: 2, name: "Ilość dni w tygodniu", type: 'input' },
        { id: 3, name: "Czas miesięczny [h]", type: 'calc' },
        { id: 4, name: "Stawka Prac. [PLN]", type: 'input' },
        { id: 5, name: "Stawka KP. [PLN]", type: 'auto' },
        { id: 6, name: "Koszty Prac. [PLN]", type: 'calc' },
        { id: 7, name: "Koszty KP. [PLN]", type: 'calc' },
        { id: 8, name: "Chemia [PLN]", type: 'calc' },
        { id: 9, name: "Amortyzacja [PLN]", type: 'calc' },
        { id: 10, name: "Suma Kosztów [PLN]", type: 'calc' },
        { id: 11, name: "Marża [%]", type: 'input' },
        { id: 12, name: "Marża [PLN]", type: 'calc' },
        { id: 13, name: "Cena Klient [PLN]", type: 'calc' }
    ];

    function getAdminConfig() {
        const saved = localStorage.getItem('admin_system_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.times && parsed.salaryMap) return parsed;
            } catch (e) {}
        }
        return {
            times: {
                officeArea100: 10,
                workstation: 2,
                kitchen: 12,
                confRoom: 10,
                bathroom: 10,
                shower: 10,
                dishwasher: 10,
                hardFloors100: 20,
                flatOverhead: 10,
                fridge: 20,
                floorOverhead: 10
            },
            salaryMap: {
                "22.50": "37.50",
                "23.81": "39.71",
                "25.00": "41.69",
                "30.00": "50.03",
                "35.00": "58.38",
                "40.00": "66.72"
            },
            kpMultiplier: 1.6676
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        const dateInput = document.getElementById('calcDate');
        if (!dateInput.value) dateInput.valueAsDate = new Date();
        renderTable();
        loadData();
        document.getElementById('variantsTable').addEventListener('input', () => {
            recalcVariants();
            saveData();
        });
    });

    function renderTable() {
        const tbody = document.querySelector('#variantsTable tbody');
        tbody.innerHTML = '';
        rowDefinitions.forEach((row) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-row', row.id);
            tr.innerHTML = `<td>${row.id}.</td><td style="text-align:left">${row.name}</td>`;
            for (let i = 0; i < 4; i++) {
                tr.innerHTML += `<td class="variant-col"><input type="number" step="0.01" data-variant="${i}" data-row-id="${row.id}"
                ${row.type==='calc'?'readonly':''}></td>`; 
            }
            tbody.appendChild(tr);
        });
    }

    function calculateTime() {
        const config = getAdminConfig();
        const t = config.times;
        const getV = (id) => parseFloat(document.getElementById(id).value) || 0;
        const daysInputVal = parseFloat(document.querySelector('input[data-row-id="2"][data-variant="0"]').value);
        const days = (!isNaN(daysInputVal) && daysInputVal > 0) ? daysInputVal : 1;
        
        let mins = 0;
        let vBase = (getV('officeArea')/100)*t.officeArea100, vF = getV('vacFreq');
        if(vF > 0 && vF < days) vBase -= ((days - vF) * vBase) / days;
        
        let wBase = getV('workstations')*t.workstation, wF = getV('workFreq');
        if(wF > 0 && wF < days) wBase -= ((days - wF) * wBase) / days;
        
        mins = vBase + wBase + getV('kitchens')*t.kitchen + getV('confRooms')*t.confRoom + getV('bathrooms')*t.bathroom + getV('showers')*t.shower + getV('dishwashers')*t.dishwasher + (getV('hardFloors')/100)*t.hardFloors100 + t.flatOverhead;
        
        let fM = getV('fridges')*t.fridge; 
        if(days > 1) fM /= days;
        mins += fM;
        
        if(getV('floors') > 1) mins += (getV('floors')-1)*t.floorOverhead;
        
        const hrs = Math.round((mins/60)*100)/100;
 
        document.getElementById('cleaningTimeResult').style.display = 'block';
        document.getElementById('cleaningTimeResult').innerText = `Wyliczony czas: ${hrs} h (Wstawiono do Wariantu 0)`;
        document.querySelector('input[data-row-id="1"][data-variant="0"]').value = hrs;
        recalcVariants();
        saveData();
    }

    function recalcVariants() {
        const config = getAdminConfig();
        const salaryMap = config.salaryMap;
        const kpMultiplier = config.kpMultiplier || 1.6676;

        for (let i = 0; i < 4; i++) {
            const g = (rid) => document.querySelector(`input[data-variant="${i}"][data-row-id="${rid}"]`);
            const val = (rid) => { const el = g(rid); return el && el.value ? parseFloat(el.value) : 0; };
            const set = (rid, v) => { const el = g(rid); if(el) el.value = v.toFixed(2); };
            const isEmpty = (rid) => { const el = g(rid); return !el || el.value.trim() === ""; };

            let st = val(1); 
            let d = val(2);  
            let mt = (st * d * 4.2);
            set(3, mt);
            
            let r4 = g(4) ? g(4).value : "0";
            let r4Val = parseFloat(r4);
            const r4Key = r4Val.toFixed(2);
            
            if(r4 && salaryMap[r4Key] !== undefined) {
                g(5).value = parseFloat(salaryMap[r4Key]).toFixed(2);
            } else if (r4Val > 0) {
                g(5).value = (r4Val * kpMultiplier).toFixed(2);
            }
            
            let n = val(4), kp = val(5);
            set(6, mt*n); set(7, mt*kp); set(8, mt*0.5); set(9, mt*0.7);
            let tc = val(7)+val(8)+val(9);
            set(10, tc);
            let mv = tc * (val(11)/100);
            set(12, mv);
            
            const finalPrice = tc + mv;
            const cell13Input = g(13);
            if (cell13Input) {
                const cell13 = cell13Input.parentElement;
                if ([1, 2, 4, 11].some(rid => isEmpty(rid))) {
                   cell13Input.style.display = 'none';
                   if (!cell13.querySelector('.error-text')) {
                      const span = document.createElement('span');
                      span.className = 'error-text'; span.innerText = 'DANE?';
                      cell13.appendChild(span);
                   }
                 } else {
                     const span = cell13.querySelector('.error-text');
                     if (span) span.remove();
                     cell13Input.style.display = 'inline-block';
                     set(13, finalPrice);
                 }
             }
         }
    }

    function downloadAsImage() {
        const container = document.getElementById('app-container');
        const actions = document.querySelector('.actions');
        actions.style.visibility = 'hidden';

        html2canvas(container, {
            scale: 2, 
            backgroundColor: "#f8fafc",
        }).then(canvas => {
            const link = document.createElement('a');
            const name = document.getElementById('clientName').value || 'Wycena';
            link.download = `${name}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.9);
            link.click();
            actions.style.visibility = 'visible';
        });
    }

    function saveData(showAlert = false) {
        const data = {};
        document.querySelectorAll('input').forEach(el => {
            const key = el.id || `v${el.dataset.variant}_r${el.dataset.rowId}`;
            data[key] = el.value;
        });
        data['selectedPrice'] = document.getElementById('selectedPrice').value;
        
        AppSync.saveCalculator(data, 'calculator');
        if (showAlert) alert('Zapisano pomyślnie.');
    }

    function loadData() {
        try {
            const data = AppSync.loadCalculator();
            if (!data) return;
            for (const [key, val] of Object.entries(data)) {
                if (key === 'selectedPrice') {
                    document.getElementById('selectedPrice').value = val;
                    continue;
                }
                const el = document.getElementById(key) || 
                           document.querySelector(`input[data-variant="${key.split('_r')[0].substring(1)}"][data-row-id="${key.split('_r')[1]}"]`);
                if (el) el.value = val;
            }
            recalcVariants();
        } catch (e) { console.error(e); }
    }