/**
 * storage.js — 数据持久化
 * 负责：localStorage 读写、存档管理
 */

const Storage = {
    STORAGE_KEY: 'pet_companion_save',

    // ===== 保存存档 =====
    save: function (state) {
        try {
            const data = {
                ...state,
                savedAt: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    },

    // ===== 读取存档 =====
    load: function () {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            // 基本校验
            if (!data || typeof data.level !== 'number') return null;
            return data;
        } catch (e) {
            console.error('读档失败:', e);
            return null;
        }
    },

    // ===== 删除存档 =====
    clear: function () {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    // ===== 检查是否有存档 =====
    hasSave: function () {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    // ===== 获取存档时间（用于显示） =====
    getSaveTime: function () {
        const data = this.load();
        if (!data || !data.savedAt) return null;
        return new Date(data.savedAt).toLocaleString('zh-CN');
    }
};