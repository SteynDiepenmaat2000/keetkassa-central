const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class KeetKassaDatabase {
  constructor() {
    // Store database in user data directory
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'keetkassa.db');
    
    console.log('Database path:', dbPath);
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.initializeTables();
  }

  initializeTables() {
    // Create all tables matching the Supabase schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        credit REAL NOT NULL DEFAULT 0.00,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS drinks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        volume_ml INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        drink_id TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (drink_id) REFERENCES drinks(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT,
        settled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id)
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        price_per_unit REAL NOT NULL,
        units_per_package INTEGER DEFAULT 1,
        bottle_size REAL,
        deposit_per_unit REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        member_id TEXT,
        payment_method TEXT,
        settled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id)
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_drink ON transactions(drink_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_expenses_member ON expenses(member_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_member ON purchases(member_id);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_member ON credit_transactions(member_id);
    `);
  }

  // Generate UUID v4
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Members
  getMembers(activeOnly = false) {
    const query = activeOnly 
      ? 'SELECT * FROM members WHERE active = 1 ORDER BY name'
      : 'SELECT * FROM members ORDER BY name';
    return this.db.prepare(query).all();
  }

  getMember(id) {
    return this.db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  }

  createMember(data) {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO members (id, name, credit, active, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, data.name, data.credit || 0, data.active !== undefined ? data.active : 1);
    return this.getMember(id);
  }

  updateMember(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.credit !== undefined) {
      fields.push('credit = ?');
      values.push(data.credit);
    }
    if (data.active !== undefined) {
      fields.push('active = ?');
      values.push(data.active);
    }
    
    if (fields.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
    
    return this.getMember(id);
  }

  deleteMember(id) {
    this.db.prepare('DELETE FROM members WHERE id = ?').run(id);
  }

  // Drinks
  getDrinks() {
    return this.db.prepare('SELECT * FROM drinks ORDER BY name').all();
  }

  getDrink(id) {
    return this.db.prepare('SELECT * FROM drinks WHERE id = ?').get(id);
  }

  createDrink(data) {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO drinks (id, name, price, volume_ml, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, data.name, data.price, data.volume_ml || null);
    return this.getDrink(id);
  }

  updateDrink(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.volume_ml !== undefined) {
      fields.push('volume_ml = ?');
      values.push(data.volume_ml);
    }
    
    if (fields.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE drinks SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
    
    return this.getDrink(id);
  }

  deleteDrink(id) {
    this.db.prepare('DELETE FROM drinks WHERE id = ?').run(id);
  }

  // Transactions
  getTransactions(limit = 100) {
    return this.db.prepare(`
      SELECT t.*, m.name as member_name, d.name as drink_name
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN drinks d ON t.drink_id = d.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  createTransaction(data) {
    const id = this.generateId();
    
    // Start transaction
    const transaction = this.db.transaction(() => {
      // Insert transaction
      const stmt = this.db.prepare(`
        INSERT INTO transactions (id, member_id, drink_id, price, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(id, data.member_id, data.drink_id, data.price);
      
      // Update member credit
      const updateStmt = this.db.prepare('UPDATE members SET credit = credit - ? WHERE id = ?');
      updateStmt.run(data.price, data.member_id);
    });
    
    transaction();
    
    return this.db.prepare(`
      SELECT t.*, m.name as member_name, d.name as drink_name
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN drinks d ON t.drink_id = d.id
      WHERE t.id = ?
    `).get(id);
  }

  // Expenses
  getExpenses() {
    return this.db.prepare(`
      SELECT e.*, m.name as member_name
      FROM expenses e
      LEFT JOIN members m ON e.member_id = m.id
      ORDER BY e.created_at DESC
    `).all();
  }

  createExpense(data) {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO expenses (id, member_id, amount, description, payment_method, settled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      id,
      data.member_id,
      data.amount,
      data.description,
      data.payment_method || null,
      data.settled || 0
    );
    return this.db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  }

  updateExpense(id, data) {
    const fields = [];
    const values = [];
    
    if (data.settled !== undefined) {
      fields.push('settled = ?');
      values.push(data.settled);
    }
    
    if (fields.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  deleteExpense(id) {
    this.db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  }

  // Purchases
  getPurchases() {
    return this.db.prepare(`
      SELECT p.*, m.name as member_name
      FROM purchases p
      LEFT JOIN members m ON p.member_id = m.id
      ORDER BY p.created_at DESC
    `).all();
  }

  createPurchase(data) {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO purchases (
        id, category, description, quantity, price_per_unit, 
        units_per_package, bottle_size, deposit_per_unit, total_amount,
        member_id, payment_method, settled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      id,
      data.category,
      data.description || null,
      data.quantity,
      data.price_per_unit,
      data.units_per_package || 1,
      data.bottle_size || null,
      data.deposit_per_unit || 0,
      data.total_amount,
      data.member_id || null,
      data.payment_method || null,
      data.settled || 0
    );
    return this.db.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
  }

  updatePurchase(id, data) {
    const fields = [];
    const values = [];
    
    if (data.settled !== undefined) {
      fields.push('settled = ?');
      values.push(data.settled);
    }
    
    if (fields.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE purchases SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  deletePurchase(id) {
    this.db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
  }

  // Credit Transactions
  getCreditTransactions(memberId = null) {
    if (memberId) {
      return this.db.prepare(`
        SELECT ct.*, m.name as member_name
        FROM credit_transactions ct
        JOIN members m ON ct.member_id = m.id
        WHERE ct.member_id = ?
        ORDER BY ct.created_at DESC
      `).all(memberId);
    }
    return this.db.prepare(`
      SELECT ct.*, m.name as member_name
      FROM credit_transactions ct
      JOIN members m ON ct.member_id = m.id
      ORDER BY ct.created_at DESC
    `).all();
  }

  createCreditTransaction(data) {
    const id = this.generateId();
    
    // Start transaction
    const transaction = this.db.transaction(() => {
      // Insert credit transaction
      const stmt = this.db.prepare(`
        INSERT INTO credit_transactions (id, member_id, amount, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);
      stmt.run(id, data.member_id, data.amount);
      
      // Update member credit
      const updateStmt = this.db.prepare('UPDATE members SET credit = credit + ? WHERE id = ?');
      updateStmt.run(data.amount, data.member_id);
    });
    
    transaction();
    
    return this.db.prepare('SELECT * FROM credit_transactions WHERE id = ?').get(id);
  }

  // Settings
  getSetting(key) {
    const result = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return result ? result.value : null;
  }

  setSetting(key, value) {
    const existing = this.db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
    
    if (existing) {
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(value, key);
    } else {
      const id = this.generateId();
      this.db.prepare(`
        INSERT INTO settings (id, key, value, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(id, key, value);
    }
  }

  // Statistics
  getStatistics(startDate = null, endDate = null) {
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    // Total sales
    const totalSales = this.db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM transactions ${dateFilter}
    `).get(...params);
    
    // Drinks sold
    const drinksSold = this.db.prepare(`
      SELECT COUNT(*) as count FROM transactions ${dateFilter}
    `).get(...params);
    
    // Top drinks
    const topDrinks = this.db.prepare(`
      SELECT d.name, COUNT(*) as count, SUM(t.price) as revenue
      FROM transactions t
      JOIN drinks d ON t.drink_id = d.id
      ${dateFilter}
      GROUP BY d.id, d.name
      ORDER BY count DESC
      LIMIT 5
    `).all(...params);
    
    return {
      totalSales: totalSales.total,
      drinksSold: drinksSold.count,
      topDrinks
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = KeetKassaDatabase;
