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
        isSleeping: false,
        focusTime: 0,     // 本次专注时长（分钟）
        mood: 'neutral',  // 情绪标签：happy / neutral / sad
        interruptions: 0, // 中断次数
        affection: 0,     // 亲密度（无上限，长期陪伴见证）
        // ===== 专注星系统字段 =====
        stars: 0,              // 专注星总数
        dailyStars: 0,         // 当日已获专注星数
        lastDailyReset: 0,     // 上次每日重置的时间戳
        lastDailyLoginClaim: 0,// 上次领取登录奖励的时间戳
        isFocused: false,      // 是否处于专注状态
        focusBlocks: 0,        // 当前专注时段累计区块数（上限24）
        // =========================
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
    // 每项含 cost（专注星消耗），cost=0 为免费互动
    // 规则文档：docs/animallogicC.md
    actions: {
        // ─── 免费互动（每天各限 1 次，由 B 控制次数） ───
        pet_free: {
            label: '抚摸',
            effects: { affection: 1, happiness: 2 },
            cost: 0,
            xpReward: 3,
            message: '😊 暖暖的～'
        },
        greet: {
            label: '打招呼',
            effects: { happiness: 1 },
            cost: 0,
            xpReward: 2,
            message: '👋 它抬头看了你一眼'
        },
        // ─── 点数互动（消耗专注星） ───
        feed: {
            label: '喂食',
            effects: { hunger: 15 },
            cost: 3,
            xpReward: 15,
            message: '🍔 好吃～谢谢你！'
        },
        clean: {
            label: '洗澡',
            effects: { hygiene: 20 },
            cost: 3,
            xpReward: 12,
            message: '🧼 好干净！'
        },
        highfive: {
            label: '击掌',
            effects: { energy: 5, happiness: 3 },
            cost: 2,
            xpReward: 10,
            message: '✋ 啪！配合完美！'
        },
        cheer: {
            label: '加油',
            effects: { happiness: 5 },
            cost: 1,
            xpReward: 5,
            message: '💪 加油加油！'
        },
        pet_extra: {
            label: '抚摸（额外）',
            effects: { affection: 2, happiness: 3 },
            cost: 1,
            xpReward: 8,
            message: '🥰 它蹭了蹭你的手'
        },
        sleep: {
            label: '睡觉（快速充电）',
            effects: { energy: 20 },
            cost: 2,
            xpReward: 10,
            message: '😴 充能完毕！'
        }
    },

    // ===== 执行操作，返回新状态和消息 =====
    performAction: function (state, actionKey) {
        const action = this.actions[actionKey];
        if (!action) return { state, message: '未知操作' };

        // 检查专注星是否足够
        if (action.cost > 0 && state.stars < action.cost) {
            return { state, message: `⭐ 需要 ${action.cost} 专注星，当前不足` };
        }

        const newState = { ...state };
        const effects = action.effects;

        // 扣除专注星
        if (action.cost > 0) {
            newState.stars -= action.cost;
        }

        // 应用效果（亲密度无上限，其余属性 0-100）
        for (const [stat, delta] of Object.entries(effects)) {
            if (stat === 'affection') {
                newState[stat] = Math.max(0, (newState[stat] || 0) + delta);
            } else {
                newState[stat] = Math.max(0, Math.min(100, (newState[stat] || 0) + delta));
            }
        }

        // 经验奖励
        this.addXp(newState, action.xpReward);

        return { state: newState, message: action.message };
    },

    // ===== 倒计时衰减（每 tick 调用） =====
    // 采用小时级计算，确保小时间片也能正确累积
    // 衰减速率极慢，符合 animallogicC "不惩罚" 原则
    tick: function (state, minutes = 5) {
        const newState = { ...state };
        const hours = minutes / 60;

        if (!newState.isSleeping) {
            // 清醒时：极慢衰减
            // 饱食度：在线每小时 -2
            newState.hunger  = Math.max(0, Math.round(newState.hunger  - 2 * hours));
            // 精力：学习时跟随用户疲劳度，每小时 -5
            newState.energy  = Math.max(0, Math.round(newState.energy  - 5 * hours));
            // 清洁度：在线每小时 -1
            newState.hygiene = Math.max(0, Math.round(newState.hygiene - 1 * hours));
            // 快乐度：不自动下降
        } else {
            // 睡觉时：精力恢复，其它衰减减半
            newState.energy  = Math.min(100, Math.round(newState.energy + 10 * hours));
            newState.hunger  = Math.max(0, Math.round(newState.hunger  - 1 * hours));
            newState.hygiene = Math.max(0, Math.round(newState.hygiene - 0.5 * hours));
            // 快乐度：不自动下降
        }

        return newState;
    },

    // ===== 检查是否需要警告消息 =====
    // 注意：仅通过视觉微动传递，不弹文字（由 B 控制是否展示）
    getWarning: function (state) {
        if (state.hunger < 20) return '🍔 我好饿……';
        if (state.hygiene < 20) return '🧹 该洗澡了……';
        if (state.energy < 20) return '😴 好累啊……';
        if (state.happiness < 20) return '😢 陪我玩会儿吧……';
        return null;
    },

    // =================================================================
    //  专注星系统
    //  规则文档：docs/animallogicC.md
    //  B 调用以下方法，C 实现内部算法
    // =================================================================

    // ===== 内部：检查并重置每日数据 =====
    _checkDailyReset: function (state) {
        const today = new Date().toDateString();
        const lastReset = state.lastDailyReset ? new Date(state.lastDailyReset).toDateString() : null;
        if (today !== lastReset) {
            state.dailyStars = 0;
            state.lastDailyReset = Date.now();
        }
        return state;
    },

    // ===== 每日首次登录奖励（规则六） =====
    // B 在页面加载/初始化时调用
    // 返回 { state, message: string|null, claimed: boolean }
    claimDailyLogin: function (state) {
        const today = new Date().toDateString();
        const lastClaim = state.lastDailyLoginClaim
            ? new Date(state.lastDailyLoginClaim).toDateString()
            : null;

        if (today !== lastClaim) {
            state.lastDailyLoginClaim = Date.now();
            this._checkDailyReset(state);
            const remaining = 80 - state.dailyStars;
            const award = Math.min(2, remaining);
            state.stars += award;
            state.dailyStars += award;
            return { state, message: `🌅 今日首次登录，获得 ${award} 专注星！`, claimed: true };
        }
        return { state, message: null, claimed: false };
    },

    // ===== 进入专注状态（规则一、二） =====
    // B 检测到用户满足"可见 + 90秒内有操作"时调用
    enterFocus: function (state) {
        if (!state.isFocused) {
            state.isFocused = true;
        }
        return state;
    },

    // ===== 离开专注状态，结算专注星（规则二、四） =====
    // B 检测到用户连续非专注 ≥ 120秒时调用
    // 返回 { state, message: string|null, starsEarned: number }
    leaveFocus: function (state) {
        if (!state.isFocused || state.focusBlocks === 0) {
            state.isFocused = false;
            state.focusBlocks = 0;
            return { state, message: null, starsEarned: 0 };
        }

        const blocks = state.focusBlocks;

        // 结算：前3块每块2星，之后每块1星（规则四）
        let earned = 0;
        if (blocks <= 3) {
            earned = blocks * 2;
        } else {
            earned = 6 + (blocks - 3) * 1;
        }

        // 每日上限保护（规则五）
        this._checkDailyReset(state);
        const remaining = 80 - state.dailyStars;
        earned = Math.min(earned, remaining);

        state.stars += earned;
        state.dailyStars += earned;
        state.focusBlocks = 0;
        state.isFocused = false;

        const message = earned > 0
            ? `✨ 专注时段结束，获得 ${earned} 专注星！`
            : null;
        return { state, message, starsEarned: earned };
    },

    // ===== 专注区块计时（规则三） =====
    // B 在每5分钟的 doTick 中同步调用
    // 若当前专注中，累加1个区块；达到24块自动结算
    // 返回 { state, message: string|null }
    tickFocus: function (state) {
        if (!state.isFocused) {
            return { state, message: null };
        }

        state.focusBlocks += 1;

        // 达到24区块（120分钟），自动结算（规则五）
        if (state.focusBlocks >= 24) {
            return this.leaveFocus(state);
        }

        return { state, message: null };
    },

    // ===== 获取专注星信息（B 可用于 UI 展示） =====
    getStarsInfo: function (state) {
        this._checkDailyReset(state);
        return {
            stars: state.stars,
            dailyStars: state.dailyStars,
            dailyRemaining: Math.max(0, 80 - state.dailyStars),
            sessionBlocks: state.isFocused ? state.focusBlocks : 0
        };
    }
};