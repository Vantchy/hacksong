/**
 * C 单元测试 — Node.js 版
 * 测试 gameLogic.js 的全部功能
 * 运行: node tests/test_c_node.js
 */

// 模拟浏览器环境（gameLogic.js 需要）
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// 用 vm 执行 gameLogic.js，使其中的 const GameLogic 变为全局可访问
const codePath = path.join(__dirname, '..', 'js', 'gameLogic.js');
const code = fs.readFileSync(codePath, 'utf-8');
vm.runInThisContext(code, codePath);

// ===== 简易测试框架 =====
let total = 0, passed = 0, failed = 0;
const failures = [];

function assert(condition, msg) {
    total++;
    if (condition) {
        passed++;
        console.log(`  ✓ ${msg}`);
    } else {
        failed++;
        failures.push(msg);
        console.log(`  ✗ ${msg}`);
    }
}

function assertEqual(actual, expected, msg) {
    const ok = actual === expected;
    if (!ok) {
        assert(false, `${msg} → 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
    } else {
        assert(true, msg);
    }
}

function assertDeepEqual(actual, expected, msg) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) {
        assert(false, `${msg} → 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
    } else {
        assert(true, msg);
    }
}

function group(name, fn) {
    console.log(`\n=== ${name} ===`);
    fn();
}

// ===================================================================
//  测试套件
// ===================================================================

// ─── 1. defaultState ───
group('defaultState - 默认初始状态', () => {
    const s = { ...GameLogic.defaultState };

    assertEqual(s.name, '小宠物', 'name 默认值正确');
    assertEqual(s.level, 1, 'level 默认值正确');
    assertEqual(s.xp, 0, 'xp 默认值正确');
    assertEqual(s.age, 0, 'age 默认值正确');
    assertEqual(s.hunger, 80, 'hunger 默认值正确');
    assertEqual(s.happiness, 70, 'happiness 默认值正确');
    assertEqual(s.energy, 90, 'energy 默认值正确');
    assertEqual(s.hygiene, 60, 'hygiene 默认值正确');
    assertEqual(s.isSleeping, false, 'isSleeping 默认 false');
    assertEqual(s.focusTime, 0, 'focusTime 默认值正确');
    assertEqual(s.mood, 'neutral', 'mood 默认值正确');
    assertEqual(s.interruptions, 0, 'interruptions 默认值正确');
    assertEqual(s.affection, 0, 'affection 默认值正确');
    assert(Array.isArray(s.history) && s.history.length === 0, 'history 为空数组');
    assertEqual(s.countdown, 0, 'countdown 默认值正确');
    assertEqual(s.dailyGoalCompleted, 0, 'dailyGoalCompleted 默认值正确');
    assertEqual(s.stars, 0, 'stars 默认值正确');
    assertEqual(s.dailyStars, 0, 'dailyStars 默认值正确');
    assertEqual(s.isFocused, false, 'isFocused 默认 false');
    assertEqual(s.focusBlocks, 0, 'focusBlocks 默认值正确');
    assert(s.createdAt > 0, 'createdAt 有效时间戳');
    assertEqual(s.health, undefined, 'health 字段已移除');
});

// ─── 2. xpForLevel ───
group('xpForLevel - 经验公式', () => {
    assertEqual(GameLogic.xpForLevel(1), 100, 'Lv1 需要 100 经验');
    assertEqual(GameLogic.xpForLevel(2), Math.floor(100 * Math.pow(1.15, 1)), 'Lv2 公式正确');
    assertEqual(GameLogic.xpForLevel(5), Math.floor(100 * Math.pow(1.15, 4)), 'Lv5 公式正确');
    assert(GameLogic.xpForLevel(1) < GameLogic.xpForLevel(2), '等级越高所需经验越多');
});

// ─── 3. addXp ───
group('addXp - 经验增长与升级', () => {
    const s = { ...GameLogic.defaultState, xp: 0, level: 1 };

    GameLogic.addXp(s, 50);
    assertEqual(s.xp, 50, '加 50 经验，未升级');
    assertEqual(s.level, 1, '等级仍为 1');

    GameLogic.addXp(s, 50);
    assertEqual(s.xp, 0, '加满 100 经验，xp 归零');
    assertEqual(s.level, 2, '升到 Lv2');

    const s2 = { ...GameLogic.defaultState, xp: 0, level: 1 };
    GameLogic.addXp(s2, 500);
    assert(s2.level > 1, '大量经验触发多次升级');
    assert(s2.xp >= 0, '升级后剩余经验非负');
});

// ─── 4. actions 结构 ───
group('actions - 操作配置', () => {
    const keys = Object.keys(GameLogic.actions);
    assertEqual(keys.length, 8, '共有 8 个操作');

    const freeKeys = ['pet_free', 'greet'];
    for (const k of freeKeys) {
        assertEqual(GameLogic.actions[k].cost, 0, `${k} 是免费操作`);
    }

    const costKeys = ['feed', 'clean', 'highfive', 'cheer', 'pet_extra', 'sleep'];
    for (const k of costKeys) {
        assert(GameLogic.actions[k].cost > 0, `${k} 消耗专注星`);
    }

    for (const [k, v] of Object.entries(GameLogic.actions)) {
        assert(typeof v.label === 'string', `${k} 有 label`);
        assert(typeof v.effects === 'object', `${k} 有 effects`);
        assert(typeof v.cost === 'number', `${k} 有 cost`);
        assert(typeof v.message === 'string', `${k} 有 message`);
    }

    assertEqual(GameLogic.actions.heal, undefined, 'heal 操作已移除');
});

// ─── 5. performAction ───
group('performAction - 执行操作', () => {
    // 5a. 未知操作
    const s0 = { ...GameLogic.defaultState, stars: 10 };
    let r = GameLogic.performAction(s0, 'nonexistent');
    assertEqual(r.message, '未知操作', '未知操作返回错误消息');

    // 5b. 专注星不足
    const s1 = { ...GameLogic.defaultState, stars: 0 };
    r = GameLogic.performAction(s1, 'feed');
    assert(r.message.includes('需要'), '星不足时提示需要专注星');
    assertEqual(r.state.stars, 0, '星不足时未扣除星星');

    // 5c. 免费操作
    const s2 = { ...GameLogic.defaultState, stars: 0, happiness: 70, affection: 0 };
    r = GameLogic.performAction(s2, 'pet_free');
    assertEqual(r.state.happiness, 72, '免费抚摸快乐度+2');
    assertEqual(r.state.affection, 1, '免费抚摸亲密度+1');
    assertEqual(r.state.stars, 0, '免费操作不扣星');

    // 5d. 点数操作正常消耗
    const s3 = { ...GameLogic.defaultState, stars: 10, hunger: 50 };
    r = GameLogic.performAction(s3, 'feed');
    assertEqual(r.state.stars, 7, '喂食消耗 3 星');
    assert(r.state.hunger > 50, '喂食增加饱食度');

    // 5e. 经验 = cost × 5
    const s4 = { ...GameLogic.defaultState, stars: 10, xp: 0, level: 1 };
    r = GameLogic.performAction(s4, 'feed');
    assertEqual(r.state.xp, 15, '喂食(cost=3) 获得 15 经验 (3×5)');

    // 5f. 亲密度无上限
    const s5 = { ...GameLogic.defaultState, stars: 10, affection: 9999 };
    r = GameLogic.performAction(s5, 'pet_free');
    assert(r.state.affection > 9999, '亲密度可超过 100');

    // 5g. 其他属性 0-100 截断
    const s6 = { ...GameLogic.defaultState, stars: 10, hunger: 95 };
    r = GameLogic.performAction(s6, 'feed');
    assert(r.state.hunger <= 100, '饱食度不超过 100');

    // 5h. 亲密度不影响其他属性上限，且亲密度互动不受 0-100 限制
    const s7 = { ...GameLogic.defaultState, stars: 10, hunger: 99, affection: 200 };
    r = GameLogic.performAction(s7, 'pet_free');
    assert(r.state.hunger <= 100, '高亲密度下其他属性仍不超过 100 上限');
    assert(r.state.affection > 200, '高亲密度下亲密度继续增加');
});

// ─── 6. getAffectionBonus ───
group('getAffectionBonus - 亲密度里程碑', () => {
    assertEqual(GameLogic.getAffectionBonus({ affection: 0 }), 1.0, '0: 1.0x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 5 }), 1.0, '5: 1.0x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 10 }), 1.1, '10: 1.1x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 24 }), 1.1, '24: 1.1x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 25 }), 1.2, '25: 1.2x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 49 }), 1.2, '49: 1.2x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 50 }), 1.35, '50: 1.35x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 99 }), 1.35, '99: 1.35x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 100 }), 1.5, '100: 1.5x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 199 }), 1.5, '199: 1.5x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 200 }), 1.75, '200: 1.75x');
    assertEqual(GameLogic.getAffectionBonus({ affection: 9999 }), 1.75, '9999: 1.75x');
    assertEqual(GameLogic.getAffectionBonus({}), 1.0, '无 affection 字段时默认 1.0x');
    assertEqual(GameLogic.getAffectionBonus({ affection: -1 }), 1.0, '负数亲密度返回 1.0x');
});

