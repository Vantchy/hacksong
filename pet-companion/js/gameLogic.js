/**
 * gameLogic.js — 算法与规则
 * 负责：宠物状态管理、等级成长、经验计算、倒计时逻辑
 */

const GameLogic = {
    // ===== 默认初始状态 =====
    defaultState: {
        name: '小宠物',
        level: 1,
        xp: 0,
        age: 0,           // 总存活天数
        hunger: 80,       // 饱食度 0-100
        happiness: 70,    // 快乐度 0-100
        energy: 90,       // 精力 0-100
        hygiene: 60,      // 清洁度 0-100
        health: 100,      // 健康值 0-100
        isSleeping: false,
        focusTime: 0,     // 本次专注时长（分钟）
        mood: 'neutral',  // 情绪标签：happy / neutral / sad
        interruptions: 0, // 中断次数
        createdAt: Date.now()
    },

    // ===== 经验公式 =====
    xpForLevel: function (level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    },

    // ===== 等级提升 =====
    addXp: function (state, amount) {
        state.xp += amount;
        let xpNeeded = this.xpForLevel(state.level);
        while (state.xp >= xpNeeded) {
            state.xp -= xpNeeded;
            state.level += 1;
            xpNeeded = this.xpForLevel(state.level);
        }
        return state.level;
    },

    // ===== 各操作的效果 =====
    actions: {
        feed: {
            label: '喂食',
            effects: { hunger: 20, happiness: 5, energy: 5 },
            xpReward: 15,
            message: '🍔 好吃～谢谢你！'
        },
        play: {
            label: '玩耍',
            effects: { happiness: 25, energy: -15, hunger: -5 },
            xpReward: 20,
            message: '🎉 好开心呀！'
        },
        sleep: {
            label: '睡觉',
            effects: { energy: 30, happiness: 5, hunger: -3 },
            xpReward: 10,
            message: '😴 晚安～'
        },
        clean: {
            label: '洗澡',
            effects: { hygiene: 30, happiness: 5, energy: -5 },
            xpReward: 12,
            message: '🧼 好干净！'
        },
        heal: {
            label: '治疗',
            effects: { health: 30, happiness: -5, energy: -10 },
            xpReward: 18,
            message: '💊 感觉好多了！'
        }
    },

    // ===== 执行操作，返回新状态和消息 =====
    performAction: function (state, actionKey) {
        const action = this.actions[actionKey];
        if (!action) return { state, message: '未知操作' };

        const newState = { ...state };
        const effects = action.effects;

        for (const [stat, delta] of Object.entries(effects)) {
            newState[stat] = Math.max(0, Math.min(100, (newState[stat] || 0) + delta));
        }

        // 睡觉特殊处理：切换状态
        if (actionKey === 'sleep') {
            newState.isSleeping = !newState.isSleeping;
        }

        // 经验奖励
        this.addXp(newState, action.xpReward);

        return { state: newState, message: action.message };
    },

    // ===== 倒计时衰减（每 tick 调用） =====
    tick: function (state, minutes = 5) {
        const newState = { ...state };
        const factor = minutes / 5; // 以 5 分钟为基准

        if (!newState.isSleeping) {
            newState.hunger    = Math.max(0, newState.hunger    - Math.round(3 * factor));
            newState.happiness = Math.max(0, newState.happiness - Math.round(2 * factor));
            newState.energy    = Math.max(0, newState.energy    - Math.round(4 * factor));
            newState.hygiene   = Math.max(0, newState.hygiene   - Math.round(2 * factor));
        } else {
            // 睡觉时精力恢复，其它衰减减半
            newState.energy    = Math.min(100, newState.energy + Math.round(5 * factor));
            newState.hunger    = Math.max(0, newState.hunger    - Math.round(1 * factor));
            newState.happiness = Math.max(0, newState.happiness - Math.round(1 * factor));
            newState.hygiene   = Math.max(0, newState.hygiene   - Math.round(1 * factor));
        }

        // 健康值受其它属性影响
        const lowStats = [newState.hunger, newState.happiness, newState.energy, newState.hygiene]
            .filter(v => v < 30).length;
        newState.health = Math.max(0, newState.health - lowStats * 2 * factor);

        // 如果健康值归零，自动重置（宠物不会死亡）
        if (newState.health <= 0) {
            return this.defaultState;
        }

        return newState;
    },

    // ===== 检查是否需要警告消息 =====
    getWarning: function (state) {
        if (state.hunger < 20) return '🍔 我好饿……';
        if (state.hygiene < 20) return '🧹 该洗澡了……';
        if (state.energy < 20) return '😴 好累啊……';
        if (state.happiness < 20) return '😢 陪我玩会儿吧……';
        if (state.health < 30) return '💊 不太舒服……';
        return null;
    }
};