// ملف data.js - إدارة التخزين المحلي

class DataManager {
    constructor() {
        this.initializeData();
    }

    // تهيئة البيانات إذا لم تكن موجودة
    initializeData() {
        if (!localStorage.getItem('mizanati_data')) {
            const initialData = {
                version: '1.0',
                transactions: [],
                categories: [
                    { id: 1, name: 'مرتب', type: 'income', budget: 0 },
                    { id: 2, name: 'أعمال حرة', type: 'income', budget: 0 },
                    { id: 3, name: 'استثمارات', type: 'income', budget: 0 },
                    { id: 4, name: 'هدايا', type: 'income', budget: 0 },
                    { id: 5, name: 'أخرى', type: 'income', budget: 0 },
                    { id: 6, name: 'سكن', type: 'expense', budget: 0 },
                    { id: 7, name: 'مواصلات', type: 'expense', budget: 0 },
                    { id: 8, name: 'طعام', type: 'expense', budget: 0 },
                    { id: 9, name: 'تسوق', type: 'expense', budget: 0 },
                    { id: 10, name: 'ترفيه', type: 'expense', budget: 0 },
                    { id: 11, name: 'صحة', type: 'expense', budget: 0 },
                    { id: 12, name: 'تعليم', type: 'expense', budget: 0 },
                    { id: 13, name: 'اتصالات', type: 'expense', budget: 0 },
                    { id: 14, name: 'أخرى', type: 'expense', budget: 0 }
                ],
                debts: [],
                goals: [],
                investments: [],
                reminders: [],
                settings: {
                    currency: 'ج.م',
                    language: 'ar',
                    theme: 'light'
                }
            };
            
            this.saveData(initialData);
        }
    }

    // الحصول على جميع البيانات
    getData() {
        const data = localStorage.getItem('mizanati_data');
        return data ? JSON.parse(data) : null;
    }

    // حفظ البيانات
    saveData(data) {
        localStorage.setItem('mizanati_data', JSON.stringify(data));
    }

    // تحديث جزء من البيانات
    updateData(key, value) {
        const data = this.getData();
        data[key] = value;
        this.saveData(data);
    }

    // === المعاملات ===
    getTransactions() {
        const data = this.getData();
        return data.transactions;
    }

    addTransaction(transaction) {
        const data = this.getData();
        transaction.id = Date.now();
        transaction.createdAt = new Date().toISOString();
        data.transactions.push(transaction);
        this.saveData(data);
        return transaction;
    }