// ─── 6b. getAffectionStage ───
group('getAffectionStage - 亲密度行为阶段', () => {
    assertEqual(GameLogic.getAffectionStage({ affection: 0 }), 'newbie', '0: newbie');
    assertEqual(GameLogic.getAffectionStage({ affection: 50 }), 'newbie', '50: newbie');
    assertEqual(GameLogic.getAffectionStage({ affection: 99 }), 'newbie', '99: newbie');
    assertEqual(GameLogic.getAffectionStage({ affection: 100 }), 'familiar', '100: familiar');
    assertEqual(GameLogic.getAffectionStage({ affection: 200 }), 'familiar', '200: familiar');
    assertEqual(GameLogic.getAffectionStage({ affection: 299 }), 'familiar', '299: familiar');
    assertEqual(GameLogic.getAffectionStage({ affection: 300 }), 'intimate', '300: intimate');
    assertEqual(GameLogic.getAffectionStage({ affection: 450 }), 'intimate', '450: intimate');
    assertEqual(GameLogic.getAffectionStage({ affection: 599 }), 'intimate', '599: intimate');
    assertEqual(GameLogic.getAffectionStage({ affection: 600 }), 'bestie', '600: bestie');
    assertEqual(GameLogic.getAffectionStage({ affection: 800 }), 'bestie', '800: bestie');
    assertEqual(GameLogic.getAffectionStage({ affection: 999 }), 'bestie', '999: bestie');
    assertEqual(GameLogic.getAffectionStage({ affection: 1000 }), 'forever', '1000: forever');
    assertEqual(GameLogic.getAffectionStage({ affection: 9999 }), 'forever', '9999: forever');
    assertEqual(GameLogic.getAffectionStage({}), 'newbie', '无 affection 字段默认 newbie');
    assertEqual(GameLogic.getAffectionStage({ affection: -1 }), 'newbie', '负数亲密度返回 newbie');
});

