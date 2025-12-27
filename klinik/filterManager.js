import { dataService } from './dataService.js';

export const filterManager = {
    filterCondition(data, perusahaan, departemen, tahun, bulan) {
        // Filter perusahaan
        if (perusahaan !== 'all') {
            const dataPerusahaan = (data['Perusahaan'] || '').toString().trim();
            if (dataPerusahaan !== perusahaan) return false;
        }
        
        // Filter departemen
        if (departemen !== 'all') {
            const dataDepartemen = (data['Departemen'] || '').toString().trim();
            if (dataDepartemen !== departemen) return false;
        }
        
        // Filter tahun dan bulan
        if (tahun !== 'all' || bulan !== 'all') {
            let dateToCheck;
            
            // Coba ambil dari TimeStamp
            if (data['TimeStamp']) {
                const timestamp = data['TimeStamp'].toString().trim();
                if (timestamp) {
                    dateToCheck = new Date(timestamp);
                    if (isNaN(dateToCheck.getTime())) {
                        dateToCheck = null;
                    }
                }
            }
            
            // Coba ambil dari Tanggal jika TimeStamp tidak valid
            if (!dateToCheck && data['Tanggal']) {
                const tanggal = data['Tanggal'].toString().trim();
                if (tanggal) {
                    // Format: YYYY-MM-DD atau DD-MM-YYYY
                    const dateParts = tanggal.split(/[-/]/);
                    if (dateParts.length >= 3) {
                        // Coba format YYYY-MM-DD
                        if (dateParts[0].length === 4) {
                            dateToCheck = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
                        } 
                        // Coba format DD-MM-YYYY
                        else if (dateParts[2].length === 4) {
                            dateToCheck = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                        }
                        
                        if (dateToCheck && isNaN(dateToCheck.getTime())) {
                            dateToCheck = null;
                        }
                    }
                }
            }
            
            // Jika ada tanggal yang valid, terapkan filter
            if (dateToCheck && !isNaN(dateToCheck.getTime())) {
                if (tahun !== 'all') {
                    const dataTahun = dateToCheck.getFullYear().toString();
                    if (dataTahun !== tahun) return false;
                }
                
                if (bulan !== 'all') {
                    const dataBulan = (dateToCheck.getMonth() + 1).toString();
                    if (dataBulan !== bulan) return false;
                }
            } else {
                // Jika tidak ada tanggal yang valid dan filter tanggal aktif, kecualikan data
                if (tahun !== 'all' || bulan !== 'all') {
                    return false;
                }
            }
        }
        
        return true;
    },

    applyFilter(perusahaan, departemen, tahun, bulan) {
        console.log("Memulai filter dengan parameter:", { perusahaan, departemen, tahun, bulan });
        
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
            Total: filteredData.Berobat.length + filteredData.Kecelakaan.length + filteredData.Konsultasi.length
        });

        return filteredData;
    }
};