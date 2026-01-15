// auto-sync.js - إضافة المزامنة التلقائية بدون تعديل الملفات القديمة

class AutoSyncManager {
    constructor() {
        this.userId = this.getUserId();
        this.syncInterval = null;
        this.lastSync = localStorage.getItem('last_sync') || 0;
        this.init();
    }
    
    getUserId() {
        let id = localStorage.getItem('mizanati_user_id');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mizanati_user_id', id);
        }
        return id;
    }
    
    init() {
        // 1. استمع لحفظ البيانات في localStorage
        this.setupLocalStorageListener();
        
        // 2. بدء المزامنة التلقائية
        this.startAutoSync();
        
        // 3. جلب البيانات من السحابة عند البدء
        setTimeout(() => this.syncFromCloud(), 2000);
        
        console.log('✅ AutoSync Manager initialized for user:', this.userId);
    }
    
    setupLocalStorageListener() {
        // مراقبة تغيرات localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            // إذا كان التغيير لبيانات ميزانتي
            if (key.includes('mizanati')) {
                window.dispatchEvent(new CustomEvent('mizanatiDataChanged', {
                    detail: { key, value }
                }));
            }
        };
        
        // استمع للتغيرات
        window.addEventListener('mizanatiDataChanged', (e) => {
            this.onDataChanged(e.detail.key, e.detail.value);
        });
    }
    
    onDataChanged(key, value) {
        console.log('📝 Data changed:', key);
        this.syncToCloud();
    }
    
    async syncToCloud() {
        try {
            // جمع جميع بيانات ميزانتي
            const allData = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('mizanati')) {
                    allData[key] = JSON.parse(localStorage.getItem(key));
                }
            }
            
            // إضافة معلومات المستخدم والوقت
            const syncData = {
                userId: this.userId,
                data: allData,
                timestamp: new Date().toISOString(),
                device: navigator.userAgent
            };
            
            // حفظ في GitHub Gist (أو أي خدمة)
            await this.saveToGitHubGist(syncData);
            
            this.lastSync = Date.now();
            localStorage.setItem('last_sync', this.lastSync);
            
            this.showSyncStatus('✅ تم المزامنة: ' + new Date().toLocaleTimeString('ar-EG'));
            
        } catch (error) {
            console.warn('❌ Sync failed:', error);
            this.showSyncStatus('⚠️ فشل المزامنة، سيتم المحاولة لاحقاً');
        }
    }
    
    async saveToGitHubGist(data) {
        // محاولة GitHub Gist أولاً
        const token = localStorage.getItem('github_token');
        
        if (token) {
            return await this.saveToGitHub(token, data);
        }
        
        // إذا مافيش token، استخدم Pastebin البديل
        return await this.saveToPastebin(data);
    }
    
    async saveToGitHub(token, data) {
        const gistId = localStorage.getItem('github_gist_id');
        
        const gistData = {
            description: `Mizanati Sync - ${this.userId}`,
            public: false,
            files: {
                'mizanati_sync.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };
        
        const url = gistId 
            ? `https://api.github.com/gists/${gistId}`
            : 'https://api.github.com/gists';
        
        const method = gistId ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistData)
        });
        
        const result = await response.json();
        
        if (result.id && !gistId) {
            localStorage.setItem('github_gist_id', result.id);
        }
        
        return result;
    }
    
    async saveToPastebin(data) {
        // استخدام Pastebin كبديل مجاني
        const pastebinKey = 'your_pastebin_api_key_here'; // يمكنك الحصول عليه مجاناً
        const pasteData = new URLSearchParams({
            api_dev_key: pastebinKey,
            api_option: 'paste',
            api_paste_code: JSON.stringify(data),
            api_paste_name: `mizanati_${this.userId}`,
            api_paste_private: '1',
            api_paste_expire_date: '1M'
        });
        
        const response = await fetch('https://pastebin.com/api/api_post.php', {
            method: 'POST',
            body: pasteData
        });
        
        const text = await response.text();
        
        if (text.includes('https://pastebin.com/')) {
            localStorage.setItem('pastebin_url', text);
            return { success: true, url: text };
        }
        
        throw new Error('Failed to save to Pastebin');
    }
    
    async syncFromCloud() {
        try {
            const token = localStorage.getItem('github_token');
            const gistId = localStorage.getItem('github_gist_id');
            
            if (token && gistId) {
                const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                    headers: {
                        'Authorization': `token ${token}`
                    }
                });
                
                if (response.ok) {
                    const gist = await response.json();
                    const content = gist.files['mizanati_sync.json'].content;
                    const cloudData = JSON.parse(content);
                    
                    // إذا كانت البيانات من نفس المستخدم وأحدث
                    if (cloudData.userId === this.userId) {
                        this.mergeData(cloudData.data);
                    }
                }
            }
        } catch (error) {
            console.log('No cloud data available');
        }
    }
    
    mergeData(cloudData) {
        let updated = false;
        
        for (const [key, value] of Object.entries(cloudData)) {
            const localData = localStorage.getItem(key);
            const localParsed = localData ? JSON.parse(localData) : null;
            
            // دمج البيانات، الأحدث يفوز
            if (!localParsed || (value._timestamp > localParsed._timestamp)) {
                localStorage.setItem(key, JSON.stringify(value));
                updated = true;
            }
        }
        
        if (updated) {
            this.showSyncStatus('📥 تم تحديث البيانات من السحابة');
            setTimeout(() => location.reload(), 1000);
        }
    }
    
    startAutoSync() {
        // مزامنة كل 5 دقائق
        this.syncInterval = setInterval(() => {
            this.syncToCloud();
        }, 5 * 60 * 1000);
        
        // مزامنة عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            this.syncToCloud();
        });
        
        console.log('🔄 AutoSync started (every 5 minutes)');
    }
    
    showSyncStatus(message) {
        // إنشاء أو تحديث شريط الحالة
        let statusBar = document.getElementById('auto-sync-status');
        
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'auto-sync-status';
            statusBar.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            document.body.appendChild(statusBar);
        }
        
        statusBar.innerHTML = `🔄 ${message}`;
        statusBar.style.display = 'block';
        
        // إخفاء بعد 3 ثواني
        setTimeout(() => {
            statusBar.style.display = 'none';
        }, 3000);
    }
    
    // واجهة المستخدم البسيطة
    createSyncButton() {
        const button = document.createElement('button');
        button.innerHTML = '☁️ مزامنة تلقائية';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #4361ee;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        `;
        
        button.onclick = () => {
            this.syncToCloud();
            button.innerHTML = '🔄 جاري المزامنة...';
            setTimeout(() => {
                button.innerHTML = '☁️ مزامنة تلقائية';
            }, 2000);
        };
        
        document.body.appendChild(button);
    }
}

