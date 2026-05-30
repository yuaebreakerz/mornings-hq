/**
 * MORNINGS HQ - BACKEND API (v3.7)
 * Pemilik: morningsbysfc@gmail.com
 * Update: Auto-create sheet for Recipes, Orders, & Dev Tasks Sync
 */
const SCRIPT_VERSION = "3.8";
const SPREADSHEET_ID = '17-iz1JJwi_huo2a0AIYalenc4Y54IexKwIWk3sizw1E'; // Id default spreadsheet, akan otomatis diabaikan jika di-deploy dari "Extensions > Apps Script" spreadsheet Anda sendiri.
const DRIVE_FOLDER_NAME = 'MorningsHQ_Uploads';

function getSpreadsheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {
    Logger.log("getActiveSpreadsheet() dialihkan karena dijalankan di luar Spreadsheet Container.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function manualTestExecution() {
  try {
    const ss = getSpreadsheet();
    Logger.log("✅ Spreadsheet OK: " + ss.getName());
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
    Logger.log("✅ Folder Drive OK: " + folder.getName());
  } catch (e) {
    throw new Error("Gagal: " + e.toString());
  }
}

function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

function deleteFileByUrl(url) {
  if (!url || typeof url !== 'string') return;
  
  let fileId = '';
  if (url.indexOf('lh3.googleusercontent.com/d/') !== -1) {
    fileId = url.split('lh3.googleusercontent.com/d/')[1].split(/[/?#]/)[0];
  } else if (url.indexOf('/file/d/') !== -1) {
    fileId = url.split('/file/d/')[1].split(/[/?#]/)[0];
  } else if (url.indexOf('id=') !== -1) {
    fileId = url.split('id=')[1].split(/[&#?]/)[0];
  }
  
  if (fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      Logger.log("Succesfully trashed old file from Drive: " + fileId);
    } catch (e) {
      Logger.log("Failed to delete old file ID " + fileId + ": " + e.toString());
    }
  }
}

function processImageFile(data, sheetName) {
  if (!data) return data;
  
  const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'MorningsApp_Assets');
  
  // Map sheet names to specific folder names
  const folderMap = {
    'products': 'Products',
    'promo_banners': 'Banners',
    'promo_highlights': 'Banners',
    'site_config': 'SiteAssets',
    'testimonials': 'Avatars',
    'recipes': 'Recipes'
  };
  
  const targetFolderName = folderMap[sheetName] || 'General';
  const targetFolder = getOrCreateFolder(rootFolder, targetFolderName);

  // Handle main image_file
  if (data.image_file && data.image_file.base64) {
    try {
      // Clean up old file when a new one is uploaded
      const oldUrl = data.image_url || data.image;
      if (oldUrl) {
        deleteFileByUrl(oldUrl);
      }

      const decoded = Utilities.base64Decode(data.image_file.base64);
      const blob = Utilities.newBlob(decoded, data.image_file.mimeType, data.image_file.filename);
      const file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      
      if (sheetName === 'site_config') {
        data.share_thumbnail = directUrl;
      } else {
        data.image_url = directUrl;
        data.image = directUrl; // legacy support
      }
      delete data.image_file;
    } catch (e) { Logger.log("Main Upload Error: " + e.toString()); }
  }

  // Handle gallery_files array
  if (data.gallery_files && Array.isArray(data.gallery_files)) {
    const urls = [];
    data.gallery_files.forEach(fileData => {
      if (fileData.base64) {
        try {
          const decoded = Utilities.base64Decode(fileData.base64);
          const blob = Utilities.newBlob(decoded, fileData.mimeType, fileData.filename);
          const file = targetFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          urls.push("https://lh3.googleusercontent.com/d/" + file.getId());
        } catch (e) { Logger.log("Gallery Upload Error: " + e.toString()); }
      }
    });

    if (urls.length > 0) {
      // Menggabungkan URL yang baru di-upload dengan URL yang sudah ada (jika ada)
      const existing = (data.gallery_images && typeof data.gallery_images === 'string') 
        ? data.gallery_images.split(',').map(u => u.trim()).filter(u => u) 
        : [];
      data.gallery_images = [...existing, ...urls].join(', ');
    }
    delete data.gallery_files;
  }
  
  return data;
}

function doGet(e) {
  if (!e || !e.parameter) return createResponse({ status: "connected", version: SCRIPT_VERSION });
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(e.parameter.path);
    if (!sheet) {
      // If reading recipes and not found, return empty array instead of error
      if (e.parameter.path === 'recipes') return createResponse([]);
      return createResponse({ error: "Sheet not found: " + e.parameter.path });
    }
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return createResponse([]);
    const headers = values[0];
    const data = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch (ex) {}
        }
        obj[h] = val;
      });
      return obj;
    });
    return createResponse(data);
  } catch (err) {
    return createResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    // Handle direct file uploads to Google Drive
    if (action === 'upload_file') {
      const fileData = payload.file;
      const folderName = payload.folder || 'General';
      const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'MorningsApp_Assets');
      const targetFolder = getOrCreateFolder(rootFolder, folderName);
      
      const decoded = Utilities.base64Decode(fileData.base64);
      const blob = Utilities.newBlob(decoded, fileData.mimeType, fileData.filename);
      const file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      return createResponse({ success: true, url: directUrl, filename: fileData.filename });
    }

    const sheetName = payload.sheet;
    let data = processImageFile(payload.data || {}, sheetName);
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      if (action === 'add-row' || action === 'insert' || action === 'sync_sheet') {
        const defaultHeaders = {
          'site_config': ['id', 'admin_password', 'whatsapp_number', 'instagram_handle', 'tiktok_handle', 'address', 'email_contact', 'opening_hours', 'running_text', 'announcement', 'site_title', 'meta_description', 'meta_keywords', 'share_thumbnail', 'updated_at'],
          'recipes': ['id', 'title', 'category', 'description', 'ingredients', 'instructions', 'created_at', 'updated_at'],
          'orders': ['id', 'customer_name', 'whatsapp_number', 'status', 'items', 'total_amount', 'delivery_address', 'created_at', 'updated_at'],
          'dev_tasks': ['id', 'title', 'description', 'status', 'priority', 'deadline', 'category', 'isPinned', 'referenceLink', 'referenceImage', 'referenceFile', 'fileName', 'created_at'],
          'social_planner': ['id', 'title', 'platform', 'type', 'uploadDate', 'status', 'ideaDescription', 'caption', 'cta', 'shootChecklist', 'assets', 'created_at']
        };
        const headers = defaultHeaders[sheetName] || ['id', 'name', 'created_at', 'updated_at'];
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
      } else {
        return createResponse({ error: "Sheet tidak ditemukan: " + sheetName });
      }
    }

    if (action === 'add-row' || action === 'insert') {
      const headers = sheet.getDataRange().getValues()[0];
      const newRow = headers.map(h => {
        if (!h) return "";
        if (h === 'id' && !data.id) return Utilities.getUuid();
        if (h === 'created_at') return new Date().toISOString();
        if (h === 'updated_at') return new Date().toISOString();
        let val = data[h];
        return (val === undefined) ? "" : (typeof val === 'object' ? JSON.stringify(val) : val);
      });
      sheet.appendRow(newRow);
      return createResponse({ success: true, data: data });
    }

    if (action === 'update_single') {
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const rowIndex = 2; // Always update first row after headers
      
      // If sheet is empty (only headers), append a row first
      if (values.length <= 1) {
        const newRow = headers.map(h => {
          if (h === 'id') return data.id || 'config_001';
          if (h === 'created_at') return new Date().toISOString();
          if (h === 'updated_at') return new Date().toISOString();
          let val = data[h];
          return (val === undefined) ? "" : (typeof val === 'object' ? JSON.stringify(val) : val);
        });
        sheet.appendRow(newRow);
      } else {
        headers.forEach((h, j) => {
          if (data[h] !== undefined) {
            let val = data[h];
            if (h === 'updated_at') val = new Date().toISOString();
            sheet.getRange(rowIndex, j + 1).setValue(typeof val === 'object' ? JSON.stringify(val) : val);
          }
        });
      }
      return createResponse({ success: true, data: data });
    }

    if (action === 'sync_sheet') {
      const dataList = payload.data || [];
      const defaultHeaders = {
        'dev_tasks': ['id', 'title', 'description', 'status', 'priority', 'deadline', 'category', 'isPinned', 'referenceLink', 'referenceImage', 'referenceFile', 'fileName', 'created_at'],
        'social_planner': ['id', 'title', 'platform', 'type', 'uploadDate', 'status', 'ideaDescription', 'caption', 'cta', 'shootChecklist', 'assets', 'created_at']
      };
      const headers = defaultHeaders[sheetName] || ['id', 'name', 'created_at', 'updated_at'];
      
      // Clear sheet and rewrite with headers and sync data
      sheet.clearContents();
      sheet.appendRow(headers);
      
      if (Array.isArray(dataList) && dataList.length > 0) {
        dataList.forEach(item => {
          const row = headers.map(h => {
            let val = item[h];
            if (h === 'isPinned') {
              return val ? "TRUE" : "FALSE";
            }
            return (val === undefined) ? "" : (typeof val === 'object' ? JSON.stringify(val) : val);
          });
          sheet.appendRow(row);
        });
      }
      return createResponse({ success: true, count: dataList.length });
    }

    if (action === 'update-row' || action === 'update') {
      const id = payload.id;
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] == id) {
          headers.forEach((h, j) => {
            if (data[h] !== undefined) {
              let val = data[h];
              if (h === 'updated_at') val = new Date().toISOString();
              sheet.getRange(i + 1, j + 1).setValue(typeof val === 'object' ? JSON.stringify(val) : val);
            }
          });
          return createResponse({ success: true });
        }
      }
      return createResponse({ error: "ID not found" });
    }

    if (action === 'delete-row' || action === 'delete') {
      const id = payload.id;
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] == id) {
          // Attempt to delete associated files from Drive
          try {
            headers.forEach((h, j) => {
              if (h === 'image_url' || h === 'image' || h === 'gallery_images') {
                const urlVal = values[i][j];
                if (urlVal) {
                  if (h === 'gallery_images' && typeof urlVal === 'string') {
                    urlVal.split(',').forEach(u => deleteFileByUrl(u.trim()));
                  } else {
                    deleteFileByUrl(urlVal);
                  }
                }
              }
            });
          } catch (fileErr) {
            Logger.log("Failed to clean up files on delete: " + fileErr.toString());
          }
          
          sheet.deleteRow(i + 1);
          return createResponse({ success: true });
        }
      }
      return createResponse({ error: "ID not found" });
    }
    
    return createResponse({ error: "Action '" + action + "' not supported" });
  } catch (err) {
    return createResponse({ error: err.toString() });
  }
}

function createResponse(data) {
  if (typeof data === 'object' && !Array.isArray(data)) data.v = SCRIPT_VERSION;
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