    updateTransaction(id, updatedTransaction) {
        const data = this.getData();
        const index = data.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            data.transactions[index] = { ...data.transactions[index], ...updatedTransaction };
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteTransaction(id) {
        const data = this.getData();
        const index = data.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            data.transactions.splice(index, 1);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // === الفئات ===
    getCategories() {
        const data = this.getData();
        return data.categories;
    }

    addCategory(category) {
        const data = this.getData();
        category.id = Date.now();
        data.categories.push(category);
        this.saveData(data);
        return category;
    }

    updateCategory(id, updatedCategory) {
        const data = this.getData();
        const index = data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            data.categories[index] = { ...data.categories[index], ...updatedCategory };
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteCategory(id) {
        const data = this.getData();
        const index = data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            data.categories.splice(index, 1);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // === الديون والاقساط ===
    getDebts() {
        const data = this.getData();
        return data.debts;
    }

    addDebt(debt) {
        const data = this.getData();
        debt.id = Date.now();
        debt.createdAt = new Date().toISOString();
        debt.status = debt.paidAmount >= debt.totalAmount ? 'paid' : 
                     new Date(debt.dueDate) < new Date() ? 'overdue' : 'pending';
        data.debts.push(debt);
        this.saveData(data);
        return debt;
    }

    updateDebt(id, updatedDebt) {
        const data = this.getData();
        const index = data.debts.findIndex(d => d.id === id);
        if (index !== -1) {
            data.debts[index] = { ...data.debts[index], ...updatedDebt };
            data.debts[index].status = data.debts[index].paidAmount >= data.debts[index].totalAmount ? 'paid' : 
                                      new Date(data.debts[index].dueDate) < new Date() ? 'overdue' : 'pending';
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteDebt(id) {
        const data = this.getData();
        const index = data.debts.findIndex(d => d.id === id);
        if (index !== -1) {
            data.debts.splice(index, 1);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // === الأهداف ===
    getGoals() {
        const data = this.getData();
        return data.goals;
    }

    addGoal(goal) {
        const data = this.getData();
        goal.id = Date.now();
        goal.createdAt = new Date().toISOString();
        goal.progress = (goal.savedAmount / goal.targetAmount) * 100;
        data.goals.push(goal);
        this.saveData(data);
        return goal;
    }

    updateGoal(id, updatedGoal) {
        const data = this.getData();
        const index = data.goals.findIndex(g => g.id === id);
        if (index !== -1) {
            data.goals[index] = { ...data.goals[index], ...updatedGoal };
            data.goals[index].progress = (data.goals[index].savedAmount / data.goals[index].targetAmount) * 100;
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteGoal(id) {
        const data = this.getData();
        const index = data.goals.findIndex(g => g.id === id);
        if (index !== -1) {
            data.goals.splice(index, 1);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // === الاستثمارات ===
    getInvestments() {
        const data = this.getData();
        return data.investments;
    }

    addInvestment(investment) {
        const data = this.getData();
        investment.id = Date.now();
        investment.createdAt = new Date().toISOString();
        data.investments.push(investment);
        this.saveData(data);
        return investment;
    }

    updateInvestment(id, updatedInvestment) {
        const data = this.getData();
        const index = data.investments.findIndex(i => i.id === id);
        if (index !== -1) {
            data.investments[index] = { ...data.investments[index], ...updatedInvestment };
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteInvestment(id) {
        const data = this.getData();
        const index = data.investments.findIndex(i => i.id === id);
        if (index !== -1) {
            data.investments.splice(index, 1);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // === التذكيرات ===
    getReminders() {
        const data = this.getData();
        return data.reminders;
    }

    addReminder(reminder) {
        const data = this.getData();
        reminder.id = Date.now();
        data.reminders.push(reminder);
        this.saveData(data);
        return reminder;
    }

    // === تصدير واستيراد البيانات ===
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mizanati_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.version) {
                    this.saveData(importedData);
                    callback(true, 'تم استيراد البيانات بنجاح!');
                } else {
                    callback(false, 'ملف غير صالح. يرجى التأكد من صحة الملف.');
                }
            } catch (error) {
                callback(false, 'حدث خطأ في قراءة الملف.');
            }
        };
        reader.readAsText(file);
    }

    // === الحسابات المالية ===
    getFinancialSummary() {
        const transactions = this.getTransactions();
        const debts = this.getDebts();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let totalIncome = 0;
        let totalExpense = 0;
        let monthIncome = 0;
        let monthExpense = 0;
        let dueInstallments = 0;
        let dueDebts = 0;
        
        // حساب الإيرادات والمصروفات
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const amount = parseFloat(transaction.amount);
            
            if (transaction.type === 'income') {
                totalIncome += amount;
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    monthIncome += amount;
                }
            } else {
                totalExpense += amount;
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    monthExpense += amount;
                }
            }
        });
        
        // حساب الديون والأقساط المستحقة
        debts.forEach(debt => {
            const dueDate = new Date(debt.dueDate);
            const remaining = debt.totalAmount - debt.paidAmount;
            
            if (remaining > 0 && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                if (debt.type === 'installment') {
                    dueInstallments += remaining;
                } else {
                    dueDebts += remaining;
                }
            }
        });
        
        return {
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            monthIncome,
            monthExpense,
            dueInstallments,
            dueDebts
        };
    }

    // الحصول على ملخص الميزانية
    getBudgetSummary() {
        const categories = this.getCategories();
        const transactions = this.getTransactions();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let totalBudget = 0;
        let actualSpending = 0;
        
        const categorySpending = {};
        
        // حساب الميزانية والإنفاق لكل فئة
        categories.forEach(category => {
            if (category.type === 'expense') {
                totalBudget += parseFloat(category.budget || 0);
                categorySpending[category.id] = {
                    name: category.name,
                    budget: parseFloat(category.budget || 0),
                    spent: 0
                };
            }
        });
        
        // حساب الإنفاق الفعلي
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const transactionDate = new Date(transaction.date);
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    const categoryId = transaction.categoryId;
                    if (categorySpending[categoryId]) {
                        categorySpending[categoryId].spent += parseFloat(transaction.amount);
                        actualSpending += parseFloat(transaction.amount);
                    }
                }
            }
        });
        
        return {
            totalBudget,
            actualSpending,
            remainingBudget: totalBudget - actualSpending,
            categorySpending: Object.values(categorySpending)
        };
    }
}

// إنشاء مثيل من مدير البيانات
const dataManager = new DataManager();