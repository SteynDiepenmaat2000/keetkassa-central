const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const KeetKassaDatabase = require('./database');

let mainWindow;
let database;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    fullscreen: false,
  });

  // In development, load from Vite dev server
  // In production, load from built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize database
  database = new KeetKassaDatabase();
  
  // Set up IPC handlers
  setupIPCHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (database) {
    database.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIPCHandlers() {
  // Members
  ipcMain.handle('db:getMembers', (event, activeOnly) => {
    return database.getMembers(activeOnly);
  });

  ipcMain.handle('db:getMember', (event, id) => {
    return database.getMember(id);
  });

  ipcMain.handle('db:createMember', (event, data) => {
    return database.createMember(data);
  });

  ipcMain.handle('db:updateMember', (event, id, data) => {
    return database.updateMember(id, data);
  });

  ipcMain.handle('db:deleteMember', (event, id) => {
    return database.deleteMember(id);
  });

  // Drinks
  ipcMain.handle('db:getDrinks', () => {
    return database.getDrinks();
  });

  ipcMain.handle('db:getDrink', (event, id) => {
    return database.getDrink(id);
  });

  ipcMain.handle('db:createDrink', (event, data) => {
    return database.createDrink(data);
  });

  ipcMain.handle('db:updateDrink', (event, id, data) => {
    return database.updateDrink(id, data);
  });

  ipcMain.handle('db:deleteDrink', (event, id) => {
    return database.deleteDrink(id);
  });

  // Transactions
  ipcMain.handle('db:getTransactions', (event, limit) => {
    return database.getTransactions(limit);
  });

  ipcMain.handle('db:createTransaction', (event, data) => {
    return database.createTransaction(data);
  });

  // Expenses
  ipcMain.handle('db:getExpenses', () => {
    return database.getExpenses();
  });

  ipcMain.handle('db:createExpense', (event, data) => {
    return database.createExpense(data);
  });

  ipcMain.handle('db:updateExpense', (event, id, data) => {
    return database.updateExpense(id, data);
  });

  ipcMain.handle('db:deleteExpense', (event, id) => {
    return database.deleteExpense(id);
  });

  // Purchases
  ipcMain.handle('db:getPurchases', () => {
    return database.getPurchases();
  });

  ipcMain.handle('db:createPurchase', (event, data) => {
    return database.createPurchase(data);
  });

  ipcMain.handle('db:updatePurchase', (event, id, data) => {
    return database.updatePurchase(id, data);
  });

  ipcMain.handle('db:deletePurchase', (event, id) => {
    return database.deletePurchase(id);
  });

  // Credit Transactions
  ipcMain.handle('db:getCreditTransactions', (event, memberId) => {
    return database.getCreditTransactions(memberId);
  });

  ipcMain.handle('db:createCreditTransaction', (event, data) => {
    return database.createCreditTransaction(data);
  });

  // Settings
  ipcMain.handle('db:getSetting', (event, key) => {
    return database.getSetting(key);
  });

  ipcMain.handle('db:setSetting', (event, key, value) => {
    return database.setSetting(key, value);
  });

  // Statistics
  ipcMain.handle('db:getStatistics', (event, startDate, endDate) => {
    return database.getStatistics(startDate, endDate);
  });
}
