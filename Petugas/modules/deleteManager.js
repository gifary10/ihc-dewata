// File: modules/deleteManager.js
import { GoogleSheetsAPI } from './googleSheets.js';
import { UI } from './uiManager.js';
import { Laporan } from './laporanManager.js';

export const DeleteManager = {
    // Konfirmasi dan hapus data (MODAL DISEDERHANAKAN)
    confirmDelete: async function(rowId, sheetType, rowData) {
        // Tampilkan konfirmasi sederhana
        const userConfirmed = confirm(
            `Hapus data ini?\n\n` +
            `Nama: ${rowData.nama || '-'}\n` +
            `Tanggal: ${rowData.tanggal || '-'}\n` +
            `Departemen: ${rowData.departemen || '-'}\n` +
            `Jenis: ${rowData.jenisKunjungan || sheetType}\n\n` +
            `Tindakan ini tidak dapat dibatalkan!`
        );
        
        if (userConfirmed) {
            await DeleteManager.deleteData(rowId, sheetType);
        }
    },

    // Fungsi untuk menghapus data dari Google Sheets
    deleteData: async function(rowId, sheetType) {
        try {
            UI.showLoading('Menghapus data...');
            
            // Kirim permintaan hapus ke Google Sheets
            const result = await DeleteManager.sendDeleteRequest(sheetType, rowId);
            
            if (result.success) {
                UI.showNotification('Data berhasil dihapus!', 'success');
                
                // Refresh laporan setelah delay
                setTimeout(() => {
                    Laporan.tampilkan();
                }, 500);
                
            } else {
                throw new Error(result.message || 'Gagal menghapus data');
            }
            
        } catch (error) {
            console.error('Error deleting data:', error);
            UI.showNotification(`Gagal menghapus data: ${error.message}`, 'danger');
        }
    },

    // Kirim permintaan hapus
    sendDeleteRequest: async function(sheetType, rowId) {
        try {
            const url = GoogleSheetsAPI.WEB_APP_URL;
            
            // Persiapkan parameter
            const params = new URLSearchParams({
                action: 'delete',
                sheet: DeleteManager.getSheetName(sheetType),
                row: rowId,
                timestamp: Date.now()
            });
            
            console.log('Delete params:', params.toString());
            
            const fullUrl = `${url}?${params.toString()}`;
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Delete response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Delete response data:', result);
            
            return result;
            
        } catch (error) {
            console.error('Delete request error:', error);
            
            // Coba metode alternatif menggunakan POST
            console.log('Mencoba metode POST sebagai fallback...');
            return await DeleteManager.sendDeleteRequestViaPost(sheetType, rowId);
        }
    },
    
    // Metode alternatif dengan POST
    sendDeleteRequestViaPost: async function(sheetType, rowId) {
        try {
            const url = GoogleSheetsAPI.WEB_APP_URL;
            
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('sheet', DeleteManager.getSheetName(sheetType));
            formData.append('row', rowId);
            
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('POST delete request error:', error);
            return {
                success: false,
                message: error.message || 'Gagal menghapus data'
            };
        }
    },

    // Get sheet name
    getSheetName: function(sheetType) {
        const sheetNames = {
            'berobat': 'Berobat',
            'kecelakaan': 'Kecelakaan',
            'konsultasi': 'Konsultasi'
        };
        return sheetNames[sheetType] || sheetType;
    },

    // Setup tombol hapus di tabel
    setupDeleteButtons: function() {
        // Event delegation untuk tombol hapus
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-data')) {
                e.preventDefault();
                const button = e.target.closest('.btn-delete-data');
                const rowId = button.getAttribute('data-row-id');
                const sheetType = button.getAttribute('data-sheet-type');
                const rowData = JSON.parse(button.getAttribute('data-row-data') || '{}');
                
                // Validasi rowId
                if (!rowId || rowId === 'undefined') {
                    UI.showNotification('Error: Row ID tidak valid', 'danger');
                    console.error('Invalid rowId:', rowId);
                    return;
                }
                
                DeleteManager.confirmDelete(rowId, sheetType, rowData);
            }
        });
    }
};