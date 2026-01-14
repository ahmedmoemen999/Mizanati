// ملف script.js - المنطق الرئيسي للتطبيق

class MizanatiApp {
    constructor() {
        this.dataManager = dataManager;
        this.utils = utils;
        this.currentTab = 'dashboard';
        this.currentTransactionId = null;
        this.currentDebtId = null;
        this.currentGoalId = null;
        this.currentInvestmentId = null;
        this.charts = {};
        
        this.init();
    }

    // تهيئة التطبيق
    init() {
        this.setupEventListeners();
        this.updateDateDisplay();
        this.loadDashboard();
        this.setActiveTab('dashboard');
        
        // تحديث الملخص المالي
        this.updateFinancialSummary();
        
        // تحديث السنة الحالية في التذييل
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // التنقل بين التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.setActiveTab(tabId);
            });
        });

        // أزرار إضافة جديدة
        document.getElementById('add-transaction-btn').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('add-transaction-btn2').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('add-debt-btn').addEventListener('click', () => this.openDebtModal());
        document.getElementById('add-goal-btn').addEventListener('click', () => this.openGoalModal());
        document.getElementById('add-goal-btn2').addEventListener('click', () => this.openGoalModal());
        document.getElementById('add-investment-btn').addEventListener('click', () => this.openInvestmentModal());
        document.getElementById('add-category-btn').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('view-all-transactions').addEventListener('click', () => this.setActiveTab('transactions'));

        // إغلاق النوافذ المنبثقة
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // النماذج
        document.getElementById('transaction-form').addEventListener('submit', (e) => this.saveTransaction(e));
        document.getElementById('debt-form').addEventListener('submit', (e) => this.saveDebt(e));
        document.getElementById('goal-form').addEventListener('submit', (e) => this.saveGoal(e));
        document.getElementById('investment-form').addEventListener('submit', (e) => this.saveInvestment(e));
        document.getElementById('category-form').addEventListener('submit', (e) => this.saveCategory(e));

        // التصفية
        document.getElementById('apply-filter').addEventListener('click', () => this.filterTransactions());
        document.getElementById('reset-filter').addEventListener('click', () => this.resetTransactionFilter());

        // التصدير والاستيراد
        document.getElementById('export-data').addEventListener('click', (e) => {
            e.preventDefault();
            this.dataManager.exportData();
            this.utils.showMessage('تم تصدير البيانات بنجاح!', 'success');
        });

        document.getElementById('import-data').addEventListener('click', (e) => {
            e.preventDefault();
            this.openImportDialog();
        });

        document.getElementById('backup-data').addEventListener('click', (e) => {
            e.preventDefault();
            this.dataManager.exportData();
            this.utils.showMessage('تم إنشاء نسخة احتياطية بنجاح!', 'success');
        });

        // التقارير
        document.getElementById('generate-report').addEventListener('click', () => this.generateReport());
        document.getElementById('report-period').addEventListener('change', (e) => {
            const customRange = document.getElementById('custom-date-range');
            if (e.target.value === 'custom') {
                customRange.classList.remove('hidden');
            } else {
                customRange.classList.add('hidden');
            }
        });

        // تصفية الديون
        document.getElementById('debt-type-filter').addEventListener('change', () => this.loadDebts());
    }

    // تحديث عرض التاريخ
    updateDateDisplay() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('ar-EG', options);
        document.getElementById('current-date').textContent = dateString;
    }

    // تعيين التبويب النشط
    setActiveTab(tabId) {
        // إزالة النشاط من جميع التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // تعيين التبويب الجديد كنشط
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        this.currentTab = tabId;
        
        // تحميل محتوى التبويب
        switch(tabId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'budget':
                this.loadBudget();
                break;
            case 'debts':
                this.loadDebts();
                break;
            case 'goals':
                this.loadGoals();
                break;
            case 'investments':
                this.loadInvestments();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    // تحديث الملخص المالي
    updateFinancialSummary() {
        const summary = this.dataManager.getFinancialSummary();
        
        document.getElementById('total-income').textContent = this.utils.formatCurrency(summary.totalIncome);
        document.getElementById('total-expense').textContent = this.utils.formatCurrency(summary.totalExpense);
        document.getElementById('net-balance').textContent = this.utils.formatCurrency(summary.netBalance);
        document.getElementById('month-income').textContent = this.utils.formatCurrency(summary.monthIncome);
        document.getElementById('month-expense').textContent = this.utils.formatCurrency(summary.monthExpense);
        document.getElementById('due-installments').textContent = this.utils.formatCurrency(summary.dueInstallments);
        document.getElementById('due-debts').textContent = this.utils.formatCurrency(summary.dueDebts);
    }

    // ========== لوحة التحكم ==========
    loadDashboard() {
        this.loadRecentTransactions();
        this.loadGoalsPreview();
        this.loadReminders();
        this.updateFinancialSummary();
    }

    // تحميل المعاملات الأخيرة
    loadRecentTransactions() {
        const transactions = this.dataManager.getTransactions();
        const recentTransactions = this.utils.sortTransactionsByDate(transactions).slice(0, 5);
        const container = document.getElementById('recent-transactions-list');
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش معاملات مسجلة. اضف معاملة جديدة!</p>';
            return;
        }
        
        let html = '';
        recentTransactions.forEach(transaction => {
            const category = this.dataManager.getCategories().find(c => c.id == transaction.categoryId);
            const categoryName = category ? category.name : 'غير مصنف';
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <h4>${transaction.description}</h4>
                        <span>${categoryName} • ${this.utils.formatShortDate(transaction.date)}</span>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'} ${this.utils.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // تحميل معاينة الأهداف
    loadGoalsPreview() {
        const goals = this.dataManager.getGoals();
        const container = document.getElementById('goals-preview-list');
        
        if (goals.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش أهداف. ابدأ بإضافة أول هدف!</p>';
            return;
        }
        
        // عرض أول 3 أهداف فقط
        const previewGoals = goals.slice(0, 3);
        let html = '';
        
        previewGoals.forEach(goal => {
            const progress = this.utils.calculateGoalProgress(goal.savedAmount, goal.targetAmount);
            
            html += `
                <div class="goal-item">
                    <div class="goal-info">
                        <h4>${goal.name}</h4>
                        <span>${this.utils.getGoalProgressText(goal.savedAmount, goal.targetAmount)}</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // تحميل التذكيرات
    loadReminders() {
        const debts = this.dataManager.getDebts();
        const now = new Date();
        const upcomingWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcomingDebts = debts.filter(debt => {
            const dueDate = new Date(debt.dueDate);
            const remaining = debt.totalAmount - debt.paidAmount;
            return remaining > 0 && dueDate <= upcomingWeek && dueDate >= now;
        });
        
        const container = document.getElementById('reminders-list');
        
        if (upcomingDebts.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش تذكيرات حالياً</p>';
            return;
        }
        
        let html = '';
        upcomingDebts.forEach(debt => {
            const dueStatus = this.utils.getDueStatus(debt.dueDate);
            const remaining = debt.totalAmount - debt.paidAmount;
            
            html += `
                <div class="reminder-item">
                    <div class="reminder-info">
                        <h4>${debt.name}</h4>
                        <span>استحقاق ${this.utils.formatShortDate(debt.dueDate)}</span>
                    </div>
                    <div class="reminder-amount">
                        ${this.utils.formatCurrency(remaining)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // ========== إدارة المعاملات ==========
    loadTransactions() {
        const transactions = this.dataManager.getTransactions();
        const filteredTransactions = this.utils.filterTransactions(transactions, {});
        this.renderTransactionsTable(filteredTransactions);
    }

    renderTransactionsTable(transactions) {
        const container = document.getElementById('transactions-table-body');
        const categories = this.dataManager.getCategories();
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table-message">
                        مافيش معاملات مسجلة. اضف معاملة جديدة!
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        transactions.forEach(transaction => {
            const category = categories.find(c => c.id == transaction.categoryId);
            const categoryName = category ? category.name : 'غير مصنف';
            
            html += `
                <tr>
                    <td>${this.utils.formatShortDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="transaction-type ${transaction.type}">
                            ${this.utils.getCategoryLabel(transaction.type)}
                        </span>
                    </td>
                    <td>${categoryName}</td>
                    <td class="${transaction.type}">${transaction.type === 'income' ? '+' : '-'} ${this.utils.formatCurrency(transaction.amount)}</td>
                    <td>
                        <button class="btn-icon edit-transaction" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-transaction" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.editTransaction(id);
            });
        });
        
        document.querySelectorAll('.delete-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.deleteTransaction(id);
            });
        });
    }

    filterTransactions() {
        const type = document.getElementById('filter-type').value;
        const date = document.getElementById('filter-date').value;
        
        const filters = {};
        if (type !== 'all') filters.type = type;
        if (date) filters.date = date;
        
        const transactions = this.dataManager.getTransactions();
        const filteredTransactions = this.utils.filterTransactions(transactions, filters);
        
        this.renderTransactionsTable(filteredTransactions);
    }

    resetTransactionFilter() {
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-date').value = '';
        
        const transactions = this.dataManager.getTransactions();
        const filteredTransactions = this.utils.filterTransactions(transactions, {});
        
        this.renderTransactionsTable(filteredTransactions);
    }

    // ========== النوافذ المنبثقة ==========
    openTransactionModal(transactionId = null) {
        this.currentTransactionId = transactionId;
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('transaction-modal-title');
        const form = document.getElementById('transaction-form');
        
        // تعبئة قائمة الفئات
        this.populateCategoryDropdown('transaction-category', 'all');
        
        if (transactionId) {
            title.textContent = 'تعديل المعاملة';
            
            // تحميل بيانات المعاملة
            const transaction = this.dataManager.getTransactions().find(t => t.id === transactionId);
            if (transaction) {
                document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
                document.getElementById('transaction-amount').value = transaction.amount;
                document.getElementById('transaction-description').value = transaction.description;
                document.getElementById('transaction-category').value = transaction.categoryId;
                document.getElementById('transaction-date').value = this.utils.dateToInputFormat(transaction.date);
                document.getElementById('transaction-notes').value = transaction.notes || '';
                document.getElementById('transaction-id').value = transactionId;
            }
        } else {
            title.textContent = 'إضافة معاملة جديدة';
            form.reset();
            document.getElementById('transaction-date').value = this.utils.getCurrentDate();
            document.getElementById('transaction-id').value = '';
        }
        
        modal.classList.add('active');
    }

    openDebtModal(debtId = null) {
        this.currentDebtId = debtId;
        const modal = document.getElementById('debt-modal');
        const title = document.getElementById('debt-modal-title');
        const form = document.getElementById('debt-form');
        
        if (debtId) {
            title.textContent = 'تعديل دين/قسط';
            
            // تحميل بيانات الدين/القسط
            const debt = this.dataManager.getDebts().find(d => d.id === debtId);
            if (debt) {
                document.getElementById('debt-name').value = debt.name;
                document.getElementById('debt-type').value = debt.type;
                document.getElementById('debt-total-amount').value = debt.totalAmount;
                document.getElementById('debt-paid-amount').value = debt.paidAmount;
                document.getElementById('debt-due-date').value = this.utils.dateToInputFormat(debt.dueDate);
                document.getElementById('debt-installment-amount').value = debt.installmentAmount || '';
                document.getElementById('debt-notes').value = debt.notes || '';
                document.getElementById('debt-id').value = debtId;
            }
        } else {
            title.textContent = 'إضافة دين/قسط جديد';
            form.reset();
            document.getElementById('debt-due-date').value = this.utils.getCurrentDate();
            document.getElementById('debt-id').value = '';
        }
        
        modal.classList.add('active');
    }

    openGoalModal(goalId = null) {
        this.currentGoalId = goalId;
        const modal = document.getElementById('goal-modal');
        const title = document.getElementById('goal-modal-title');
        const form = document.getElementById('goal-form');
        
        if (goalId) {
            title.textContent = 'تعديل الهدف';
            
            // تحميل بيانات الهدف
            const goal = this.dataManager.getGoals().find(g => g.id === goalId);
            if (goal) {
                document.getElementById('goal-name').value = goal.name;
                document.getElementById('goal-target-amount').value = goal.targetAmount;
                document.getElementById('goal-saved-amount').value = goal.savedAmount;
                document.getElementById('goal-deadline').value = this.utils.dateToInputFormat(goal.deadline);
                document.getElementById('goal-priority').value = goal.priority;
                document.getElementById('goal-notes').value = goal.notes || '';
                document.getElementById('goal-id').value = goalId;
            }
        } else {
            title.textContent = 'إضافة هدف جديد';
            form.reset();
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            document.getElementById('goal-deadline').value = this.utils.dateToInputFormat(nextYear);
            document.getElementById('goal-id').value = '';
        }
        
        modal.classList.add('active');
    }

    openInvestmentModal(investmentId = null) {
        this.currentInvestmentId = investmentId;
        const modal = document.getElementById('investment-modal');
        const title = document.getElementById('investment-modal-title');
        const form = document.getElementById('investment-form');
        
        if (investmentId) {
            title.textContent = 'تعديل الاستثمار';
            
            // تحميل بيانات الاستثمار
            const investment = this.dataManager.getInvestments().find(i => i.id === investmentId);
            if (investment) {
                document.getElementById('investment-name').value = investment.name;
                document.getElementById('investment-type').value = investment.type;
                document.getElementById('investment-amount').value = investment.amount;
                document.getElementById('investment-date').value = this.utils.dateToInputFormat(investment.date);
                document.getElementById('investment-return').value = investment.expectedReturn || 5;
                document.getElementById('investment-notes').value = investment.notes || '';
                document.getElementById('investment-id').value = investmentId;
            }
        } else {
            title.textContent = 'إضافة استثمار جديد';
            form.reset();
            document.getElementById('investment-date').value = this.utils.getCurrentDate();
            document.getElementById('investment-id').value = '';
        }
        
        modal.classList.add('active');
    }

    openCategoryModal() {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        
        form.reset();
        modal.classList.add('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // إعادة تعيين جميع المعرفات
        this.currentTransactionId = null;
        this.currentDebtId = null;
        this.currentGoalId = null;
        this.currentInvestmentId = null;
    }

    // تعبئة قائمة الفئات المنسدلة
    populateCategoryDropdown(dropdownId, type = 'all') {
        const categories = this.dataManager.getCategories();
        const dropdown = document.getElementById(dropdownId);
        
        let html = '<option value="">اختر فئة</option>';
        
        categories.forEach(category => {
            if (type === 'all' || category.type === type) {
                html += `<option value="${category.id}">${category.name}</option>`;
            }
        });
        
        dropdown.innerHTML = html;
    }

    // ========== حفظ البيانات ==========
    saveTransaction(e) {
        e.preventDefault();
        
        const transaction = {
            type: document.querySelector('input[name="type"]:checked').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            description: document.getElementById('transaction-description').value,
            categoryId: parseInt(document.getElementById('transaction-category').value),
            date: document.getElementById('transaction-date').value,
            notes: document.getElementById('transaction-notes').value
        };
        
        // التحقق من صحة البيانات
        const validation = this.utils.validateInput(transaction.amount, 'number');
        if (!validation.isValid) {
            this.utils.showMessage(validation.message, 'error');
            return;
        }
        
        if (this.currentTransactionId) {
            // تعديل معاملة موجودة
            const success = this.dataManager.updateTransaction(this.currentTransactionId, transaction);
            if (success) {
                this.utils.showMessage('تم تعديل المعاملة بنجاح!', 'success');
            }
        } else {
            // إضافة معاملة جديدة
            this.dataManager.addTransaction(transaction);
            this.utils.showMessage('تم إضافة المعاملة بنجاح!', 'success');
        }
        
        this.closeAllModals();
        this.updateFinancialSummary();
        this.loadDashboard();
        
        if (this.currentTab === 'transactions') {
            this.loadTransactions();
        }
        
        if (this.currentTab === 'budget') {
            this.loadBudget();
        }
    }

    saveDebt(e) {
        e.preventDefault();
        
        const debt = {
            name: document.getElementById('debt-name').value,
            type: document.getElementById('debt-type').value,
            totalAmount: parseFloat(document.getElementById('debt-total-amount').value),
            paidAmount: parseFloat(document.getElementById('debt-paid-amount').value) || 0,
            dueDate: document.getElementById('debt-due-date').value,
            installmentAmount: document.getElementById('debt-installment-amount').value ? 
                parseFloat(document.getElementById('debt-installment-amount').value) : 0,
            notes: document.getElementById('debt-notes').value
        };
        
        // التحقق من صحة البيانات
        const validation = this.utils.validateInput(debt.totalAmount, 'number');
        if (!validation.isValid) {
            this.utils.showMessage(validation.message, 'error');
            return;
        }
        
        if (debt.paidAmount > debt.totalAmount) {
            this.utils.showMessage('المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الإجمالي', 'error');
            return;
        }
        
        if (this.currentDebtId) {
            // تعديل دين/قسط موجود
            const success = this.dataManager.updateDebt(this.currentDebtId, debt);
            if (success) {
                this.utils.showMessage('تم تعديل الدين/القسط بنجاح!', 'success');
            }
        } else {
            // إضافة دين/قسط جديد
            this.dataManager.addDebt(debt);
            this.utils.showMessage('تم إضافة الدين/القسط بنجاح!', 'success');
        }
        
        this.closeAllModals();
        this.updateFinancialSummary();
        
        if (this.currentTab === 'debts') {
            this.loadDebts();
        }
        
        if (this.currentTab === 'dashboard') {
            this.loadReminders();
        }
    }

    saveGoal(e) {
        e.preventDefault();
        
        const goal = {
            name: document.getElementById('goal-name').value,
            targetAmount: parseFloat(document.getElementById('goal-target-amount').value),
            savedAmount: parseFloat(document.getElementById('goal-saved-amount').value) || 0,
            deadline: document.getElementById('goal-deadline').value,
            priority: document.getElementById('goal-priority').value,
            notes: document.getElementById('goal-notes').value
        };
        
        // التحقق من صحة البيانات
        const validation = this.utils.validateInput(goal.targetAmount, 'number');
        if (!validation.isValid) {
            this.utils.showMessage(validation.message, 'error');
            return;
        }
        
        if (goal.savedAmount > goal.targetAmount) {
            this.utils.showMessage('المبلغ المدخر لا يمكن أن يكون أكبر من المبلغ المستهدف', 'error');
            return;
        }
        
        if (this.currentGoalId) {
            // تعديل هدف موجود
            const success = this.dataManager.updateGoal(this.currentGoalId, goal);
            if (success) {
                this.utils.showMessage('تم تعديل الهدف بنجاح!', 'success');
            }
        } else {
            // إضافة هدف جديد
            this.dataManager.addGoal(goal);
            this.utils.showMessage('تم إضافة الهدف بنجاح!', 'success');
        }
        
        this.closeAllModals();
        
        if (this.currentTab === 'goals') {
            this.loadGoals();
        }
        
        if (this.currentTab === 'dashboard') {
            this.loadGoalsPreview();
        }
    }

    saveInvestment(e) {
        e.preventDefault();
        
        const investment = {
            name: document.getElementById('investment-name').value,
            type: document.getElementById('investment-type').value,
            amount: parseFloat(document.getElementById('investment-amount').value),
            date: document.getElementById('investment-date').value,
            expectedReturn: parseFloat(document.getElementById('investment-return').value) || 5,
            notes: document.getElementById('investment-notes').value
        };
        
        // التحقق من صحة البيانات
        const validation = this.utils.validateInput(investment.amount, 'number');
        if (!validation.isValid) {
            this.utils.showMessage(validation.message, 'error');
            return;
        }
        
        if (this.currentInvestmentId) {
            // تعديل استثمار موجود
            const success = this.dataManager.updateInvestment(this.currentInvestmentId, investment);
            if (success) {
                this.utils.showMessage('تم تعديل الاستثمار بنجاح!', 'success');
            }
        } else {
            // إضافة استثمار جديد
            this.dataManager.addInvestment(investment);
            this.utils.showMessage('تم إضافة الاستثمار بنجاح!', 'success');
        }
        
        this.closeAllModals();
        
        if (this.currentTab === 'investments') {
            this.loadInvestments();
        }
    }

    saveCategory(e) {
        e.preventDefault();
        
        const category = {
            name: document.getElementById('category-name').value,
            type: document.getElementById('category-type').value,
            budget: parseFloat(document.getElementById('category-budget').value) || 0
        };
        
        // التحقق من صحة البيانات
        if (!category.name.trim()) {
            this.utils.showMessage('يرجى إدخال اسم الفئة', 'error');
            return;
        }
        
        this.dataManager.addCategory(category);
        this.utils.showMessage('تم إضافة الفئة بنجاح!', 'success');
        
        this.closeAllModals();
        
        if (this.currentTab === 'budget') {
            this.loadBudget();
        }
    }

    // ========== تعديل وحذف البيانات ==========
    editTransaction(id) {
        this.openTransactionModal(id);
    }

    deleteTransaction(id) {
        if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
            const success = this.dataManager.deleteTransaction(id);
            if (success) {
                this.utils.showMessage('تم حذف المعاملة بنجاح!', 'success');
                this.loadTransactions();
                this.updateFinancialSummary();
                this.loadDashboard();
                
                if (this.currentTab === 'budget') {
                    this.loadBudget();
                }
            }
        }
    }

    // ========== الميزانية ==========
    loadBudget() {
        this.loadBudgetCategories();
        this.updateBudgetChart();
    }

    loadBudgetCategories() {
        const categories = this.dataManager.getCategories().filter(c => c.type === 'expense');
        const budgetSummary = this.dataManager.getBudgetSummary();
        const categorySpending = budgetSummary.categorySpending;
        
        const container = document.getElementById('budget-categories-list');
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش فئات ميزانية. أضف فئات جديدة!</p>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            const spending = categorySpending.find(c => c.name === category.name) || { spent: 0 };
            const spent = spending.spent;
            const budget = parseFloat(category.budget || 0);
            const remaining = budget - spent;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            
            let statusClass = 'good';
            if (percentage > 100) {
                statusClass = 'over';
            } else if (percentage > 80) {
                statusClass = 'warning';
            }
            
            html += `
                <div class="category-item">
                    <div class="category-header">
                        <h4>${category.name}</h4>
                        <span class="category-budget">${this.utils.formatCurrency(budget)}</span>
                    </div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="category-details">
                            <span>أنفقت: ${this.utils.formatCurrency(spent)}</span>
                            <span>المتبقي: ${this.utils.formatCurrency(remaining)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // تحديث ملخص الميزانية
        document.getElementById('total-budget').textContent = this.utils.formatCurrency(budgetSummary.totalBudget);
        document.getElementById('actual-spending').textContent = this.utils.formatCurrency(budgetSummary.actualSpending);
        document.getElementById('remaining-budget').textContent = this.utils.formatCurrency(budgetSummary.remainingBudget);
    }

    updateBudgetChart() {
        const budgetSummary = this.dataManager.getBudgetSummary();
        const categorySpending = budgetSummary.categorySpending;
        
        const ctx = document.getElementById('budget-chart').getContext('2d');
        
        // إزالة الرسم البياني السابق إذا كان موجوداً
        if (this.charts.budgetChart) {
            this.charts.budgetChart.destroy();
        }
        
        const labels = categorySpending.map(c => c.name);
        const budgetData = categorySpending.map(c => c.budget);
        const spentData = categorySpending.map(c => c.spent);
        
        this.charts.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'الميزانية',
                        data: budgetData,
                        backgroundColor: '#4361ee',
                        borderColor: '#3a56d4',
                        borderWidth: 1
                    },
                    {
                        label: 'الإنفاق الفعلي',
                        data: spentData,
                        backgroundColor: '#f72585',
                        borderColor: '#e01e76',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('ar-EG') + ' ج.م';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y.toLocaleString('ar-EG') + ' ج.م';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // ========== الديون والاقساط ==========
    loadDebts() {
        const debts = this.dataManager.getDebts();
        const filterType = document.getElementById('debt-type-filter').value;
        
        let filteredDebts = debts;
        if (filterType !== 'all') {
            filteredDebts = debts.filter(d => d.type === filterType);
        }
        
        this.renderDebtsTable(filteredDebts);
        this.loadUpcomingPayments();
    }

    renderDebtsTable(debts) {
        const container = document.getElementById('debts-table-body');
        
        if (debts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table-message">
                        مافيش ديون أو أقساط مسجلة. اضف دين أو قسط جديد!
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        debts.forEach(debt => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const dueStatus = this.utils.getDueStatus(debt.deadline);
            const statusLabel = this.utils.getDebtStatusLabel(debt.status);
            
            html += `
                <tr>
                    <td>${debt.name}</td>
                    <td>${debt.type === 'installment' ? 'قسط' : 'دين'}</td>
                    <td>${this.utils.formatCurrency(debt.totalAmount)}</td>
                    <td>${this.utils.formatCurrency(debt.paidAmount)}</td>
                    <td>${this.utils.formatCurrency(remaining)}</td>
                    <td>${this.utils.formatShortDate(debt.dueDate)}</td>
                    <td><span class="status ${debt.status}">${statusLabel}</span></td>
                    <td>
                        <button class="btn-icon edit-debt" data-id="${debt.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-debt" data-id="${debt.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${remaining > 0 ? `
                        <button class="btn-icon add-payment" data-id="${debt.id}">
                            <i class="fas fa-money-check-alt"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.edit-debt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.editDebt(id);
            });
        });
        
        document.querySelectorAll('.delete-debt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.deleteDebt(id);
            });
        });
        
        document.querySelectorAll('.add-payment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.addPaymentToDebt(id);
            });
        });
    }

    editDebt(id) {
        this.openDebtModal(id);
    }

    deleteDebt(id) {
        if (confirm('هل أنت متأكد من حذف هذا الدين/القسط؟')) {
            const success = this.dataManager.deleteDebt(id);
            if (success) {
                this.utils.showMessage('تم حذف الدين/القسط بنجاح!', 'success');
                this.loadDebts();
                this.updateFinancialSummary();
            }
        }
    }

    addPaymentToDebt(id) {
        const debt = this.dataManager.getDebts().find(d => d.id === id);
        if (!debt) return;
        
        const remaining = debt.totalAmount - debt.paidAmount;
        const paymentAmount = prompt(`أدخل مبلغ الدفع (المتبقي: ${this.utils.formatCurrency(remaining)}):`, debt.installmentAmount || '');
        
        if (paymentAmount && !isNaN(paymentAmount) && parseFloat(paymentAmount) > 0) {
            const amount = parseFloat(paymentAmount);
            const newPaidAmount = debt.paidAmount + amount;
            
            if (newPaidAmount > debt.totalAmount) {
                this.utils.showMessage('المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الإجمالي', 'error');
                return;
            }
            
            const updatedDebt = { ...debt, paidAmount: newPaidAmount };
            const success = this.dataManager.updateDebt(id, updatedDebt);
            
            if (success) {
                this.utils.showMessage(`تم تسديد ${this.utils.formatCurrency(amount)} بنجاح!`, 'success');
                
                // إضافة معاملة مصروف لهذا الدفع
                if (amount > 0) {
                    const transaction = {
                        type: 'expense',
                        amount: amount,
                        description: `دفعة ${debt.name}`,
                        categoryId: 14, // فئة "أخرى"
                        date: this.utils.getCurrentDate(),
                        notes: `دفعة مقابل ${debt.name}`
                    };
                    
                    this.dataManager.addTransaction(transaction);
                }
                
                this.loadDebts();
                this.updateFinancialSummary();
                
                if (this.currentTab === 'dashboard') {
                    this.loadReminders();
                }
            }
        }
    }

    loadUpcomingPayments() {
        const debts = this.dataManager.getDebts();
        const now = new Date();
        const upcomingWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcomingPayments = debts.filter(debt => {
            const dueDate = new Date(debt.dueDate);
            const remaining = debt.totalAmount - debt.paidAmount;
            return remaining > 0 && dueDate <= upcomingWeek && dueDate >= now;
        });
        
        const container = document.getElementById('upcoming-payments-list');
        
        if (upcomingPayments.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش دفعات قادمة</p>';
            return;
        }
        
        let html = '';
        upcomingPayments.forEach(debt => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const dueStatus = this.utils.getDueStatus(debt.dueDate);
            
            html += `
                <div class="payment-item">
                    <div class="payment-info">
                        <h4>${debt.name}</h4>
                        <span>${dueStatus.text} (${dueStatus.days} يوم)</span>
                    </div>
                    <div class="payment-amount">
                        ${this.utils.formatCurrency(remaining)}
                        <button class="btn-small add-payment" data-id="${debt.id}">سدد</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // إضافة مستمعي الأحداث لأزرار السداد
        document.querySelectorAll('.add-payment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.addPaymentToDebt(id);
            });
        });
    }

    // ========== الأهداف ==========
    loadGoals() {
        const goals = this.dataManager.getGoals();
        const container = document.getElementById('goals-container');
        
        if (goals.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش أهداف. ابدأ بإضافة أول هدف!</p>';
            return;
        }
        
        let html = '';
        goals.forEach(goal => {
            const progress = this.utils.calculateGoalProgress(goal.savedAmount, goal.targetAmount);
            const remaining = goal.targetAmount - goal.savedAmount;
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            
            let progressClass = '';
            if (progress >= 100) {
                progressClass = 'completed';
            } else if (daysRemaining < 0) {
                progressClass = 'overdue';
            } else if (daysRemaining < 30) {
                progressClass = 'urgent';
            }
            
            html += `
                <div class="goal-card ${goal.priority} ${progressClass}">
                    <div class="goal-header">
                        <h3>${goal.name}</h3>
                        <span class="goal-priority ${goal.priority}">${goal.priority === 'high' ? 'عالي' : goal.priority === 'medium' ? 'متوسط' : 'منخفض'}</span>
                    </div>
                    
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${progress}%"></div>
                        </div>
                        <div class="goal-details">
                            <span>${this.utils.getGoalProgressText(goal.savedAmount, goal.targetAmount)}</span>
                            <span>${daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'منتهي'}</span>
                        </div>
                    </div>
                    
                    <div class="goal-actions">
                        <button class="btn-small add-to-goal" data-id="${goal.id}">
                            <i class="fas fa-plus"></i> إضافة مدخرات
                        </button>
                        <button class="btn-small edit-goal" data-id="${goal.id}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-small delete-goal" data-id="${goal.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                    
                    ${goal.notes ? `<p class="goal-notes">${goal.notes}</p>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.add-to-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.addToGoal(id);
            });
        });
        
        document.querySelectorAll('.edit-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.editGoal(id);
            });
        });
        
        document.querySelectorAll('.delete-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.deleteGoal(id);
            });
        });
    }

    addToGoal(goalId) {
        const goal = this.dataManager.getGoals().find(g => g.id === goalId);
        if (!goal) return;
        
        const remaining = goal.targetAmount - goal.savedAmount;
        const amountToAdd = prompt(`أدخل المبلغ الذي تريد إضافته (المتبقي: ${this.utils.formatCurrency(remaining)}):`, '');
        
        if (amountToAdd && !isNaN(amountToAdd) && parseFloat(amountToAdd) > 0) {
            const amount = parseFloat(amountToAdd);
            const newSavedAmount = goal.savedAmount + amount;
            
            if (newSavedAmount > goal.targetAmount) {
                this.utils.showMessage('المبلغ المدخر لا يمكن أن يكون أكبر من المبلغ المستهدف', 'error');
                return;
            }
            
            const updatedGoal = { ...goal, savedAmount: newSavedAmount };
            const success = this.dataManager.updateGoal(goalId, updatedGoal);
            
            if (success) {
                this.utils.showMessage(`تم إضافة ${this.utils.formatCurrency(amount)} إلى الهدف بنجاح!`, 'success');
                
                // إضافة معاملة مصروف للمدخرات
                if (amount > 0) {
                    const transaction = {
                        type: 'expense',
                        amount: amount,
                        description: `مدخرات لهدف: ${goal.name}`,
                        categoryId: 14, // فئة "أخرى"
                        date: this.utils.getCurrentDate(),
                        notes: `إضافة إلى هدف: ${goal.name}`
                    };
                    
                    this.dataManager.addTransaction(transaction);
                }
                
                this.loadGoals();
                this.updateFinancialSummary();
                
                if (this.currentTab === 'dashboard') {
                    this.loadGoalsPreview();
                }
            }
        }
    }

    editGoal(id) {
        this.openGoalModal(id);
    }

    deleteGoal(id) {
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
            const success = this.dataManager.deleteGoal(id);
            if (success) {
                this.utils.showMessage('تم حذف الهدف بنجاح!', 'success');
                this.loadGoals();
                
                if (this.currentTab === 'dashboard') {
                    this.loadGoalsPreview();
                }
            }
        }
    }

    // ========== الاستثمارات ==========
    loadInvestments() {
        const investments = this.dataManager.getInvestments();
        const container = document.getElementById('investments-container');
        
        if (investments.length === 0) {
            container.innerHTML = '<p class="empty-message">مافيش استثمارات. ابدأ بإضافة أول استثمار!</p>';
            return;
        }
        
        let html = '';
        investments.forEach(investment => {
            const expectedValue = investment.amount * (1 + (investment.expectedReturn / 100));
            const profit = expectedValue - investment.amount;
            
            html += `
                <div class="investment-card">
                    <div class="investment-header">
                        <h3>${investment.name}</h3>
                        <span class="investment-type">${this.getInvestmentTypeLabel(investment.type)}</span>
                    </div>
                    
                    <div class="investment-details">
                        <div class="investment-detail">
                            <span>قيمة الاستثمار:</span>
                            <span>${this.utils.formatCurrency(investment.amount)}</span>
                        </div>
                        <div class="investment-detail">
                            <span>العائد المتوقع:</span>
                            <span>${investment.expectedReturn}%</span>
                        </div>
                        <div class="investment-detail">
                            <span>القيمة المتوقعة:</span>
                            <span>${this.utils.formatCurrency(expectedValue)}</span>
                        </div>
                        <div class="investment-detail">
                            <span>الربح المتوقع:</span>
                            <span class="profit">${this.utils.formatCurrency(profit)}</span>
                        </div>
                        <div class="investment-detail">
                            <span>تاريخ البدء:</span>
                            <span>${this.utils.formatShortDate(investment.date)}</span>
                        </div>
                    </div>
                    
                    <div class="investment-actions">
                        <button class="btn-small edit-investment" data-id="${investment.id}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-small delete-investment" data-id="${investment.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                    
                    ${investment.notes ? `<p class="investment-notes">${investment.notes}</p>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.edit-investment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.editInvestment(id);
            });
        });
        
        document.querySelectorAll('.delete-investment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.deleteInvestment(id);
            });
        });
    }

    getInvestmentTypeLabel(type) {
        const labels = {
            'stocks': 'أسهم',
            'real-estate': 'عقار',
            'bank-deposit': 'وديعة بنكية',
            'gold': 'ذهب',
            'other': 'أخرى'
        };
        return labels[type] || type;
    }

    editInvestment(id) {
        this.openInvestmentModal(id);
    }

    deleteInvestment(id) {
        if (confirm('هل أنت متأكد من حذف هذا الاستثمار؟')) {
            const success = this.dataManager.deleteInvestment(id);
            if (success) {
                this.utils.showMessage('تم حذف الاستثمار بنجاح!', 'success');
                this.loadInvestments();
            }
        }
    }

    // ========== التقارير ==========
    loadReports() {
        // تهيئة تاريخ البدء والنهاية للتقرير
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        document.getElementById('report-start-date').value = this.utils.dateToInputFormat(startOfMonth);
        document.getElementById('report-end-date').value = this.utils.dateToInputFormat(endOfMonth);
    }

    generateReport() {
        const period = document.getElementById('report-period').value;
        let startDate, endDate;
        
        const now = new Date();
        
        switch(period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = new Date(document.getElementById('report-start-date').value);
                endDate = new Date(document.getElementById('report-end-date').value);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        // الحصول على المعاملات في النطاق الزمني
        const transactions = this.dataManager.getTransactions();
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
        
        // حساب الإيرادات والمصروفات
        let totalIncome = 0;
        let totalExpense = 0;
        const incomeByCategory = {};
        const expenseByCategory = {};
        
        filteredTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const categoryId = transaction.categoryId;
            const category = this.dataManager.getCategories().find(c => c.id == categoryId);
            const categoryName = category ? category.name : 'غير مصنف';
            
            if (transaction.type === 'income') {
                totalIncome += amount;
                incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + amount;
            } else {
                totalExpense += amount;
                expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + amount;
            }
        });
        
        // تحديث الرسوم البيانية
        this.updateIncomeExpenseChart(totalIncome, totalExpense);
        this.updateCategoryChart(expenseByCategory);
        
        // تحديث ملخص التقرير
        this.updateReportSummary({
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            startDate: this.utils.formatDate(startDate),
            endDate: this.utils.formatDate(endDate),
            transactionCount: filteredTransactions.length
        });
    }

    updateIncomeExpenseChart(income, expense) {
        const ctx = document.getElementById('income-expense-chart').getContext('2d');
        
        // إزالة الرسم البياني السابق إذا كان موجوداً
        if (this.charts.incomeExpenseChart) {
            this.charts.incomeExpenseChart.destroy();
        }
        
        this.charts.incomeExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['الإيرادات', 'المصروفات'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#4cc9f0', '#f72585'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.toLocaleString('ar-EG') + ' ج.م';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    updateCategoryChart(categoryData) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // إزالة الرسم البياني السابق إذا كان موجوداً
        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }
        
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        // إنشاء ألوان مختلفة لكل فئة
        const backgroundColors = [
            '#4361ee', '#7209b7', '#f72585', '#4cc9f0', 
            '#43aa8b', '#f8961e', '#ff9f1c', '#e71d36'
        ];
        
        this.charts.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.toLocaleString('ar-EG') + ' ج.م';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    updateReportSummary(summary) {
        const container = document.getElementById('report-summary-grid');
        
        const html = `
            <div class="summary-item">
                <span>الفترة الزمنية:</span>
                <span>${summary.startDate} إلى ${summary.endDate}</span>
            </div>
            <div class="summary-item">
                <span>عدد المعاملات:</span>
                <span>${summary.transactionCount}</span>
            </div>
            <div class="summary-item">
                <span>إجمالي الإيرادات:</span>
                <span class="income">${this.utils.formatCurrency(summary.totalIncome)}</span>
            </div>
            <div class="summary-item">
                <span>إجمالي المصروفات:</span>
                <span class="expense">${this.utils.formatCurrency(summary.totalExpense)}</span>
            </div>
            <div class="summary-item">
                <span>صافي الربح/الخسارة:</span>
                <span class="${summary.netBalance >= 0 ? 'income' : 'expense'}">
                    ${this.utils.formatCurrency(summary.netBalance)}
                </span>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // ========== استيراد البيانات ==========
    openImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (confirm('تحذير: استيراد البيانات سيتيح البيانات الحالية. هل تريد المتابعة؟')) {
                    this.dataManager.importData(file, (success, message) => {
                        if (success) {
                            this.utils.showMessage(message, 'success');
                            // إعادة تحميل التطبيق
                            this.init();
                            this.setActiveTab('dashboard');
                        } else {
                            this.utils.showMessage(message, 'error');
                        }
                    });
                }
            }
        };
        
        input.click();
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const app = new MizanatiApp();
});