// ─── 7. tick ───
group('tick - 属性衰减', () => {
    // 1 小时精确测试
    const s2 = { ...GameLogic.defaultState, isSleeping: false, hunger: 100, energy: 100, hygiene: 100, happiness: 100 };
    const r2 = GameLogic.tick(s2, 60);
    assertEqual(r2.hunger, 98, '1小时饥饿 -2');
    assertEqual(r2.energy, 95, '1小时精力 -5');
    assertEqual(r2.hygiene, 99, '1小时清洁度 -1');
    assertEqual(r2.happiness, 100, '快乐度不自动下降');

    // 睡觉时
    const s3 = { ...GameLogic.defaultState, isSleeping: true, hunger: 100, energy: 50, hygiene: 100 };
    const r3 = GameLogic.tick(s3, 60);
    assertEqual(r3.energy, 60, '睡觉1小时精力 +10');
    assertEqual(r3.hunger, 99, '睡觉1小时饥饿 -1（减半）');

    // 不出现负数
    const s4 = { ...GameLogic.defaultState, isSleeping: false, hunger: 0, energy: 0, hygiene: 0 };
    const r4 = GameLogic.tick(s4, 60);
    assertEqual(r4.hunger, 0, '饥饿不低于 0');
    assertEqual(r4.energy, 0, '精力不低于 0');
    assertEqual(r4.hygiene, 0, '清洁度不低于 0');

    // 0 分钟不变化
    const s5 = { ...GameLogic.defaultState, hunger: 80, energy: 80, hygiene: 80 };
    const r5 = GameLogic.tick(s5, 0);
    assertEqual(r5.hunger, 80, '0 分钟 tick 饥饿无变化');
    assertEqual(r5.energy, 80, '0 分钟 tick 精力无变化');
    assertEqual(r5.hygiene, 80, '0 分钟 tick 清洁度无变化');
});

