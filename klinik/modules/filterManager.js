import { dataService } from './dataService.js';

export const filterManager = {
    filterCondition(data, perusahaan, departemen, tahun, bulan) {
        // Filter perusahaan
        if (perusahaan !== 'all' && data['Perusahaan'] !== perusahaan) return false;
        
        // Filter departemen
        if (departemen !== 'all' && data['Departemen'] !== departemen) return false;
        
        // Filter tahun dan bulan
        if (tahun !== 'all' || bulan !== 'all') {
            let dateToCheck;
            
            // Coba ambil dari TimeStamp (format dari ok.gs)
            if (data['TimeStamp'] || data['Timestamp']) {
                const timestamp = data['TimeStamp'] || data['Timestamp'];
                dateToCheck = new Date(timestamp);
            }
            // Coba ambil dari Tanggal
            else if (data['Tanggal']) {
                const dateParts = data['Tanggal'].split('-');
                if (dateParts.length >= 3) {
                    dateToCheck = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
                } else if (dateParts.length >= 2) {
                    // Format YYYY-MM
                    dateToCheck = new Date(`${dateParts[0]}-${dateParts[1]}-01`);
                } else {
                    // Try to parse as date string
                    dateToCheck = new Date(data['Tanggal']);
                }
            }
            
            // Jika ada tanggal yang valid
            if (dateToCheck && !isNaN(dateToCheck.getTime())) {
                if (tahun !== 'all') {
                    const dataYear = dateToCheck.getFullYear().toString();
                    if (dataYear !== tahun) return false;
                }
                if (bulan !== 'all') {
                    const dataMonth = (dateToCheck.getMonth() + 1).toString();
                    if (dataMonth !== bulan) return false;
                }
            } else {
                // Jika tidak ada tanggal yang valid dan filter tahun/bulan aktif
                if (tahun !== 'all' || bulan !== 'all') {
                    return false;
                }
            }
        }
        
        return true;
    },

    applyFilter(perusahaan, departemen, tahun, bulan) {
        console.log("Memulai filter dengan ok.gs data...");
        
        const filteredData = {
            Berobat: (dataService.rawData.Berobat || []).filter(d => 
                this.filterCondition(d, perusahaan, departemen, tahun, bulan)
            ),
            Kecelakaan: (dataService.rawData.Kecelakaan || []).filter(d => 
                this.filterCondition(d, perusahaan, departemen, tahun, bulan)
            ),
            Konsultasi: (dataService.rawData.Konsultasi || []).filter(d => 
                this.filterCondition(d, perusahaan, departemen, tahun, bulan)
            )
        };

        dataService.setFilteredData(filteredData);

        console.log("Filter diterapkan:", {
            Berobat: filteredData.Berobat.length,
            Kecelakaan: filteredData.Kecelakaan.length,
            Konsultasi: filteredData.Konsultasi.length,
            filters: { perusahaan, departemen, tahun, bulan },
            source: 'ok.gs'
        });

        return filteredData;
    }
};