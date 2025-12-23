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
            
            // Coba ambil dari TimeStamp
            if (data['TimeStamp']) {
                dateToCheck = new Date(data['TimeStamp']);
            }
            // Coba ambil dari Tanggal
            else if (data['Tanggal']) {
                const dateParts = data['Tanggal'].split('-');
                if (dateParts.length >= 3) {
                    dateToCheck = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
                }
            }
            
            // Jika ada tanggal yang valid
            if (dateToCheck && !isNaN(dateToCheck.getTime())) {
                if (tahun !== 'all' && dateToCheck.getFullYear().toString() !== tahun) return false;
                if (bulan !== 'all' && (dateToCheck.getMonth() + 1).toString() !== bulan) return false;
            }
        }
        
        return true;
    },

    applyFilter(perusahaan, departemen, tahun, bulan) {
        console.log("Memulai filter...");
        
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
            filters: { perusahaan, departemen, tahun, bulan }
        });

        return filteredData;
    }
};