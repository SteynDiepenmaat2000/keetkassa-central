// TypeScript types for database operations
export interface Member {
  id: string;
  name: string;
  credit: number;
  active: boolean;
  created_at: string;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
  volume_ml: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  member_id: string;
  drink_id: string;
  price: number;
  created_at: string;
  member_name?: string;
  drink_name?: string;
}

export interface Expense {
  id: string;
  member_id: string;
  amount: number;
  description: string;
  payment_method: string | null;
  settled: boolean;
  created_at: string;
  member_name?: string;
}

export interface Purchase {
  id: string;
  category: string;
  description: string | null;
  quantity: number;
  price_per_unit: number;
  units_per_package: number | null;
  bottle_size: number | null;
  deposit_per_unit: number | null;
  total_amount: number;
  member_id: string | null;
  payment_method: string | null;
  settled: boolean;
  created_at: string;
  member_name?: string;
}

export interface CreditTransaction {
  id: string;
  member_id: string;
  amount: number;
  created_at: string;
  member_name?: string;
}

export interface Statistics {
  totalSales: number;
  drinksSold: number;
  topDrinks: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

// Database API - uses window.electronAPI or provides mock for web preview
export const db = {
  // Members
  getMembers: async (activeOnly?: boolean): Promise<Member[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getMembers(activeOnly);
    }
    return [];
  },

  getMember: async (id: string): Promise<Member | null> => {
    if (window.electronAPI) {
      return window.electronAPI.getMember(id);
    }
    return null;
  },

  createMember: async (data: Partial<Member>): Promise<Member> => {
    if (window.electronAPI) {
      return window.electronAPI.createMember(data);
    }
    throw new Error('Database not available');
  },

  updateMember: async (id: string, data: Partial<Member>): Promise<Member> => {
    if (window.electronAPI) {
      return window.electronAPI.updateMember(id, data);
    }
    throw new Error('Database not available');
  },

  deleteMember: async (id: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.deleteMember(id);
    }
    throw new Error('Database not available');
  },

  // Drinks
  getDrinks: async (): Promise<Drink[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getDrinks();
    }
    return [];
  },

  getDrink: async (id: string): Promise<Drink | null> => {
    if (window.electronAPI) {
      return window.electronAPI.getDrink(id);
    }
    return null;
  },

  createDrink: async (data: Partial<Drink>): Promise<Drink> => {
    if (window.electronAPI) {
      return window.electronAPI.createDrink(data);
    }
    throw new Error('Database not available');
  },

  updateDrink: async (id: string, data: Partial<Drink>): Promise<Drink> => {
    if (window.electronAPI) {
      return window.electronAPI.updateDrink(id, data);
    }
    throw new Error('Database not available');
  },

  deleteDrink: async (id: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.deleteDrink(id);
    }
    throw new Error('Database not available');
  },

  // Transactions
  getTransactions: async (limit?: number): Promise<Transaction[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getTransactions(limit);
    }
    return [];
  },

  createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
    if (window.electronAPI) {
      return window.electronAPI.createTransaction(data);
    }
    throw new Error('Database not available');
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getExpenses();
    }
    return [];
  },

  createExpense: async (data: Partial<Expense>): Promise<Expense> => {
    if (window.electronAPI) {
      return window.electronAPI.createExpense(data);
    }
    throw new Error('Database not available');
  },

  updateExpense: async (id: string, data: Partial<Expense>): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.updateExpense(id, data);
    }
    throw new Error('Database not available');
  },

  deleteExpense: async (id: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.deleteExpense(id);
    }
    throw new Error('Database not available');
  },

  // Purchases
  getPurchases: async (): Promise<Purchase[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getPurchases();
    }
    return [];
  },

  createPurchase: async (data: Partial<Purchase>): Promise<Purchase> => {
    if (window.electronAPI) {
      return window.electronAPI.createPurchase(data);
    }
    throw new Error('Database not available');
  },

  updatePurchase: async (id: string, data: Partial<Purchase>): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.updatePurchase(id, data);
    }
    throw new Error('Database not available');
  },

  deletePurchase: async (id: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.deletePurchase(id);
    }
    throw new Error('Database not available');
  },

  // Credit Transactions
  getCreditTransactions: async (memberId?: string): Promise<CreditTransaction[]> => {
    if (window.electronAPI) {
      return window.electronAPI.getCreditTransactions(memberId);
    }
    return [];
  },

  createCreditTransaction: async (data: Partial<CreditTransaction>): Promise<CreditTransaction> => {
    if (window.electronAPI) {
      return window.electronAPI.createCreditTransaction(data);
    }
    throw new Error('Database not available');
  },

  // Settings
  getSetting: async (key: string): Promise<string | null> => {
    if (window.electronAPI) {
      return window.electronAPI.getSetting(key);
    }
    return null;
  },

  setSetting: async (key: string, value: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.setSetting(key, value);
    }
    throw new Error('Database not available');
  },

  // Statistics
  getStatistics: async (startDate?: string, endDate?: string): Promise<Statistics> => {
    if (window.electronAPI) {
      return window.electronAPI.getStatistics(startDate, endDate);
    }
    return { totalSales: 0, drinksSold: 0, topDrinks: [] };
  },
};

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      getMembers: (activeOnly?: boolean) => Promise<Member[]>;
      getMember: (id: string) => Promise<Member | null>;
      createMember: (data: Partial<Member>) => Promise<Member>;
      updateMember: (id: string, data: Partial<Member>) => Promise<Member>;
      deleteMember: (id: string) => Promise<void>;
      
      getDrinks: () => Promise<Drink[]>;
      getDrink: (id: string) => Promise<Drink | null>;
      createDrink: (data: Partial<Drink>) => Promise<Drink>;
      updateDrink: (id: string, data: Partial<Drink>) => Promise<Drink>;
      deleteDrink: (id: string) => Promise<void>;
      
      getTransactions: (limit?: number) => Promise<Transaction[]>;
      createTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
      
      getExpenses: () => Promise<Expense[]>;
      createExpense: (data: Partial<Expense>) => Promise<Expense>;
      updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
      deleteExpense: (id: string) => Promise<void>;
      
      getPurchases: () => Promise<Purchase[]>;
      createPurchase: (data: Partial<Purchase>) => Promise<Purchase>;
      updatePurchase: (id: string, data: Partial<Purchase>) => Promise<void>;
      deletePurchase: (id: string) => Promise<void>;
      
      getCreditTransactions: (memberId?: string) => Promise<CreditTransaction[]>;
      createCreditTransaction: (data: Partial<CreditTransaction>) => Promise<CreditTransaction>;
      
      getSetting: (key: string) => Promise<string | null>;
      setSetting: (key: string, value: string) => Promise<void>;
      
      getStatistics: (startDate?: string, endDate?: string) => Promise<Statistics>;
    };
  }
}
