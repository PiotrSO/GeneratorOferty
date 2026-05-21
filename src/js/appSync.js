// src/js/appSync.js
const AppSync = {
    triggerRefresh: function() {
        if (window.parent && window.parent.forceRefreshAll) {
            window.parent.forceRefreshAll();
        }
    },
    
    saveTasks: function(tasksArray) {
        localStorage.setItem('current_tasks_data', JSON.stringify(tasksArray));
        this.triggerRefresh();
    },
    
    loadTasks: function() {
        const data = localStorage.getItem('current_tasks_data');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Błąd parsowania danych zadań", e);
            }
        }
        return null;
    },

    saveCalculator: function(calcData) {
        localStorage.setItem('kalkulator_v3_1', JSON.stringify(calcData));
        this.triggerRefresh();
    },

    loadCalculator: function() {
        const data = localStorage.getItem('kalkulator_v3_1');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Błąd parsowania danych kalkulatora", e);
            }
        }
        return null;
    }
};

window.AppSync = AppSync;
