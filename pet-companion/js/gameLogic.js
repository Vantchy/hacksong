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
        // ===== 学习历史记录 =====
        history: [],       // 历次专注学习记录，每项 { date, startTime, focusTime, mood, interruptions, focusBlocks, starsEarned }
        // ===== 倒计时字段 =====
        countdown: 0,      // 倒计时剩余秒数，0 表示未在倒计时中
        // ===== 每日目标字段 =====
        dailyGoalCompleted: 0, // 上次完成自定学习目标的时间戳，0 表示未完成
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

    // ===== 亲密度里程碑加成 =====
    // 亲密度越高，互动效果越强（里程碑逐渐稀疏）
    // 0-9: 1.0x  |  10-24: 1.1x  |  25-49: 1.2x  |  50-99: 1.35x  |  100-199: 1.5x  |  200+: 1.75x
    getAffectionBonus: function (state) {
        const a = state.affection || 0;
        if (a < 10) return 1.0;
        if (a < 25) return 1.1;
        if (a < 50) return 1.2;
        if (a < 100) return 1.35;
        if (a < 200) return 1.5;
        return 1.75;
    },

    // ===== 亲密度行为阶段（用于 A/B 切换宠物形态/动画） =====
    // 返回当前所处的行为阶段标识，方便 B 根据阶段切换 CSS class
    // 阶段定义与 animallogicC.md 亲密度里程碑示例一致
    // 返回值: 'newbie' | 'familiar' | 'intimate' | 'bestie' | 'forever'
    getAffectionStage: function (state) {
        const a = state.affection || 0;
        if (a < 100) return 'newbie';      // 0-100   新手期
        if (a < 300) return 'familiar';    // 100-300 熟悉期
        if (a < 600) return 'intimate';    // 300-600 亲密期
        if (a < 1000) return 'bestie';     // 600-1000 挚友期
        return 'forever';                   // 1000+   永恒
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

        // 亲密度里程碑加成
        const bonus = this.getAffectionBonus(state);

        // 应用效果（亲密度无上限，其余属性 0-100）
        for (const [stat, delta] of Object.entries(effects)) {
            const scaledDelta = Math.round(delta * bonus);
            if (stat === 'affection') {
                newState[stat] = Math.max(0, (newState[stat] || 0) + scaledDelta);
            } else {
                newState[stat] = Math.max(0, Math.min(100, (newState[stat] || 0) + scaledDelta));
            }
        }

        // 经验奖励 = 消耗专注星 × 5
        this.addXp(newState, action.cost * 5);

        return { state: newState, message: action.message };
    },

    // ===== 画像数据采集方法 =====
    // addFocusTime: 累加专注时长（分钟）
    addFocusTime: function (state, minutes) {
        const newState = { ...state };
        newState.focusTime = (newState.focusTime || 0) + minutes;
        return newState;
    },

    // recordMood: 记录学习结束后的情绪标签
    recordMood: function (state, mood) {
        const validMoods = ['happy', 'neutral', 'sad'];
        if (!validMoods.includes(mood)) return state;
        const newState = { ...state };
        newState.mood = mood;
        return newState;
    },

    // addInterruption: 记录一次中断
    addInterruption: function (state) {
        const newState = { ...state };
        newState.interruptions = (newState.interruptions || 0) + 1;
        return newState;
    },

    // recordSession: 专注学习结束后，记录本次完整学习记录
    // data 字段：{ focusTime, mood, interruptions, focusBlocks, starsEarned }
    // 最多保留最近 100 条，防止 localStorage 膨胀
    recordSession: function (state, data) {
        const newState = { ...state };
        const history = (newState.history || []).slice();
        history.push({
            date: new Date().toISOString().slice(0, 10),  // '2026-08-31'
            startTime: Date.now(),
            focusTime: data.focusTime || 0,
            mood: data.mood || 'neutral',
            interruptions: data.interruptions || 0,
            focusBlocks: data.focusBlocks || 0,
            starsEarned: data.starsEarned || 0
        });
        // 保留最近 100 条
        if (history.length > 100) history.splice(0, history.length - 100);
        newState.history = history;
        newState.focusTime = 0;   // 本次专注时长归零，等待下次
        newState.interruptions = 0;
        return newState;
    },

    // ===== 画像分析 =====
    // getAnalysis: 基于历史学习记录生成画像分析数据
    // 返回对象包含：总览统计、情绪分布、最佳时段、连续学习天数等
    getAnalysis: function (state) {
        const history = state.history || [];
        const total = history.length;
        if (total === 0) {
            return {
                totalSessions: 0,
                totalFocusTime: 0,
                totalStarsEarned: 0,
                avgFocusTime: 0,
                avgInterruptions: 0,
                moodDistribution: { happy: 0, neutral: 0, sad: 0 },
                bestHour: null,
                streakDays: 0,
                recentDays: 0
            };
        }

        let totalFocusTime = 0;
        let totalStarsEarned = 0;
        let totalInterruptions = 0;
        const moodCount = { happy: 0, neutral: 0, sad: 0 };
        const hourCount = {};  // 各时段学习次数

        // 收集日期集合用于计算连续天数
        const dateSet = new Set();

        for (const rec of history) {
            totalFocusTime += rec.focusTime || 0;
            totalStarsEarned += rec.starsEarned || 0;
            totalInterruptions += rec.interruptions || 0;
            if (rec.mood && moodCount[rec.mood] !== undefined) moodCount[rec.mood]++;

            // 时段分析：根据 startTime 提取小时
            if (rec.startTime) {
                const hour = new Date(rec.startTime).getHours();
                const hourKey = String(hour).padStart(2, '0') + ':00';
                hourCount[hourKey] = (hourCount[hourKey] || 0) + 1;
            }

            if (rec.date) dateSet.add(rec.date);
        }

        // 最佳时段：出现次数最多的时段
        let bestHour = null;
        let bestHourCount = 0;
        for (const [hour, count] of Object.entries(hourCount)) {
            if (count > bestHourCount) {
                bestHourCount = count;
                bestHour = hour;
            }
        }

        // 连续学习天数（从最近一次往前数）
        let streakDays = 0;
        const sortedDates = [...dateSet].sort((a, b) => b.localeCompare(a)); // 降序
        if (sortedDates.length > 0) {
            const today = new Date();
            // 取最近一条记录日期作为基准
            const lastDate = new Date(sortedDates[0]);
            const diffMs = today - lastDate;
            const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            // 如果最近一次学习在 2 天内，才计算连续
            if (diffDays <= 2) {
                streakDays = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const prev = new Date(sortedDates[i - 1]);
                    const curr = new Date(sortedDates[i]);
                    const gap = (prev - curr) / (24 * 60 * 60 * 1000);
                    if (gap <= 1.5) {
                        streakDays++;
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            totalSessions: total,
            totalFocusTime: totalFocusTime,
            totalStarsEarned: totalStarsEarned,
            avgFocusTime: Math.round(totalFocusTime / total),
            avgInterruptions: Math.round((totalInterruptions / total) * 10) / 10,
            moodDistribution: moodCount,
            bestHour: bestHour,
            streakDays: streakDays,
            recentDays: dateSet.size
        };
    },

    // ===== 倒计时逻辑 =====
    // startCountdown: 启动倒计时（秒），B 在"深呼吸"按钮点击时调用
    startCountdown: function (state, seconds) {
        if (seconds <= 0) return state;
        const newState = { ...state };
        newState.countdown = seconds;
        return newState;
    },

    // tickCountdown: 每秒递减一次，返回 { state, finished } 便于 B 判断是否结束
    tickCountdown: function (state) {
        if (!state.countdown || state.countdown <= 0) {
            return { state, finished: false };
        }
        const newState = { ...state };
        newState.countdown = newState.countdown - 1;
        return { state: newState, finished: newState.countdown <= 0 };
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
    // B 在用户写下学习意图时调用（而非页面加载时）
    // hasWrittenIntention: B 传入 true 表示用户已写下意图，否则不发放奖励
    // 返回 { state, message: string|null, claimed: boolean }
    claimDailyLogin: function (state, hasWrittenIntention = false) {
        const today = new Date().toDateString();
        const lastClaim = state.lastDailyLoginClaim
            ? new Date(state.lastDailyLoginClaim).toDateString()
            : null;

        // 今日已领取过，不再重复发放
        if (today === lastClaim) {
            return { state, message: null, claimed: false };
        }

        // 未写下意图，提示用户先写意图
        if (!hasWrittenIntention) {
            return { state, message: '📝 先写下今天的学习目标吧！', claimed: false };
        }

        // 写下意图后发放奖励
        state.lastDailyLoginClaim = Date.now();
        this._checkDailyReset(state);
        const remaining = 80 - state.dailyStars;
        const award = Math.min(2, remaining);
        state.stars += award;
        state.dailyStars += award;
        return { state, message: `🌅 写下目标，获得 ${award} 专注星！`, claimed: true };
    },

    // ===== 完成自定学习目标奖励（规则九） =====
    // B 在用户标记"目标已完成"时调用，每天限 1 次，奖励 3 专注星
    // 返回 { state, message: string|null, claimed: boolean }
    claimDailyGoal: function (state) {
        const today = new Date().toDateString();
        const lastDone = state.dailyGoalCompleted
            ? new Date(state.dailyGoalCompleted).toDateString()
            : null;

        // 今日已完成过，不再重复奖励
        if (today === lastDone) {
            return { state, message: null, claimed: false };
        }

        // 发放奖励
        state.dailyGoalCompleted = Date.now();
        this._checkDailyReset(state);
        const remaining = 80 - state.dailyStars;
        const award = Math.min(3, remaining);
        state.stars += award;
        state.dailyStars += award;
        return { state, message: `🎯 完成今日目标，获得 ${award} 专注星！`, claimed: true };
    },

    // ===== 专注星软上限（规则八） =====
    // getStarsRate: 根据总星数返回当前获取倍率
    // 总星数 < 100: 100%  |  < 200: 75%  |  < 300: 50%  |  >= 300: 30%
    getStarsRate: function (state) {
        const total = state.stars || 0;
        if (total < 100) return 1.0;
        if (total < 200) return 0.75;
        if (total < 300) return 0.5;
        return 0.3;
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

        // 软上限：根据总星数降低获取速率（规则八）
        earned = Math.floor(earned * this.getStarsRate(state));

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