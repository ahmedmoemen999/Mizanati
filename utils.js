// ملف utils.js - الدوال المساعدة

class Utils {
    constructor() {
        this.dataManager = dataManager;
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('ar-EG', options);
    }

    // تنسيق التاريخ بشكل مختصر
    formatShortDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('ar-EG', options);
    }

    // تنسيق المبالغ المالية
    formatCurrency(amount) {
        return `${parseFloat(amount).toFixed(2)} ج.م`;
    }

    // تحويل التاريخ إلى صيغة YYYY-MM-DD
    dateToInputFormat(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // الحصول على التاريخ الحالي بصيغة YYYY-MM-DD
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    // إضافة أيام إلى تاريخ
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // التحقق من تاريخ الاستحقاق
    getDueStatus(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const timeDiff = due.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            return { status: 'overdue', days: Math.abs(daysDiff), text: 'متأخر' };
        } else if (daysDiff <= 7) {
            return { status: 'pending', days: daysDiff, text: 'قريب' };
        } else {
            return { status: 'future', days: daysDiff, text: 'مستقبلي' };
        }
    }

    // إنشاء معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ترتيب المعاملات حسب التاريخ (الأحدث أولاً)
    sortTransactionsByDate(transactions) {
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // ترشيح المعاملات
    filterTransactions(transactions, filters) {
        let filtered = [...transactions];
        
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(t => t.type === filters.type);
        }
        
        if (filters.date) {
            filtered = filtered.filter(t => t.date === filters.date);
        }
        
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(t => t.categoryId == filters.category);
        }
        
        if (filters.startDate && filters.endDate) {
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= new Date(filters.startDate) && 
                       transactionDate <= new Date(filters.endDate);
            });
        }
        
        return this.sortTransactionsByDate(filtered);
    }

    // الحصول على أسماء الأشهر بالعربية
    getArabicMonth(monthIndex) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return months[monthIndex];
    }

    // إنشاء تسمية للفئة بناء على النوع
    getCategoryLabel(type) {
        const labels = {
            'income': 'إيراد',
            'expense': 'مصروف'
        };
        return labels[type] || type;
    }

    // إنشاء تسمية لحالة الدين/القسط
    getDebtStatusLabel(status) {
        const labels = {
            'paid': 'مسدد',
            'pending': 'معلق',
            'overdue': 'متأخر'
        };
        return labels[status] || status;
    }

    // الحصول على لون بناء على النوع
    getTypeColor(type) {
        const colors = {
            'income': '#4cc9f0',
            'expense': '#f72585',
            'paid': '#43aa8b',
            'pending': '#f8961e',
            'overdue': '#f72585'
        };
        return colors[type] || '#6c757d';
    }

    // حساب التقدم نحو الهدف
    calculateGoalProgress(saved, target) {
        const progress = (saved / target) * 100;
        return Math.min(progress, 100);
    }

    // إنشاء نص تقدم للهدف
    getGoalProgressText(saved, target) {
        const progress = this.calculateGoalProgress(saved, target);
        return `${progress.toFixed(1)}% (${this.formatCurrency(saved)} من ${this.formatCurrency(target)})`;
    }

    // التحقق من صحة الإدخال
    validateInput(input, type) {
        if (!input && type !== 'optional') {
            return { isValid: false, message: 'هذا الحقل مطلوب' };
        }
        
        if (type === 'number') {
            const num = parseFloat(input);
            if (isNaN(num) || num < 0) {
                return { isValid: false, message: 'يرجى إدخال رقم صحيح موجب' };
            }
        }
        
        if (type === 'date') {
            const date = new Date(input);
            if (isNaN(date.getTime())) {
                return { isValid: false, message: 'يرجى إدخال تاريخ صحيح' };
            }
        }
        
        return { isValid: true, message: '' };
    }

    // عرض رسالة للمستخدم
    showMessage(message, type = 'info') {
        // إزالة أي رسالة سابقة
        const existingMessage = document.querySelector('.user-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // إنشاء عنصر الرسالة
        const messageElement = document.createElement('div');
        messageElement.className = `user-message ${type}`;
        messageElement.textContent = message;
        
        // إضافة الرسالة إلى الصفحة
        document.body.appendChild(messageElement);
        
        // إضافة تنسيقات للرسالة
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            messageElement.style.backgroundColor = '#43aa8b';
        } else if (type === 'error') {
            messageElement.style.backgroundColor = '#f72585';
        } else if (type === 'warning') {
            messageElement.style.backgroundColor = '#f8961e';
        } else {
            messageElement.style.backgroundColor = '#4361ee';
        }
        
        // إزالة الرسالة بعد 5 ثواني
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // إضافة أنيميشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// إنشاء مثيل من الأدوات المساعدة
const utils = new Utils();