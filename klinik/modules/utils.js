export const utils = {
    showError(message) {
        console.error(message);
        alert(message);
    },

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    },

    getMonthName(monthNumber) {
        const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return bulanNames[monthNumber - 1] || '';
    },

    // Helper untuk delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};