// ─── 8. getWarning ───
group('getWarning - 警告检查', () => {
    assert(GameLogic.getWarning({ hunger: 10, hygiene: 50, energy: 50, happiness: 50 }) !== null, '饥饿低时返回警告');
    assert(GameLogic.getWarning({ hunger: 50, hygiene: 10, energy: 50, happiness: 50 }) !== null, '清洁度低时返回警告');
    assert(GameLogic.getWarning({ hunger: 50, hygiene: 50, energy: 10, happiness: 50 }) !== null, '精力低时返回警告');
    assert(GameLogic.getWarning({ hunger: 50, hygiene: 50, energy: 50, happiness: 10 }) !== null, '快乐度低时返回警告');
    assertEqual(GameLogic.getWarning({ hunger: 50, hygiene: 50, energy: 50, happiness: 50 }), null, '全正常时无警告');
});

// ─── 9. 画像数据采集 ───
group('addFocusTime / recordMood / addInterruption', () => {
    let s = { ...GameLogic.defaultState, focusTime: 0, mood: 'neutral', interruptions: 0 };

    s = GameLogic.addFocusTime(s, 25);
    assertEqual(s.focusTime, 25, 'addFocusTime 累加正确');

    s = GameLogic.addFocusTime(s, 10);
    assertEqual(s.focusTime, 35, 'addFocusTime 多次累加');

    s = GameLogic.recordMood(s, 'happy');
    assertEqual(s.mood, 'happy', 'recordMood 记录 happy');

    s = GameLogic.recordMood(s, 'invalid');
    assertEqual(s.mood, 'happy', 'recordMood 非法值不修改');

    s = GameLogic.addInterruption(s);
    assertEqual(s.interruptions, 1, 'addInterruption +1');

    s = GameLogic.addInterruption(s);
    s = GameLogic.addInterruption(s);
    assertEqual(s.interruptions, 3, 'addInterruption 多次累加');
});

// ─── 10. recordSession ───
group('recordSession - 学习记录', () => {
    let s = { ...GameLogic.defaultState, history: [], focusTime: 30, interruptions: 2 };

    s = GameLogic.recordSession(s, {
        focusTime: 30,
        mood: 'happy',
        interruptions: 2,
        focusBlocks: 6,
        starsEarned: 10
    });

    assertEqual(s.history.length, 1, '记录了一条历史');
    assertEqual(s.history[0].focusTime, 30, '记录 focusTime 正确');
    assertEqual(s.history[0].mood, 'happy', '记录 mood 正确');
    assertEqual(s.history[0].interruptions, 2, '记录 interruptions 正确');
    assertEqual(s.history[0].focusBlocks, 6, '记录 focusBlocks 正确');
    assertEqual(s.history[0].starsEarned, 10, '记录 starsEarned 正确');
    assert(typeof s.history[0].date === 'string', '记录 date 正确');
    assert(typeof s.history[0].startTime === 'number', '记录 startTime 正确');
    assertEqual(s.focusTime, 0, '记录后 focusTime 归零');
    assertEqual(s.interruptions, 0, '记录后 interruptions 归零');

    // 上限 100 条
    let s2 = { ...GameLogic.defaultState, history: [], focusTime: 0, interruptions: 0 };
    for (let i = 0; i < 120; i++) {
        s2 = GameLogic.recordSession(s2, { focusTime: 1, mood: 'neutral', interruptions: 0, focusBlocks: 1, starsEarned: 1 });
    }
    assert(s2.history.length <= 100, '历史记录不超过 100 条');
});

