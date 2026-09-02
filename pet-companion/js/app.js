/**
 * app.js — 核心交互逻辑
 * ===== [B] 全部文件归 B 全权负责 =====
 * B 调用 C 的 GameLogic 和 Storage 公开接口
 * A 不涉及此文件，但此文件引用了 A 定义的 HTML id
 * =====================================
 *
 * 本文件实现 warningAB.md 对 B 的全部要求：
 *   1. 专注状态检测（90秒阈值，120秒非专注结算）
 *   2. 专注星系统调用（enterFocus/leaveFocus/tickFocus/getStarsInfo/claimDailyLogin）
 *   3. 每日免费互动次数限制（pet_free / greet 各1次/天，B 控制）
 *   4. 专注星信息渲染到 UI（star-count / daily-star-* / focus-block-count）
 *   5. 移除 .pet-sick 使用（health 已移除）
 *
 * 同时保留茸学伴4大模块（通过动态 DOM 实现，新 id 不与 A 冲突）：
 *   模块1：共场陪伴 + 走神检测（与专注状态检测融合）
 *   模块2：状态镜像对话（规则引擎 + 极小启动动作）
 *   模块3：状态记录（学习结束 emoji 记录 + 自动采集数据）
 *   模块4：长期陪伴演化（画像 + 个性化行为触发）
 *
 * 契约遵守：
 *   - 仅引用 A 定义的 HTML id（level/xp/pet-sprite/hunger-fill 等）
 *   - 4大模块的 DOM 通过 JS 动态创建，使用全新 id（companion-xxx/mirror-xxx/record-xxx/profile-xxx）
 *   - 所有数据操作通过 C 的 GameLogic / Storage 全局对象，绝不直接操作 localStorage
 *   - 专注星相关字段（stars/dailyStars/focusBlocks 等）由 C 维护，B 只读写不直接计算
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

        actionBtns: document.querySelectorAll('.action-btn'),
        saveBtn:    $('save-btn'),
        loadBtn:    $('load-btn'),
        resetBtn:   $('reset-btn'),

        // [B] A 的容器，用于挂载动态 DOM
        app: $('app')
    };

    // ===== [B] 状态变量 =====
    let gameState = null;
    let tickInterval = null;
    const TICK_INTERVAL_MS = 5 * 60 * 1000; // 5分钟衰减一次（C 的 tick）

    // ===== [B] warningAB.md 要求：专注状态检测变量 =====
    // 90秒无活动 → 标记为非专注；连续非专注 ≥ 120秒 → 调用 leaveFocus 结算
    const FOCUS_INACTIVE_THRESHOLD = 90;   // 90秒无操作 → 非专注
    const FOCUS_LEAVE_THRESHOLD = 120;     // 连续非专注120秒 → 结算
    let lastActivity = Date.now();          // 最近一次鼠标/键盘活动
    let nonFocusSeconds = 0;               // 连续非专注秒数
    let focusCheckTimer = null;             // 专注检测1秒心跳
    let wasFocused = false;                 // 上一秒是否处于专注态

    // ===== [B] warningAB.md 要求：每日免费互动次数（pet_free / greet 各1次/天）=====
    let freeActionUsage = {
        pet_free: null,   // 上次使用日期字符串 'YYYY-MM-DD'
        greet: null
    };

    // ===== [B] 模块1-4 内部运行变量 =====
    let focusSeconds = 0;              // 本次共学累计秒数（用于模块1时长显示）
    let wasIdle = false;               // 当前是否处于走神态
    let breatheTimer = null;
    let breatheRemaining = 0;
    let lastFidgetWarn = 0;

    // 走神判定阈值（秒）·演示用20s，正式建议90s（与 FOCUS_INACTIVE_THRESHOLD 对齐）
    const IDLE_THRESHOLD = 20;
    // 专注达40分钟，宠物开始翻身（暗示该休息）
    const FOCUS_WARN_AT = 40 * 60;
    // 深呼吸启动动作时长
    const BREATHE_SECONDS = 60;

    // ===== [B] 长期画像（模块3/4 数据，通过 gameState._bProfile 附加，走 Storage 持久化）=====
    // ⚠ _bProfile 是 B 侧临时字段，非 samename.md 契约字段。待 C 实现 history/getAnalysis 后迁移。
    let profile = {
        sessions: [],        // 每次学习记录 {date, startHour, focusMin, interruptions, mood}
        focusUpperLimit: 0,  // 发现的专注上限（分钟）
        weekdayStats: {}     // 周X统计 {0:{focusMin:0,count:0}...}
    };

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
    }

    // ===== [B] 更新宠物外观（CSS猫咪 + 状态class，移除 emoji textContent 和 .pet-sick）=====
    function updatePetAppearance(s) {
        const sprite = el.petSprite;
        // 清除所有状态/动作 class（保留一次性动作 class，让动画自然结束）
        const baseClasses = ['pet-normal','pet-happy','pet-sleeping','pet-sick',
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
            if (freeActionUsage[actionKey] === today) {
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
            freeActionUsage[actionKey] = new Date().toDateString();
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
        gameState = GameLogic.tick(gameState, 5);

        // 专注区块计时（warningAB.md 第1点）：若专注中，每5分钟累加1个区块
        if (gameState.isFocused) {
            const focusResult = GameLogic.tickFocus(gameState);
            gameState = focusResult.state;
            if (focusResult.message) {
                showMessage(focusResult.message);
            }
        }

        render();
        saveGameState();
    }

    // ===== [B+C] 存档操作（调用 C 的 Storage 接口）=====
    function handleSave() {
        if (!gameState) return;
        const ok = saveGameState();
        showMessage(ok ? '保存成功！' : '保存失败');
    }

    function handleLoad() {
        const data = Storage.load();
        if (data) {
            gameState = data;
            if (data._bProfile) profile = data._bProfile;
            render();
            renderProfile();
            showMessage('读档成功！');
        } else {
            showMessage('没有找到存档');
        }
    }

    function handleReset() {
        if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return;
        Storage.clear();
        gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
        profile = { sessions: [], focusUpperLimit: 0, weekdayStats: {} };
        freeActionUsage = { pet_free: null, greet: null };
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
     * warningAB.md 第1、2点：专注状态检测 + 专注星系统
     * 技术方案：Page Visibility API + 鼠标键盘空闲检测
     *   - 90秒无活动 → 标记为非专注
     *   - 连续非专注 ≥ 120秒 → 调用 GameLogic.leaveFocus 结算
     * ============================================================ */

    // 启动专注检测心跳（每秒检查）
    function startFocusDetection() {
        if (focusCheckTimer) return;
        focusCheckTimer = setInterval(focusTick, 1000);
    }

    // 专注检测每秒心跳
    function focusTick() {
        if (!gameState) return;

        // 标签页不可见 → 直接非专注
        if (document.hidden) {
            handleNonFocus();
            return;
        }

        const idleSec = (Date.now() - lastActivity) / 1000;
        if (idleSec >= FOCUS_INACTIVE_THRESHOLD) {
            // 90秒无操作 → 非专注
            handleNonFocus();
        } else {
            // 可见 + 90秒内有操作 → 专注
            handleFocus();
        }
    }

    // 用户处于专注态
    function handleFocus() {
        nonFocusSeconds = 0;
        if (!gameState.isFocused) {
            // 进入专注态
            gameState = GameLogic.enterFocus(gameState);
            render();
            // 模块1：更新状态显示
            const fs = $('focus-state');
            if (fs) {
                fs.textContent = '专注中';
                fs.style.color = '#2e7d32';
            }
            const fstat = $('focus-status');
            if (fstat) {
                fstat.textContent = '茸茸趴下陪你 · 你专注时它打盹';
                fstat.style.color = '#2e7d32';
            }
        }
    }

    // 用户处于非专注态
    function handleNonFocus() {
        if (gameState.isFocused) {
            nonFocusSeconds += 1;
            // 模块1：走神检测 — 宠物抬头看你一眼
            if (!wasIdle) {
                wasIdle = true;
                showMessage('（看了你一眼）还在吗？');
                const fs = $('focus-state');
                if (fs) {
                    fs.textContent = '走神了';
                    fs.style.color = '#f57c00';
                }
                const fstat = $('focus-status');
                if (fstat) {
                    fstat.textContent = '茸茸发现你走神了 · 不催你，回来就好';
                    fstat.style.color = '#f57c00';
                }
            }
            // 连续非专注 ≥ 120秒 → 结算
            if (nonFocusSeconds >= FOCUS_LEAVE_THRESHOLD) {
                leaveFocusAndRecord();
            }
        } else {
            nonFocusSeconds += 1;
        }
    }

    // 离开专注态，结算专注星（warningAB.md 第5点）
    function leaveFocusAndRecord() {
        const result = GameLogic.leaveFocus(gameState);
        gameState = result.state;
        wasIdle = false;
        nonFocusSeconds = 0;

        if (result.message) {
            showMessage(result.message);
        }
        render();

        // 模块3：状态记录 — 专注结束后弹出情绪记录
        if (result.starsEarned > 0) {
            recordSession();
            showMoodRecord();
        }
    }

    // 用户活动重置
    function resetActivity() {
        lastActivity = Date.now();
        if (wasIdle && gameState && gameState.isFocused) {
            wasIdle = false;
            const fs = $('focus-state');
            if (fs) {
                fs.textContent = '专注中';
                fs.style.color = '#2e7d32';
            }
            const fstat = $('focus-status');
            if (fstat) {
                fstat.textContent = '欢迎回来 · 茸茸继续趴着陪你';
                fstat.style.color = '#2e7d32';
            }
            render();
        }
    }

    // 标签页可见性 → 切走记为中断（模块1 + 模块3 interruptions 字段）
    function onVisibilityChange() {
        if (document.hidden && gameState && gameState.isFocused) {
            gameState.interruptions += 1;
            const ic = $('interrupt-count');
            if (ic) ic.textContent = gameState.interruptions;
            saveGameState();
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
        if (result.claimed && result.message) {
            showMessage(result.message);
        }
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
                <div style="font-size:0.85rem;color:#666;margin-bottom:8px;">专注状态由系统自动检测 · 90秒无操作视为走神</div>
                <div style="display:flex;justify-content:space-around;font-size:0.85rem;color:#666;">
                    <span>中断 <b id="interrupt-count" style="color:#333;font-size:1rem;">0</b> 次</span>
                    <span>状态 <b id="focus-state" style="color:#333;font-size:1rem;">空闲</b></span>
                </div>
                <div id="focus-status" style="font-size:0.85rem;color:#666;min-height:20px;margin-top:8px;">开始学习吧，茸茸会自动陪你</div>
            </div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#stars-panel'));
    }

    /* ============================================================
     * 模块2：状态镜像对话（规则引擎 + 极小启动动作）
     * 点击宠物 → 弹出输入框 → 规则匹配 → 宠物回应 + 极小启动动作
     * ============================================================ */
    const DIALOGUE_RULES = [
        { keys: ['烦', '不想学', '不想', '不想动', '累', '懒', '摆烂', '学不进'],
          resp: '那先不学，陪我看一分钟窗外吧', action: 'breathe' },
        { keys: ['不错', '状态好', '可以', '精神', 'ok', '好的', '挺好', '元气'],
          resp: '好耶！那今天先做最顺手的那件事？', action: 'recommend' },
        { keys: ['焦虑', '紧张', '害怕', '担心', '压力', '慌', '怕'],
          resp: '你已经在焦虑了，说明你在乎。先写一行字就好。', action: 'blank' },
        { keys: ['困', '睡', '瞌睡', '疲惫', '犯困'],
          resp: '要不趴五分钟？我叫你。', action: 'nap' },
        { keys: ['无聊', '没意思', '枯燥', '烦闷'],
          resp: '换个学法？读出声试试。', action: 'noop' },
        { keys: ['开心', '高兴', '快乐', '耶'],
          resp: '嘿嘿，那乘着这股劲儿先开个头？', action: 'recommend' }
    ];
    const DEFAULT_RULE = { resp: '嗯，我在。先来五分钟？', action: 'noop' };

    function matchRule(text) {
        for (const rule of DIALOGUE_RULES) {
            for (const key of rule.keys) {
                if (text.indexOf(key) >= 0) return rule;
            }
        }
        return DEFAULT_RULE;
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
        el.app.insertBefore(panel, el.app.querySelector('#stars-panel'));

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

        const resp = $('mirror-resp');
        resp.innerHTML = '茸茸：<b style="color:#e65100;">' + rule.resp + '</b>';
        resp.style.display = 'block';

        showMessage(rule.resp);
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
        el.app.insertBefore(panel, el.app.querySelector('#stars-panel'));

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
        saveGameState();
        hideMoodRecord();
        showMessage(mood === 'happy' ? '收到啦，记下了' :
                    mood === 'neutral' ? '嗯，记下了，辛苦了' : '抱抱，明天会好一点');
        triggerHappyAnimation();
        renderProfile();
    }

    // 记录一次学习会话（自动采集：专注时长、中断次数、时间段）
    function recordSession() {
        // 从 C 的 focusBlocks 推算专注时长（每块5分钟）
        const focusMin = (gameState.focusBlocks || 0) * 5;
        if (focusMin < 1) return;

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
        el.app.insertBefore(panel, el.app.querySelector('#stars-panel'));
    }

    function renderProfile() {
        const panel = $('profile-summary');
        if (!panel) return;
        if (profile.sessions.length === 0) {
            panel.innerHTML = '<span style="color:#888;font-style:italic;">还没有学习记录 · 茸茸会慢慢了解你</span>';
            return;
        }

        const total = profile.sessions.length;
        const totalFocus = profile.sessions.reduce((s, x) => s + x.focusMin, 0);
        const avgFocus = Math.round(totalFocus / total);

        const hourBuckets = {};
        profile.sessions.forEach(s => {
            const key = Math.floor(s.startHour / 6) * 6;
            if (!hourBuckets[key]) hourBuckets[key] = { focusMin: 0, count: 0 };
            hourBuckets[key].focusMin += s.focusMin;
            hourBuckets[key].count += 1;
        });
        let bestHour = null, bestMin = 0;
        Object.keys(hourBuckets).forEach(k => {
            if (hourBuckets[k].focusMin > bestMin) { bestMin = hourBuckets[k].focusMin; bestHour = k; }
        });
        const hourLabel = bestHour === null ? '—' :
            (bestHour == 0 ? '深夜' : bestHour == 6 ? '上午' : bestHour == 12 ? '下午' : '晚上');

        const moodBuckets = { happy: [], neutral: [], sad: [] };
        profile.sessions.forEach(s => { if (moodBuckets[s.mood]) moodBuckets[s.mood].push(s.focusMin); });
        let bestMood = '—', bestMoodAvg = 0;
        Object.keys(moodBuckets).forEach(k => {
            const arr = moodBuckets[k];
            if (arr.length === 0) return;
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            if (avg > bestMoodAvg) { bestMoodAvg = avg; bestMood = k; }
        });
        const moodLabel = bestMood === 'happy' ? '开心' : bestMood === 'neutral' ? '平静' : bestMood === 'sad' ? '低落' : '—';

        panel.innerHTML =
            '已陪伴 <b style="color:#333;">' + total + '</b> 次 · 累计 <b style="color:#333;">' + totalFocus + '</b> 分钟<br>' +
            '平均专注 <b style="color:#333;">' + avgFocus + '</b> 分钟 · 上限 <b style="color:#333;">' + profile.focusUpperLimit + '</b> 分钟<br>' +
            '最专注时段：<b style="color:#333;">' + hourLabel + '</b> · 启动最快情绪：<b style="color:#333;">' + moodLabel + '</b>';
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
     * [B] 初始化
     * ============================================================ */
    function init() {
        // 尝试加载存档（通过 C 的 Storage 接口）
        const hasOffline = applyOfflineProgress();

        if (!gameState) {
            const saved = Storage.load();
            if (saved) {
                gameState = saved;
                if (saved._bProfile) profile = saved._bProfile;
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

        el.saveBtn.addEventListener('click', handleSave);
        el.loadBtn.addEventListener('click', handleLoad);
        el.resetBtn.addEventListener('click', handleReset);

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

        // warningAB.md 第1点：专注状态检测 — 鼠标/键盘活动监听
        ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetActivity, { passive: true });
        });
        // 标签页可见性（中断计数）
        document.addEventListener('visibilitychange', onVisibilityChange);

        // 启动专注检测心跳
        startFocusDetection();

        // 启动衰减定时器（通过 C 的 GameLogic.tick + tickFocus）
        tickInterval = setInterval(doTick, TICK_INTERVAL_MS);

        // 演化检查（模块4）
        checkEvolution();

        console.log('茸学伴 已启动 — 专注星系统 + 共场陪伴 + 状态镜像 + 状态记录 + 长期演化');
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
