const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Members
  getMembers: (activeOnly) => ipcRenderer.invoke('db:getMembers', activeOnly),
  getMember: (id) => ipcRenderer.invoke('db:getMember', id),
  createMember: (data) => ipcRenderer.invoke('db:createMember', data),
  updateMember: (id, data) => ipcRenderer.invoke('db:updateMember', id, data),
  deleteMember: (id) => ipcRenderer.invoke('db:deleteMember', id),

  // Drinks
  getDrinks: () => ipcRenderer.invoke('db:getDrinks'),
  getDrink: (id) => ipcRenderer.invoke('db:getDrink', id),
  createDrink: (data) => ipcRenderer.invoke('db:createDrink', data),
  updateDrink: (id, data) => ipcRenderer.invoke('db:updateDrink', id, data),
  deleteDrink: (id) => ipcRenderer.invoke('db:deleteDrink', id),

  // Transactions
  getTransactions: (limit) => ipcRenderer.invoke('db:getTransactions', limit),
  createTransaction: (data) => ipcRenderer.invoke('db:createTransaction', data),

  // Expenses
  getExpenses: () => ipcRenderer.invoke('db:getExpenses'),
  createExpense: (data) => ipcRenderer.invoke('db:createExpense', data),
  updateExpense: (id, data) => ipcRenderer.invoke('db:updateExpense', id, data),
  deleteExpense: (id) => ipcRenderer.invoke('db:deleteExpense', id),

  // Purchases
  getPurchases: () => ipcRenderer.invoke('db:getPurchases'),
  createPurchase: (data) => ipcRenderer.invoke('db:createPurchase', data),
  updatePurchase: (id, data) => ipcRenderer.invoke('db:updatePurchase', id, data),
  deletePurchase: (id) => ipcRenderer.invoke('db:deletePurchase', id),

  // Credit Transactions
  getCreditTransactions: (memberId) => ipcRenderer.invoke('db:getCreditTransactions', memberId),
  createCreditTransaction: (data) => ipcRenderer.invoke('db:createCreditTransaction', data),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),

  // Statistics
  getStatistics: (startDate, endDate) => ipcRenderer.invoke('db:getStatistics', startDate, endDate),
});