// ─── 11. getAnalysis ───
group('getAnalysis - 画像分析', () => {
    const empty = GameLogic.getAnalysis({ history: [] });
    assertEqual(empty.totalSessions, 0, '空历史 totalSessions=0');

    const now = Date.now();
    const state = {
        history: [
            { date: '2026-08-30', startTime: now - 86400000, focusTime: 25, mood: 'happy', interruptions: 1, focusBlocks: 5, starsEarned: 8 },
            { date: '2026-08-29', startTime: now - 172800000, focusTime: 40, mood: 'neutral', interruptions: 2, focusBlocks: 8, starsEarned: 12 },
            { date: '2026-08-28', startTime: now - 259200000, focusTime: 15, mood: 'sad', interruptions: 3, focusBlocks: 3, starsEarned: 4 }
        ]
    };
    const a = GameLogic.getAnalysis(state);
    assertEqual(a.totalSessions, 3, 'totalSessions 正确');
    assertEqual(a.totalFocusTime, 80, 'totalFocusTime 正确');
    assertEqual(a.totalStarsEarned, 24, 'totalStarsEarned 正确');
    assertEqual(a.avgFocusTime, 27, 'avgFocusTime 正确 (80/3≈26.67→27)');
    assertEqual(a.avgInterruptions, 2, 'avgInterruptions 正确');
    assertEqual(a.moodDistribution.happy, 1, 'moodDistribution happy 正确');
    assertEqual(a.moodDistribution.neutral, 1, 'moodDistribution neutral 正确');
    assertEqual(a.moodDistribution.sad, 1, 'moodDistribution sad 正确');
    assertEqual(a.recentDays, 3, 'recentDays 正确');
});

// ─── 12. 倒计时 ───
group('startCountdown / tickCountdown', () => {
    let s = { ...GameLogic.defaultState, countdown: 0 };

    s = GameLogic.startCountdown(s, 10);
    assertEqual(s.countdown, 10, 'startCountdown 设置正确');

    let r = GameLogic.tickCountdown(s);
    assertEqual(r.state.countdown, 9, 'tickCountdown 减 1');
    assertEqual(r.finished, false, '未结束');

    for (let i = 0; i < 9; i++) {
        r = GameLogic.tickCountdown(r.state);
    }
    assertEqual(r.state.countdown, 0, '倒计时到 0');
    assertEqual(r.finished, true, 'finished 为 true');

    // 再 tick 一次，finished 应为 false（已经结束，不再倒计时）
    r = GameLogic.tickCountdown(r.state);
    assertEqual(r.state.countdown, 0, '倒计时结束后 countdown 保持 0');
    assertEqual(r.finished, false, '倒计时结束后 tick 无影响');
});

// ─── 13. getStarsRate ───
group('getStarsRate - 专注星软上限', () => {
    assertEqual(GameLogic.getStarsRate({ stars: 0 }), 1.0, '0 星: 100%');
    assertEqual(GameLogic.getStarsRate({ stars: 50 }), 1.0, '50 星: 100%');
    assertEqual(GameLogic.getStarsRate({ stars: 99 }), 1.0, '99 星: 100%');
    assertEqual(GameLogic.getStarsRate({ stars: 100 }), 0.75, '100 星: 75%');
    assertEqual(GameLogic.getStarsRate({ stars: 150 }), 0.75, '150 星: 75%');
    assertEqual(GameLogic.getStarsRate({ stars: 199 }), 0.75, '199 星: 75%');
    assertEqual(GameLogic.getStarsRate({ stars: 200 }), 0.5, '200 星: 50%');
    assertEqual(GameLogic.getStarsRate({ stars: 250 }), 0.5, '250 星: 50%');
    assertEqual(GameLogic.getStarsRate({ stars: 299 }), 0.5, '299 星: 50%');
    assertEqual(GameLogic.getStarsRate({ stars: 300 }), 0.3, '300 星: 30%');
    assertEqual(GameLogic.getStarsRate({ stars: 9999 }), 0.3, '9999 星: 30%');
    assertEqual(GameLogic.getStarsRate({}), 1.0, '无 stars 字段: 1.0');
});

// ─── 14. claimDailyLogin ───
group('claimDailyLogin - 每日登录奖励', () => {
    let s = { ...GameLogic.defaultState, stars: 0, dailyStars: 0, lastDailyLoginClaim: 0, lastDailyReset: 0 };
    let r = GameLogic.claimDailyLogin(s, false);
    assertEqual(r.claimed, false, '未写意图不发放');
    assertEqual(r.message, '📝 先写下今天的学习目标吧！', '提示先写意图');

    let s2 = { ...GameLogic.defaultState, stars: 0, dailyStars: 0, lastDailyLoginClaim: 0, lastDailyReset: 0 };
    let r2 = GameLogic.claimDailyLogin(s2, true);
    assertEqual(r2.claimed, true, '写下意图后发放');
    assertEqual(r2.state.stars, 2, '奖励 2 星');

    let r3 = GameLogic.claimDailyLogin(s2, true);
    assertEqual(r3.claimed, false, '同一天不重复发放');
});

