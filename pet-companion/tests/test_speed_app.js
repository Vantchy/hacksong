/**
 * test_speed_app.js — 100倍速测试版（基于 app.js 修改）
 * ===== [B] 仅用于测试，不用于生产 =====
 *
 * 修改点：
 *   1. TICK_INTERVAL_MS = 3000（3秒，原5分钟）
 *   2. doTick 中 GameLogic.tick 传入 500 分钟（原5分钟）
 *   3. 添加速度指示器
 *
 * 其余逻辑与 app.js 完全一致
 */

(function () {
    'use strict';

    // ===== [B] DOM 引用（引用 A 定义的 id） =====
    const $ = (id) => document.getElementById(id);

    const el = {
        level:     $('level'),
        xp:        $('xp'),
        xpNext:    $('xp-next'),
        xpFill:    $('xp-fill'),
        age:       $('age'),
        petName:   $('pet-name'),
        petSprite: $('pet-sprite'),
        message:   $('pet-message'),

        hunger:    { fill: $('hunger-fill'),    value: $('hunger-value') },
        happiness: { fill: $('happiness-fill'), value: $('happiness-value') },
        energy:    { fill: $('energy-fill'),    value: $('energy-value') },
        hygiene:   { fill: $('hygiene-fill'),   value: $('hygiene-value') },
        affection: { fill: $('affection-fill'), value: $('affection-value'), stage: $('affection-stage') },

        actionBtns: document.querySelectorAll('.action-btn'),
        saveBtn:    null,
        loadBtn:    null,
        resetBtn:   $('reset-btn'),

        // [B] A 的容器，用于挂载动态 DOM
        app: $('app')
    };

    // ===== [B] 状态变量 =====
    let gameState = null;
    let tickInterval = null;
    // 【100倍速】3秒 = 5分钟 * 60 * 1000 / 100
    const TICK_INTERVAL_MS = 3000;

    // ===== [B] 模块1-4 内部运行变量 =====
    let focusSeconds = 0;              // 本次共学累计秒数（用于模块1时长显示）
    let breatheTimer = null;
    let breatheRemaining = 0;
    let lastFidgetWarn = 0;

    // 深呼吸启动动作时长
    const BREATHE_SECONDS = 60;

    // ===== [B] 长期画像（模块3/4 数据，通过 gameState._bProfile 附加，走 Storage 持久化）=====
    // ⚠ _bProfile 是 B 侧临时字段，非 samename.md 契约字段。待 C 实现 history/getAnalysis 后迁移。
    let profile = {
        sessions: [],        // 每次学习记录 {date, startHour, focusMin, interruptions, mood}
        focusUpperLimit: 0,  // 发现的专注上限（分钟）
        weekdayStats: {}     // 周X统计 {0:{focusMin:0,count:0}...}
    };

    // ===== [B] 手动专注模式（用户主动点击开始/结束） =====
    let manualFocusStart = 0;          // 手动专注开始时间戳，0=未开始
    let manualFocusTimerId = null;     // 手动专注计时器 interval id

    /* ============================================================
     * [B] 渲染 UI（读取 C 提供的数据，更新 A 定义的 DOM）
     * ============================================================ */
    function render() {
        if (!gameState) return;
        const s = gameState;

        // 基础信息
        el.level.textContent = s.level;
        el.xp.textContent = s.xp;
        const xpNeeded = GameLogic.xpForLevel(s.level);
        el.xpNext.textContent = xpNeeded;
        el.xpFill.style.width = Math.min(100, (s.xp / xpNeeded) * 100) + '%';
        el.age.textContent = s.age;
        el.petName.textContent = s.name;

        // 属性条（health 已移除，只渲染4项）
        el.hunger.fill.style.width    = s.hunger + '%';
        el.hunger.value.textContent   = s.hunger;
        el.happiness.fill.style.width = s.happiness + '%';
        el.happiness.value.textContent= s.happiness;
        el.energy.fill.style.width    = s.energy + '%';
        el.energy.value.textContent   = s.energy;
        el.hygiene.fill.style.width   = s.hygiene + '%';
        el.hygiene.value.textContent  = s.hygiene;

        // 亲密度（无上限，进度条以200为视觉满值，超200后填满仅数值增加）
        const AFFECTION_BAR_MAX = 200;
        const affPct = Math.min(100, ((s.affection || 0) / AFFECTION_BAR_MAX) * 100);
        if (el.affection.fill)  el.affection.fill.style.width  = affPct + '%';
        if (el.affection.value) el.affection.value.textContent = s.affection || 0;
        if (el.affection.stage) {
            const stageMap = { newbie: '新伙伴', familiar: '好朋友', intimate: '亲密伴', bestie: '知己', forever: '永恒的伴' };
            const stage = GameLogic.getAffectionStage(s);
            el.affection.stage.textContent = stageMap[stage] || '新伙伴';
        }

        // 宠物表情 & 动画
        updatePetAppearance(s);

        // 警告消息（专注状态时不覆盖）
        if (!s.isFocused) {
            const warning = GameLogic.getWarning(s);
            if (warning) {
                el.message.textContent = warning;
            }
        }

        // 渲染专注星信息（warningAB.md 要求）
        renderStarsInfo();

        // 渲染今日专注统计
        renderDailyFocusStats();
    }

    // ===== [B] 更新宠物外观（CSS猫咪 + 状态class，移除 emoji textContent 和 .pet-sick）=====
    function updatePetAppearance(s) {
        const sprite = el.petSprite;
        // 清除所有状态/动作 class（保留一次性动作 class，让动画自然结束）
        const baseClasses = ['pet-normal','pet-happy','pet-sleeping',
                             'pet-newbie','pet-familiar','pet-intimate','pet-bestie','pet-forever'];
        baseClasses.forEach(c => sprite.classList.remove(c));

        if (s.isFocused || s.isSleeping) {
            sprite.classList.add('pet-sleeping');
        } else {
            sprite.classList.add('pet-normal');
        }

        // 亲密度阶段外观（warningAB.md 第6点）
        if (typeof GameLogic.getAffectionStage === 'function') {
            const stage = GameLogic.getAffectionStage(s);
            if (stage) sprite.classList.add('pet-' + stage);
        }
    }

    // ===== [B] 触发动作动画（临时添加 cat-anim-* class，动画结束后移除）=====
    function triggerActionAnim(actionKey) {
        const sprite = el.petSprite;
        const animMap = {
            pet_free:   'cat-anim-pet',
            pet_extra:  'cat-anim-pet',
            greet:      'cat-anim-greet',
            highfive:   'cat-anim-highfive',
            cheer:      'cat-anim-cheer',
            feed:       'cat-anim-feed',
            clean:      'cat-anim-clean',
            sleep:      'cat-anim-sleep'
        };
        const cls = animMap[actionKey];
        if (!cls) return;
        sprite.classList.remove(cls);
        // 强制reflow以重启动画
        void sprite.offsetWidth;
        sprite.classList.add(cls);
        const dur = actionKey === 'cheer' ? 1600 : (actionKey === 'clean' ? 1100 : (actionKey === 'feed' ? 900 : 800));
        setTimeout(() => {
            sprite.classList.remove(cls);
        }, dur);
    }

    // ===== [B] 触发快乐动画 =====
    function triggerHappyAnimation() {
        const sprite = el.petSprite;
        sprite.classList.remove('pet-happy');
        void sprite.offsetWidth;
        sprite.classList.add('pet-happy');
        setTimeout(() => {
            sprite.classList.remove('pet-happy');
            if (gameState && !gameState.isSleeping && !gameState.isFocused) {
                sprite.classList.add('pet-normal');
            }
        }, 700);
    }

    // ===== [B] 显示消息 =====
    function showMessage(text) {
        el.message.textContent = text;
        el.message.style.opacity = 0;
        el.message.style.transform = 'translateY(5px)';
        requestAnimationFrame(() => {
            el.message.style.opacity = 1;
            el.message.style.transform = 'translateY(0)';
        });
    }

    /* ============================================================
     * [B+C] 操作处理（调用 C 的 GameLogic 接口）
     * 含：专注星不足处理、每日免费互动次数限制
     * ============================================================ */
    function handleAction(actionKey) {
        if (!gameState) return;

        // 每日免费互动次数限制（warningAB.md 第7点，B 控制）
        if (actionKey === 'pet_free' || actionKey === 'greet') {
            const today = new Date().toDateString();
            if (gameState.freeActionUsage[actionKey] === today) {
                showMessage(`今天的${actionKey === 'pet_free' ? '抚摸' : '打招呼'}免费额度已用完，明天再来吧`);
                return;
            }
        }

        const result = GameLogic.performAction(gameState, actionKey);

        // 专注星不足（warningAB.md 第3点）：result.message 含"专注星，当前不足"
        if (result.message && result.message.indexOf('专注星') >= 0 && result.message.indexOf('不足') >= 0) {
            showMessage(result.message);
            return;
        }

        gameState = result.state;

        // 免费互动记录使用日期
        if (actionKey === 'pet_free' || actionKey === 'greet') {
            gameState.freeActionUsage[actionKey] = new Date().toDateString();
        }

        render();
        showMessage(result.message);
        triggerHappyAnimation();
        triggerActionAnim(actionKey);
        saveGameState();
    }

    // ===== [B+C] 定时衰减（调用 C 的 GameLogic.tick + tickFocus）=====
    function doTick() {
        if (!gameState) return;
        // 【100倍速】每次 tick 模拟 500 分钟（5 × 100）
        gameState = GameLogic.tick(gameState, 500);

        // 【100倍速】专注区块也按比例加速：500分钟 ÷ 5分钟/块 = 100块
        // 每次 tickFocus 加1块，满24块自动触发 leaveFocus 结算
        if (gameState.isFocused) {
            const BLOCKS_PER_TICK = 100; // 500 / 5
            for (let i = 0; i < BLOCKS_PER_TICK; i++) {
                const focusResult = GameLogic.tickFocus(gameState);
                gameState = focusResult.state;
                if (focusResult.message) {
                    showMessage(focusResult.message);
                }
                if (!gameState.isFocused) break; // 已结算，跳出循环
            }
        }

        render();
        saveGameState();
    }

    function handleReset() {
        if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return;
        Storage.clear();
        gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
        profile = { sessions: [], focusUpperLimit: 0, weekdayStats: {} };
        render();
        renderProfile();
        showMessage('已重置');
    }

    // ===== [B] 保存状态（附加 _bProfile，通过 C 的 Storage 接口）=====
    function saveGameState() {
        // ⚠ _bProfile 是 B 侧临时扩展字段（非 samename.md 契约字段），下划线+B前缀避免与 C 的
        //   计划字段 history 冲突。待 C 实现 GameLogic.getAnalysis()/history 后，B 应迁移到调用
        //   C 的接口，并移除本字段。（参考 docs/warningC.md 优先级3）
        gameState._bProfile = profile;
        return Storage.save(gameState);
    }

    // ===== [B] 离线计算（调用 C 的接口）=====
    function applyOfflineProgress() {
        const saved = Storage.load();
        if (!saved || !saved.savedAt) return false;

        const elapsed = Date.now() - saved.savedAt;
        const minutesElapsed = Math.floor(elapsed / 60000);
        if (minutesElapsed < 1) return false;

        const cappedMinutes = Math.min(minutesElapsed, 24 * 60);
        const ticks = Math.floor(cappedMinutes / 5);

        let state = saved;
        for (let i = 0; i < ticks; i++) {
            state = GameLogic.tick(state, 5);
        }
        state.age = saved.age + Math.floor(minutesElapsed / (24 * 60));

        gameState = state;
        if (saved._bProfile) profile = saved._bProfile;
        render();

        if (minutesElapsed >= 1) {
            const hours = Math.floor(minutesElapsed / 60);
            const mins = minutesElapsed % 60;
            const timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
            showMessage(`⏰ 你离开了 ${timeStr}，宠物好想你！`);
        }
        return true;
    }

    /* ============================================================
     * 手动专注模式：用户主动点击「开始专注」/「结束专注」
     * ============================================================ */
    function toggleManualFocus() {
        const btn = $('manual-focus-btn');
        if (!btn || !gameState) return;

        if (manualFocusStart === 0) {
            manualFocusStart = Date.now();
            btn.textContent = '⏹ 结束专注';
            btn.style.background = '#e8f5e9';
            btn.style.color = '#2e7d32';
            $('manual-focus-row').style.display = 'block';
            updateManualFocusTimer();
            manualFocusTimerId = setInterval(updateManualFocusTimer, 1000);
            gameState = GameLogic.enterFocus(gameState);
            showMessage('🧘 已进入专注模式，加油！');
            render();
            saveGameState();
        } else {
            stopManualFocusTimer();
            const elapsedMs = Date.now() - manualFocusStart;
            const elapsedMin = Math.floor(elapsedMs / 60000);
            const blocks = Math.min(24, Math.floor(elapsedMin / 5));
            // 即使不足5分钟也记录为一次专注（无专注星）
            gameState.focusBlocks = blocks;
            const result = GameLogic.leaveFocus(gameState);
            gameState = result.state;
            // 始终记录本次专注（无论是否有星）
            recordSession(blocks, elapsedMin);
            gameState = GameLogic.recordSession(gameState, {
                focusTime: Math.max(1, elapsedMin), mood: 'neutral', interruptions: 0,
                focusBlocks: blocks, starsEarned: result.starsEarned
            });
            showMoodRecord();
            if (result.message) showMessage(result.message);
            manualFocusStart = 0;
            btn.textContent = '🧘 开始专注';
            btn.style.background = '';
            btn.style.color = '';
            $('manual-focus-row').style.display = 'none';
            $('manual-focus-timer').textContent = '00:00';
            render();
            saveGameState();
        }
    }

    function updateManualFocusTimer() {
        const el = $('manual-focus-timer');
        if (!el || manualFocusStart === 0) return;
        const elapsed = Math.floor((Date.now() - manualFocusStart) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        el.textContent = m + ':' + s;
    }

    function stopManualFocusTimer() {
        if (manualFocusTimerId) {
            clearInterval(manualFocusTimerId);
            manualFocusTimerId = null;
        }
    }

    /* ============================================================
     * warningAB.md 第6点：专注星信息渲染到 UI
     * ============================================================ */

    // 专注星 UI
    // 按 warningAB 第3.2节，star-count / daily-star-* / focus-block-count 这些 id 由 A 创建、B 渲染。
    // 这里仅当 A 尚未创建时才兜底动态创建，避免与 A 将来创建的同名 id 重复（HTML id 必须唯一）。
    function initStarsUI() {
        if (document.getElementById('star-count')) {
            // A 已在 HTML 中创建了专注星展示元素，B 仅负责渲染（renderStarsInfo 会填充数据）
            return;
        }
        // A 尚未创建（如 A 还没改 HTML），B 兜底创建（容器 id stars-panel 为 B 专用，不与 A 冲突）
        const panel = document.createElement('section');
        panel.id = 'stars-panel';
        panel.style.cssText = 'margin-bottom:16px;padding:14px;background:#fff8e1;border-radius:14px;display:flex;justify-content:space-around;text-align:center;font-size:0.85rem;color:#666;';
        panel.innerHTML = `
            <div>专注星<br><b id="star-count" style="color:#f57c00;font-size:1.3rem;">0</b><br>数量</div>
            <div>今日<br><b id="daily-star-count" style="color:#333;font-size:1.1rem;">0</b>/<span id="daily-star-remaining">80</span><br>已获/剩余</div>
            <div>专注区块<br><b id="focus-block-count" style="color:#2e7d32;font-size:1.1rem;">0</b>/24<br>当前/上限</div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#actions'));
    }

    // 渲染专注星信息（调用 C 的 getStarsInfo）
    function renderStarsInfo() {
        const info = GameLogic.getStarsInfo(gameState);
        const sc = $('star-count'), dsc = $('daily-star-count'),
              dsr = $('daily-star-remaining'), fbc = $('focus-block-count');
        if (sc) sc.textContent = info.stars;
        if (dsc) dsc.textContent = info.dailyStars;
        if (dsr) dsr.textContent = info.dailyRemaining;
        if (fbc) fbc.textContent = info.sessionBlocks;
    }

    /* ============================================================
     * warningAB.md 第4点：每日登录奖励
     * ============================================================ */
    function claimDailyLogin() {
        const result = GameLogic.claimDailyLogin(gameState);
        gameState = result.state;
        if (result.message) {
            showMessage(result.message);
        }
    }

    // 用户写下学习意图 → 首次给2星，每次输入都欢呼
    function handleWriteIntention() {
        const input = $('intention-input');
        if (!input) return;
        const text = (input.value || '').trim();
        if (!text) {
            showMessage('写一句今天的学习目标吧');
            return;
        }
        const result = GameLogic.claimDailyLogin(gameState, true);
        gameState = result.state;
        triggerHappyAnimation();
        if (result.claimed) {
            input.value = '';
            input.placeholder = '已记录今天的目标 ✓';
            setTimeout(() => { input.placeholder = '写下今天的学习目标...'; }, 2000);
            render();
            saveGameState();
        } else {
            input.value = '';
            input.placeholder = '今天的目标已记录 ✓';
            setTimeout(() => { input.placeholder = '写下今天的学习目标...'; }, 2000);
        }
        if (result.message) {
            showMessage(result.message);
        }
    }

    // 完成每日目标 → 首次给3星，每次点击都欢呼庆祝
    function handleClaimDailyGoal() {
        const result = GameLogic.claimDailyGoal(gameState);
        gameState = result.state;
        triggerHappyAnimation();
        if (result.claimed) {
            render();
            saveGameState();
        }
        showMessage('🎉 太厉害了，今日目标已经完成！');
    }

    /* ============================================================
     * 模块1：共场陪伴面板（与专注状态检测融合）
     * ============================================================ */
    function initCompanionUI() {
        const panel = document.createElement('section');
        panel.id = 'companion-panel';
        panel.style.cssText = 'margin-bottom:16px;padding:16px;background:#f3f8e9;border-radius:14px;';
        panel.innerHTML = `
            <div style="text-align:center;">
                <div style="display:flex;justify-content:space-around;font-size:0.85rem;color:#666;">
                    <span>今日专注 <b id="daily-focus-count" style="color:#2e7d32;font-size:1rem;">0</b> 次</span>
                    <span>累计 <b id="daily-focus-minutes" style="color:#2e7d32;font-size:1rem;">0</b> 分钟</span>
                </div>
                <div id="focus-status" style="font-size:0.85rem;color:#666;min-height:20px;margin-top:8px;">点击右上角「开始专注」按钮开始学习</div>
            </div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#actions'));
    }

    // 渲染今日专注统计（从 gameState.history 计算）
    function renderDailyFocusStats() {
        if (!gameState) return;
        const today = new Date().toISOString().slice(0, 10);
        const history = gameState.history || [];
        let count = 0, totalMin = 0;
        for (const rec of history) {
            if (rec.date === today) {
                count++;
                totalMin += rec.focusTime || 0;
            }
        }
        const countEl = $('daily-focus-count');
        const minEl = $('daily-focus-minutes');
        if (countEl) countEl.textContent = count;
        if (minEl) minEl.textContent = totalMin;
    }

    /* ============================================================
     * 模块2：状态镜像对话（规则引擎 + 极小启动动作）
     * 点击宠物 → 弹出输入框 → 规则匹配 → 宠物回应 + 极小启动动作
     * ============================================================ */
    const DIALOGUE_RULES = [
        { keys: ['烦', '不想学', '不想', '不想动', '累', '懒', '摆烂', '学不进'],
          resps: [
            '那先不学，陪我看一分钟窗外吧',
            '累了就歇会儿，我在这儿陪你',
            '不想动的时候，允许自己躺五分钟',
            '有时候什么都不做，也是充电的方式',
            '来，深呼吸三次，我跟你一起',
            '不想学就不学，你不用一直那么努力',
            '趴一会儿吧，我陪你数云朵',
            '先倒杯水回来，我等你',
            '你不需要每次都做到满分，六十分也可以',
            '休息不是偷懒，是让下一步走得更远',
            '把书合上，闭眼十秒，然后决定要不要继续'
          ], action: 'breathe' },
        { keys: ['不错', '状态好', '可以', '精神', 'ok', '好的', '挺好', '元气'],
          resps: [
            '好耶！那今天先做最顺手的那件事？',
            '状态这么好，趁热打铁吧',
            '今天你的能量很高，抓住它！',
            '那就从最简单的开始，一鼓作气',
            '好状态就像好天气，别浪费了',
            '先做二十分钟，你会发现停不下来',
            '你现在的状态就是最好的武器',
            '做完今天想做的事，晚上奖励自己一下',
            '冲！我在旁边给你加油',
            '你专注的时候，茸茸也觉得特别安心'
          ], action: 'recommend' },
        { keys: ['焦虑', '紧张', '害怕', '担心', '压力', '慌', '怕'],
          resps: [
            '你已经在焦虑了，说明你在乎。先写一行字就好',
            '焦虑是大脑在保护你，但别让它骗了你',
            '把让你焦虑的事写下来，它就变小了',
            '先做一件小事，哪怕只是翻开书',
            '焦虑的时候，试试把任务拆成三步',
            '你担心的结果，大概率不会发生',
            '深呼吸，让心跳慢下来，我在听',
            '越是焦虑，越要从小处着手',
            '你不需要一下子解决所有问题',
            '先解决能解决的，剩下的交给时间',
            '茸茸在这儿，你什么都不用怕'
          ], action: 'blank' },
        { keys: ['困', '睡', '瞌睡', '疲惫', '犯困'],
          resps: [
            '要不趴五分钟？我叫你',
            '困了就闭会儿眼，我帮你看着时间',
            '睡个小觉，醒来效率更高',
            '你的身体在告诉你：该休息了',
            '五分钟的小睡，比硬撑一小时更有效',
            '闭上眼睛，休息一下，我在这儿',
            '困的时候不要硬撑，茸茸陪你打个盹',
            '睡醒了叫我，我一直在',
            '充电五分钟，再战一小时',
            '你最近是不是睡得不够？今天早点休息吧',
            '好好休息也是对自己负责'
          ], action: 'nap' },
        { keys: ['无聊', '没意思', '枯燥', '烦闷'],
          resps: [
            '换个学法？读出声试试',
            '无聊的时候，试试把任务变成游戏',
            '给自己设个五分钟挑战，看看能做多少',
            '换个环境试试？换个房间换个心情',
            '要不要听点音乐？我推荐纯音乐',
            '把大目标拆成小碎片，一个一个吃掉',
            '做点完全不同的事，让大脑换个频道',
            '无聊其实是创造力的前奏',
            '试试番茄工作法，25分钟休息一下',
            '你现在觉得无聊，是因为你做得到',
            '先做五分钟，不行再换，试试看'
          ], action: 'noop' },
        { keys: ['开心', '高兴', '快乐', '耶'],
          resps: [
            '嘿嘿，那乘着这股劲儿先开个头？',
            '开心的时候学习效率最高！',
            '把这份快乐带到学习中去吧',
            '好心情是最宝贵的资源，好好利用它',
            '你今天看起来闪闪发光',
            '开心的时候，做什么都顺手',
            '趁开心，把最难的事先干掉',
            '你的快乐会传染给茸茸哦',
            '今天的好事值得记下来',
            '保持这个状态，你今天能做成很多事',
            '茸茸也为你开心，一起加油！'
          ], action: 'recommend' }
    ];
    const DEFAULT_RULE = {
        resps: [
            '嗯，我在。先来五分钟？',
            '我在听，你继续说',
            '好，我知道了。你想先做哪一步？',
            '不管怎么样，先开始再说',
            '你说，我听着呢',
            '试试从最简单的开始？',
            '今天的目标是什么？茸茸陪你完成',
            '先做五分钟，不想做就停下来，试试？',
            '你不需要很厉害才能开始',
            '来得及，慢慢来',
            '每一步都算数，哪怕只是一小步',
            '你比你自己想象的要好得多'
        ], action: 'noop' };

    function matchRule(text) {
        for (const rule of DIALOGUE_RULES) {
            for (const key of rule.keys) {
                if (text.indexOf(key) >= 0) return rule;
            }
        }
        return DEFAULT_RULE;
    }

    function pickResp(rule) {
        const arr = rule.resps;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function initMirrorUI() {
        const panel = document.createElement('section');
        panel.id = 'mirror-panel';
        panel.style.cssText = 'display:none;margin-bottom:16px;padding:16px;background:#fff3e0;border-radius:14px;';
        panel.innerHTML = `
            <p style="margin:0 0 10px;font-size:0.9rem;color:#666;">现在感觉怎么样？跟茸茸说一句</p>
            <div style="display:flex;gap:8px;">
                <input id="mood-input" type="text" placeholder="如：好烦不想学 / 今天状态不错 / 有点焦虑" maxlength="40"
                    style="flex:1;font-size:0.9rem;padding:8px 12px;border-radius:10px;border:1px solid #ddd;outline:none;" />
                <button class="action-btn" id="btn-submit-mood" style="background:#ffa726;color:#fff;">说给茸茸</button>
            </div>
            <div id="mirror-resp" style="display:none;margin-top:12px;padding:10px 12px;background:#fffbe6;border:1px solid #ffe082;border-radius:10px;font-size:0.85rem;color:#333;"></div>
            <div id="breathe-timer" style="display:none;text-align:center;margin-top:12px;">
                <div style="width:80px;height:80px;margin:6px auto;border-radius:50%;background:radial-gradient(circle,#dcedc8,#aed581);animation:breatheCircle 8s ease-in-out infinite;"></div>
                <div id="breathe-count" style="font-size:1.5rem;font-weight:700;color:#2e7d32;font-variant-numeric:tabular-nums;">60</div>
                <div style="font-size:0.8rem;color:#666;">跟着圆圈呼吸 · 陪茸茸看一分钟窗外</div>
            </div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#actions'));

        // 深呼吸动画 keyframes（动态注入，不碰 A 的 CSS）
        const style = document.createElement('style');
        style.textContent = '@keyframes breatheCircle{0%,100%{transform:scale(.85);}50%{transform:scale(1.15);}}';
        document.head.appendChild(style);

        $('btn-submit-mood').addEventListener('click', submitMood);
        $('mood-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitMood();
        });
    }

    function submitMood() {
        const input = $('mood-input');
        const text = (input.value || '').trim();
        if (!text) { showMessage('跟茸茸说一句嘛'); return; }
        const rule = matchRule(text);
        const resp = pickResp(rule);

        const respEl = $('mirror-resp');
        respEl.innerHTML = '茸茸：<b style="color:#e65100;">' + resp + '</b>';
        respEl.style.display = 'block';

        showMessage(resp);
        triggerHappyAnimation();
        runStartupAction(rule.action);
        input.value = '';
    }

    function runStartupAction(action) {
        const resp = $('mirror-resp');
        switch (action) {
            case 'breathe':
                startBreatheTimer();
                break;
            case 'recommend':
                resp.innerHTML += '<br><span style="color:#888;font-size:0.8rem;">→ 建议：挑一件5分钟能搞定的小事先做</span>';
                break;
            case 'blank':
                showMessage('已为你准备空白，先写一行字');
                resp.innerHTML += '<br><span style="color:#888;font-size:0.8rem;">→ 已为你准备空白，先写一行字</span>';
                break;
            case 'nap':
                resp.innerHTML += '<br><span style="color:#888;font-size:0.8rem;">→ 5分钟后叫你（演示）</span>';
                break;
            case 'noop':
            default:
                break;
        }
    }

    function startBreatheTimer() {
        $('breathe-timer').style.display = 'block';
        breatheRemaining = BREATHE_SECONDS;
        $('breathe-count').textContent = breatheRemaining;
        clearInterval(breatheTimer);
        breatheTimer = setInterval(() => {
            breatheRemaining -= 1;
            $('breathe-count').textContent = breatheRemaining;
            if (breatheRemaining <= 0) {
                clearInterval(breatheTimer);
                $('breathe-timer').style.display = 'none';
                showMessage('好啦，现在试试开始？');
                triggerHappyAnimation();
            }
        }, 1000);
    }

    /* ============================================================
     * 模块3：状态记录（学习结束 emoji 记录 + 自动采集数据）
     * ============================================================ */
    function initRecordUI() {
        const panel = document.createElement('section');
        panel.id = 'record-panel';
        panel.style.cssText = 'display:none;margin-bottom:16px;padding:16px;background:#fce4ec;border-radius:14px;text-align:center;';
        panel.innerHTML = `
            <p style="margin:0 0 12px;font-size:0.9rem;color:#666;">本次学习结束啦，现在感觉怎么样？</p>
            <div style="display:flex;gap:14px;justify-content:center;">
                <button class="action-btn" data-mood="happy" title="不错">开心</button>
                <button class="action-btn" data-mood="neutral" title="一般">一般</button>
                <button class="action-btn" data-mood="sad" title="不太好">低落</button>
            </div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#actions'));

        panel.querySelectorAll('[data-mood]').forEach(btn => {
            btn.addEventListener('click', () => recordMood(btn.dataset.mood));
        });
    }

    function showMoodRecord() { $('record-panel').style.display = 'block'; }
    function hideMoodRecord() { $('record-panel').style.display = 'none'; }

    function recordMood(mood) {
        gameState.mood = mood;
        const last = profile.sessions[profile.sessions.length - 1];
        if (last) last.mood = mood;
        // 同时更新 C 侧 history 最新一条记录的 mood
        const history = gameState.history;
        if (history && history.length > 0) {
            const lastC = history[history.length - 1];
            if (lastC) lastC.mood = mood;
        }
        gameState = GameLogic.recordMood(gameState, mood);
        saveGameState();
        hideMoodRecord();
        showMessage(mood === 'happy' ? '收到啦，记下了' :
                    mood === 'neutral' ? '嗯，记下了，辛苦了' : '抱抱，明天会好一点');
        triggerHappyAnimation();
        renderProfile();
    }

    // 记录一次学习会话（自动采集：专注时长、中断次数、时间段）
    function recordSession(focusBlocksBefore, elapsedMin) {
        // 优先使用实际专注时长，否则从区块推算
        const focusMin = (elapsedMin !== undefined) ? elapsedMin : (focusBlocksBefore || 0) * 5;

        const now = new Date();
        const session = {
            date: now.toISOString().slice(0, 10),
            startHour: now.getHours(),
            focusMin: focusMin,
            interruptions: gameState.interruptions,
            mood: 'neutral'
        };
        profile.sessions.push(session);

        if (focusMin > profile.focusUpperLimit) {
            profile.focusUpperLimit = focusMin;
        }

        const wd = now.getDay();
        if (!profile.weekdayStats[wd]) profile.weekdayStats[wd] = { focusMin: 0, count: 0 };
        profile.weekdayStats[wd].focusMin += focusMin;
        profile.weekdayStats[wd].count += 1;

        saveGameState();
    }

    /* ============================================================
     * 模块4：长期陪伴演化（画像 + 个性化行为触发）
     * ============================================================ */
    function initProfileUI() {
        const panel = document.createElement('section');
        panel.id = 'profile-summary';
        panel.style.cssText = 'margin-bottom:16px;padding:14px;background:#e8eaf6;border-radius:14px;font-size:0.85rem;color:#666;line-height:1.8;';
        panel.innerHTML = '<span style="color:#888;font-style:italic;">还没有学习记录 · 茸茸会慢慢了解你</span>';
        el.app.insertBefore(panel, el.app.querySelector('#actions'));
    }

    function renderProfile() {
        const panel = $('profile-summary');
        if (!panel) return;

        // 使用 C 侧的 gameState.history 通过 getAnalysis 生成画像
        const analysis = GameLogic.getAnalysis(gameState);
        if (analysis.totalSessions === 0) {
            panel.innerHTML = '<span style="color:#888;font-style:italic;">还没有学习记录 · 茸茸会慢慢了解你</span>';
            return;
        }

        const moodMap = { happy: '开心', neutral: '平静', sad: '低落' };
        const hourMap = {};
        for (let h = 0; h < 24; h += 6) {
            hourMap[h] = h === 0 ? '深夜' : h === 6 ? '上午' : h === 12 ? '下午' : '晚上';
        }
        const bestHourLabel = analysis.bestHour
            ? (hourMap[parseInt(analysis.bestHour)] || analysis.bestHour)
            : '—';
        // 从 moodDistribution 查找出现次数最多的情绪
        let bestMood = '—', bestMoodCount = 0;
        for (const [m, c] of Object.entries(analysis.moodDistribution)) {
            if (c > bestMoodCount) { bestMoodCount = c; bestMood = m; }
        }
        const bestMoodLabel = bestMood !== '—' ? (moodMap[bestMood] || bestMood) : '—';

        panel.innerHTML =
            '已陪伴 <b style="color:#333;">' + analysis.totalSessions + '</b> 次 · 累计 <b style="color:#333;">' + analysis.totalFocusTime + '</b> 分钟<br>' +
            '平均专注 <b style="color:#333;">' + analysis.avgFocusTime + '</b> 分钟 · 累计 <b style="color:#333;">' + analysis.totalStarsEarned + '</b> 星<br>' +
            '最专注时段：<b style="color:#333;">' + bestHourLabel + '</b> · 启动最快情绪：<b style="color:#333;">' + bestMoodLabel + '</b>';
    }

    // 演化：连续三天同一时段学习 → 提前等候问候；周二下午状态最差 → 主动问候
    function checkEvolution() {
        if (profile.sessions.length < 3) return;
        const now = new Date();
        const hour = now.getHours();

        const recent = profile.sessions.slice(-3);
        const sameTime = recent.every(s => Math.abs(s.startHour - hour) <= 1);
        if (sameTime) {
            setTimeout(() => showMessage('你又在这个时候来啦，茸茸早等着你了'), 800);
            return;
        }

        const tue = profile.weekdayStats[2];
        if (tue && tue.count >= 2 && now.getDay() === 2 && now.getHours() >= 12 && now.getHours() < 14) {
            setTimeout(() => showMessage('下午要不要换个地方学？'), 800);
        }
    }

    /* ============================================================
     * [B] 初始化（添加速度指示器）
     * ============================================================ */
    function init() {
        // 添加100倍速测试指示器
        const speedBadge = document.createElement('div');
        speedBadge.id = 'speed-badge';
        speedBadge.style.cssText = 'position:fixed;top:0;right:0;z-index:9999;background:#e53935;color:#fff;font-size:0.75rem;font-weight:700;padding:4px 12px;border-radius:0 0 0 10px;letter-spacing:0.5px;';
        speedBadge.textContent = '100x 测试模式';
        document.body.appendChild(speedBadge);

        // 尝试加载存档（通过 C 的 Storage 接口）
        const hasOffline = applyOfflineProgress();

        if (!gameState) {
            const saved = Storage.load();
            if (saved) {
                gameState = saved;
                if (saved._bProfile) profile = saved._bProfile;
                // 旧存档兼容：确保 freeActionUsage 字段存在
                if (!gameState.freeActionUsage) {
                    gameState.freeActionUsage = { pet_free: null, greet: null };
                }
                showMessage('欢迎回来！');
            } else {
                gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
                showMessage('欢迎！你的小宠物诞生了！');
            }
        }

        render();

        if (!hasOffline) {
            const warning = GameLogic.getWarning(gameState);
            if (warning) el.message.textContent = warning;
        }

        // warningAB.md 第4点：每日登录奖励（页面加载时调用）
        claimDailyLogin();
        render();

        // 绑定操作按钮事件（A 定义的 .action-btn，B 通过 data-action 读取）
        el.actionBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                handleAction(this.dataset.action);
            });
        });

        el.resetBtn.addEventListener('click', handleReset);

        // 绑定手动专注按钮事件
        const manualFocusBtn = $('manual-focus-btn');
        if (manualFocusBtn) {
            manualFocusBtn.addEventListener('click', toggleManualFocus);
        }

        // 绑定意图输入事件
        const intentionBtn = $('intention-btn');
        const intentionInput = $('intention-input');
        if (intentionBtn) {
            intentionBtn.addEventListener('click', handleWriteIntention);
        }
        if (intentionInput) {
            intentionInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') handleWriteIntention();
            });
        }

        // 绑定完成今日目标事件
        const claimGoalBtn = $('claim-goal-btn');
        if (claimGoalBtn) {
            claimGoalBtn.addEventListener('click', handleClaimDailyGoal);
        }

        // 初始化 UI（动态创建 DOM，使用全新 id 不与 A 冲突）
        initStarsUI();         // 专注星面板（warningAB 第3点）
        initCompanionUI();     // 模块1：共场陪伴
        initMirrorUI();        // 模块2：状态镜像对话
        initRecordUI();        // 模块3：状态记录
        initProfileUI();       // 模块4：长期画像

        renderProfile();
        renderStarsInfo();

        // 模块2：点击宠物 → 弹出状态镜像对话
        el.petSprite.addEventListener('click', function () {
            const mirror = $('mirror-panel');
            if (mirror.style.display === 'none' || !mirror.style.display) {
                mirror.style.display = 'block';
                setTimeout(() => $('mood-input').focus(), 100);
                triggerHappyAnimation();
                showMessage('现在感觉怎么样？');
            } else {
                mirror.style.display = 'none';
            }
        });
        el.petSprite.style.cursor = 'pointer';

        // 启动衰减定时器（通过 C 的 GameLogic.tick + tickFocus）
        tickInterval = setInterval(doTick, TICK_INTERVAL_MS);

        // 渲染今日专注统计
        renderDailyFocusStats();

        // 演化检查（模块4）
        checkEvolution();

        console.log('【100倍速测试版】茸学伴 已启动 — 专注星系统 + 共场陪伴 + 状态镜像 + 状态记录 + 长期演化');
    }

    // ===== [B] 页面关闭时保存（通过 C 的 Storage 接口）=====
    window.addEventListener('beforeunload', function () {
        if (gameState) saveGameState();
    });

    // ===== [B] 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();