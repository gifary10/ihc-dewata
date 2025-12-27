export const utils = {
    showError(message) {
        console.error(message);
        alert(message);
    },

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
};