// ─── 15. claimDailyGoal ───
group('claimDailyGoal - 完成目标奖励', () => {
    let s = { ...GameLogic.defaultState, stars: 0, dailyStars: 0, dailyGoalCompleted: 0, lastDailyReset: 0 };
    let r = GameLogic.claimDailyGoal(s);
    assertEqual(r.claimed, true, '完成目标发放奖励');
    assertEqual(r.state.stars, 3, '奖励 3 星');

    let r2 = GameLogic.claimDailyGoal(s);
    assertEqual(r2.claimed, false, '同一天不重复发放');
});

// ─── 16. 专注星系统 ───
group('enterFocus / leaveFocus / tickFocus / getStarsInfo', () => {
    let s = { ...GameLogic.defaultState, isFocused: false, focusBlocks: 0, stars: 0, dailyStars: 0, lastDailyReset: 0 };

    s = GameLogic.enterFocus(s);
    assertEqual(s.isFocused, true, 'enterFocus 标记为专注');

    s = GameLogic.tickFocus(s).state;
    assertEqual(s.focusBlocks, 1, 'tickFocus 累加 1 区块');
    s = GameLogic.tickFocus(s).state;
    s = GameLogic.tickFocus(s).state;
    assertEqual(s.focusBlocks, 3, '3 次 tick 累加 3 区块');

    let r = GameLogic.leaveFocus(s);
    assertEqual(r.starsEarned, 6, '3 区块离开，获得 6 星 (3×2)');
    assertEqual(r.state.isFocused, false, '离开后 isFocused=false');
    assertEqual(r.state.focusBlocks, 0, '离开后 focusBlocks=0');

    let s2 = { ...GameLogic.defaultState, isFocused: true, focusBlocks: 5, stars: 0, dailyStars: 0, lastDailyReset: 0 };
    let r2 = GameLogic.leaveFocus(s2);
    assertEqual(r2.starsEarned, 8, '5 区块离开，获得 8 星 (3×2 + 2×1)');

    // 每日上限 80（lastDailyReset 设为今天，避免触发每日重置）
    const today = Date.now();
    let s3 = { ...GameLogic.defaultState, isFocused: true, focusBlocks: 24, stars: 0, dailyStars: 78, lastDailyReset: today };
    let r3 = GameLogic.leaveFocus(s3);
    // 前3块×2 + 21块×1 = 27，但每日上限只能再拿 2 星
    assertEqual(r3.state.stars, 2, '每日上限 80，只获得 2 星');

    // getStarsInfo（lastDailyReset 设为今天）
    let info = GameLogic.getStarsInfo({ ...GameLogic.defaultState, stars: 10, dailyStars: 5, lastDailyReset: today, isFocused: true, focusBlocks: 3 });
    assertEqual(info.stars, 10, 'getStarsInfo.stars 正确');
    assertEqual(info.dailyStars, 5, 'getStarsInfo.dailyStars 正确');
    assertEqual(info.dailyRemaining, 75, 'getStarsInfo.dailyRemaining 正确');
    assertEqual(info.sessionBlocks, 3, 'getStarsInfo.sessionBlocks 正确');
});

// ─── 17. 边界情况 ───
group('边界情况 - 综合', () => {
    const s1 = { ...GameLogic.defaultState, stars: 0, hunger: 50 };
    const r1 = GameLogic.performAction(s1, 'feed');
    assertEqual(r1.state.hunger, 50, '星不足时属性不变化');
    assertEqual(r1.state.stars, 0, '星不足时星不变化');

    const s2 = { ...GameLogic.defaultState, stars: 0, happiness: 50 };
    const r2 = GameLogic.performAction(s2, 'greet');
    assertEqual(r2.state.happiness, 51, '免费操作不消耗星');

    const bonus = GameLogic.getAffectionBonus({ affection: -5 });
    assertEqual(bonus, 1.0, '负数亲密度返回 1.0x');

    const s3 = { ...GameLogic.defaultState, isSleeping: true, energy: 50, hunger: 50, hygiene: 50 };
    const r3 = GameLogic.tick(s3, 60);
    assertEqual(r3.energy, 60, '睡眠时精力恢复 +10/h');
    assertEqual(r3.hunger, 49, '睡眠时饥饿减半 -1/h');
});

