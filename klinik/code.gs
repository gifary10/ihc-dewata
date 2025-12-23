const SPREADSHEET_ID = "1B0zAlBcbLSQfJ4ShAFJaq0PaoVaKfINnGAy5liXILB4";

function doGet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const result = {
    Berobat: getSheetData(ss, "Berobat", 1, 21),    // Kolom A-U (21 kolom)
    Kecelakaan: getSheetData(ss, "Kecelakaan", 1, 10),  // Kolom A-J (10 kolom)
    Konsultasi: getSheetData(ss, "Konsultasi", 1, 10)   // Kolom A-J (10 kolom)
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, sheetName, startColumn = 1, numColumns = null) {
  const sheet = ss.getSheetByName(sheetName);
  
  // Mendapatkan semua baris yang memiliki data
  const lastRow = sheet.getLastRow();
  
  // Jika hanya ada header (baris 1), return array kosong
  if (lastRow <= 1) return [];
  
  // Mendapatkan range yang dibatasi kolom
  let range;
  if (numColumns) {
    // Batasi jumlah kolom sesuai parameter
    range = sheet.getRange(1, startColumn, lastRow, numColumns);
  } else {
    // Ambil semua kolom jika tidak ditentukan
    range = sheet.getRange(1, startColumn, lastRow, sheet.getLastColumn());
  }
  
  const values = range.getValues();
  const headers = values.shift();

  return values.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      // Membersihkan nama header dari spasi di awal/akhir
      const cleanHeader = h ? h.toString().trim() : `Column_${i+1}`;
      obj[cleanHeader] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });
}