// إضافة زر GitHub Token
function addGitHubSetup() {
    if (!document.getElementById('github-setup-btn')) {
        const btn = document.createElement('button');
        btn.id = 'github-setup-btn';
        btn.innerHTML = '🔑 إعداد GitHub Token';
        btn.style.cssText = `
            position: fixed;
            bottom: 70px;
            left: 20px;
            background: #333;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            z-index: 9999;
        `;
        
        btn.onclick = () => {
            const token = prompt('أدخل GitHub Token (من https://github.com/settings/tokens):');
            if (token && token.startsWith('ghp_')) {
                localStorage.setItem('github_token', token);
                alert('✅ تم حفظ التوكن! سيبدأ المزامنة التلقائية.');
                location.reload();
            } else {
                alert('❌ التوكن غير صالح. يجب أن يبدأ بـ ghp_');
            }
        };
        
        document.body.appendChild(btn);
    }
}

// تشغيل النظام
window.addEventListener('DOMContentLoaded', () => {
    const autoSync = new AutoSyncManager();
    autoSync.createSyncButton();
    addGitHubSetup();
    
    // جعل النظام متاحاً في الكونسول
    window.autoSync = autoSync;
    
    console.log('🎉 AutoSync system loaded successfully!');
    console.log('Commands:');
    console.log('- autoSync.syncToCloud()  // مزامنة يدوية');
    console.log('- autoSync.syncFromCloud() // جلب من السحابة');
});