// ─── 18. _checkDailyReset ───
group('_checkDailyReset - 每日重置', () => {
    const s = { ...GameLogic.defaultState, dailyStars: 50, lastDailyReset: 0 };
    GameLogic._checkDailyReset(s);
    assertEqual(s.dailyStars, 0, '每日重置后 dailyStars 归零');
    assert(s.lastDailyReset > 0, '重置时间戳更新');
});

// ─── 19. getStarsInfo 每日剩余 ───
group('getStarsInfo - 每日剩余', () => {
    const today = Date.now();
    let info = GameLogic.getStarsInfo({ ...GameLogic.defaultState, stars: 10, dailyStars: 30, lastDailyReset: today });
    assertEqual(info.dailyRemaining, 50, 'dailyStars=30 时剩余 50');

    info = GameLogic.getStarsInfo({ ...GameLogic.defaultState, stars: 10, dailyStars: 80, lastDailyReset: today });
    assertEqual(info.dailyRemaining, 0, 'dailyStars=80 时剩余 0');

    info = GameLogic.getStarsInfo({ ...GameLogic.defaultState, stars: 10, dailyStars: 85, lastDailyReset: today });
    assertEqual(info.dailyRemaining, 0, 'dailyStars=85 时剩余 0（不出现负数）');
});

// ─── 20. 所有 action 的 cost × 5 一致性 ───
group('所有 action 的 cost × 5 一致性', () => {
    for (const [key, action] of Object.entries(GameLogic.actions)) {
        if (action.cost > 0) {
            const s = { ...GameLogic.defaultState, stars: 100, xp: 0 };
            const r = GameLogic.performAction(s, key);
            const expectedXp = action.cost * 5;
            assertEqual(r.state.xp, expectedXp, `${key}: cost=${action.cost} → xp=${expectedXp}`);
        }
    }
    assert(true, '所有成本操作的 xpReward = cost × 5 验证完成');
});

// ─── 21. 亲密度对 performAction 效果的影响 ───
group('亲密度里程碑对互动效果的影响', () => {
    // 低亲密度 (0-9)：1.0x
    const sLow = { ...GameLogic.defaultState, stars: 10, affection: 0, hunger: 50 };
    const rLow = GameLogic.performAction(sLow, 'feed');
    // hunger +15 × 1.0 = 15
    assertEqual(rLow.state.hunger, 65, '低亲密度(0) 喂食 +15 饱食度');

    // 高亲密度 (200+)：1.75x
    const sHigh = { ...GameLogic.defaultState, stars: 10, affection: 200, hunger: 50 };
    const rHigh = GameLogic.performAction(sHigh, 'feed');
    // hunger +15 × 1.75 = 26.25 → round 26
    const expected = Math.round(15 * 1.75);
    assertEqual(rHigh.state.hunger, 50 + expected, `高亲密度(200) 喂食 +${expected} 饱食度 (15×1.75)`);
});

// ─── 22. tickFocus 满 24 块自动结算 ───
group('tickFocus 满 24 块自动结算', () => {
    const today = Date.now();
    let s = { ...GameLogic.defaultState, isFocused: true, focusBlocks: 22, stars: 0, dailyStars: 0, lastDailyReset: today };

    s = GameLogic.tickFocus(s).state;
    assertEqual(s.focusBlocks, 23, '第 23 块正常累加');

    s = GameLogic.tickFocus(s).state;
    // 满 24 块自动结算，isFocused=false
    assertEqual(s.isFocused, false, '满 24 块后自动结算，isFocused=false');
    assertEqual(s.focusBlocks, 0, '满 24 块后 focusBlocks=0');
    // 结算星数：前3块×2 + 21块×1 = 27，不受软上限影响（stars=0），不受每日上限影响（dailyStars=0）
    assertEqual(s.stars, 27, '满 24 块后获得 27 星 (3×2 + 21×1)');
});

// ===================================================================
//  输出结果
// ===================================================================
console.log('\n========================================');
console.log(`总计: ${total}  |  通过: ${passed}  |  失败: ${failed}`);
console.log('========================================');

if (failed === 0) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
} else {
    console.log('\n❌ 失败项:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
}