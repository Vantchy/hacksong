/**
 * app.js — 核心交互逻辑
 * ===== [B] 全部文件归 B 全权负责 =====
 * B 调用 C 的 GameLogic 和 Storage 公开接口
 * A 不涉及此文件，但此文件引用了 A 定义的 HTML id
 * =====================================
 *
 * 本文件在契约版 app.js 基础上扩展了"茸学伴"4大模块：
 *   模块1：共场陪伴 + 走神检测（Page Visibility API + 鼠标键盘空闲检测）
 *   模块2：状态镜像对话（规则引擎 + 极小启动动作）
 *   模块3：状态记录（学习结束 emoji 记录 + 自动采集数据）
 *   模块4：长期陪伴演化（画像 + 个性化行为触发）
 *
 * 契约遵守：
 *   - 仅引用 A 定义的 HTML id（level/xp/pet-sprite/hunger-fill 等）
 *   - 4大模块的 DOM 通过 JS 动态创建，使用全新 id（companion-*/mirror-*/record-*/profile-*），
 *     不与 A 现有 id 冲突
 *   - 所有数据操作通过 C 的 GameLogic / Storage 全局对象，绝不直接调用 localStorage
 *   - 状态字段使用契约定义的 focusTime / mood / interruptions
 */

(function () {
    'use strict';

    // ===== [B] DOM 引用（引用 A 定义的 id） =====
    // [A+B] 以下 id 与 HTML 绑定，A 改名需通知 B
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

        // [B] A 的容器，用于挂载4大模块的动态 DOM
        app:    $('app'),
        petArea: $('pet-area')
    };

    // ===== [B] 状态变量 =====
    let gameState = null;      // [B] 状态对象，字段结构由 [A+B+C] 契约定义
    let tickInterval = null;   // [B] 衰减定时器句柄
    const TICK_INTERVAL_MS = 5 * 60 * 1000; // [B] 5分钟衰减一次

    // ===== [B] 模块1-4 内部运行变量 =====
    let companionActive = false;       // 共学模式是否开启
    let focusSeconds = 0;              // 本次专注累计秒数（focusTime 字段为分钟）
    let lastActivity = Date.now();     // 最近一次鼠标/键盘活动时间
    let wasIdle = false;               // 当前是否处于走神态
    let companionTimer = null;         // 共学模式1秒心跳
    let bubbleTimer = null;            // 气泡显示计时器
    let breatheTimer = null;           // 深呼吸倒计时
    let breatheRemaining = 0;          // 深呼吸剩余秒
    let lastFidgetWarn = 0;            // 上次翻身提醒时间（防刷屏）

    // 走神判定阈值（秒）·演示用20s，正式建议120-300s
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
        el.petName.textContent = '🐾 ' + s.name;

        // 属性条
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

        // 警告消息（共学模式时不覆盖走神/专注状态消息）
        if (!companionActive) {
            const warning = GameLogic.getWarning(s);
            if (warning) {
                el.message.textContent = warning;
            }
        }
    }

    // ===== [B] 更新宠物外观 =====
    function updatePetAppearance(s) {
        const sprite = el.petSprite;

        // 移除所有动画 class（A 定义的契约类名）
        sprite.className = '';

        if (companionActive) {
            // 共学模式：专注时打盹，走神时显示病恹恹抖动
            if (wasIdle) {
                sprite.textContent = '😮';
                sprite.classList.add('pet-sick');
            } else {
                sprite.textContent = '😴';
                sprite.classList.add('pet-sleeping');
            }
            return;
        }

        if (s.isSleeping) {
            sprite.textContent = '💤';
            sprite.classList.add('pet-sleeping');
        } else if (s.health < 30) {
            sprite.textContent = '😷';
            sprite.classList.add('pet-sick');
        } else if (s.happiness > 70) {
            sprite.textContent = '😊';
            sprite.classList.add('pet-normal');
        } else if (s.happiness < 30) {
            sprite.textContent = '😢';
            sprite.classList.add('pet-normal');
        } else {
            sprite.textContent = '😐';
            sprite.classList.add('pet-normal');
        }
    }

    // ===== [B] 触发快乐动画 =====
    function triggerHappyAnimation() {
        const sprite = el.petSprite;
        sprite.className = '';
        sprite.textContent = '🥳';
        sprite.classList.add('pet-happy');
        setTimeout(() => {
            if (gameState) updatePetAppearance(gameState);
        }, 600);
    }

    // ===== [B] 显示消息（A 定义的 #pet-message 气泡）=====
    function showMessage(text, isImportant) {
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
     * ============================================================ */
    function handleAction(actionKey) {
        if (!gameState) return;
        // 共学模式中禁用普通操作按钮
        if (companionActive) {
            showMessage('共学模式中，先结束本次学习吧');
            return;
        }
        const result = GameLogic.performAction(gameState, actionKey);
        gameState = result.state;
        render();
        showMessage(result.message);
        triggerHappyAnimation();
        // 自动保存（通过 C 的 Storage 接口）
        saveGameState();
    }

    // ===== [B+C] 定时衰减（调用 C 的 GameLogic 接口）=====
    function doTick() {
        if (!gameState) return;
        const previousHealth = gameState.health;
        gameState = GameLogic.tick(gameState, 5);
        // 如果重置了（健康归零）
        if (!gameState.level) {
            gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
            showMessage('💫 宠物涅槃重生！');
        } else if (gameState.health < previousHealth) {
            const warning = GameLogic.getWarning(gameState);
            if (warning && !companionActive) showMessage(warning);
        }
        render();
        saveGameState();
    }

    // ===== [B+C] 存档操作（调用 C 的 Storage 接口）=====
    function handleSave() {
        if (!gameState) return;
        const ok = saveGameState();
        showMessage(ok ? '✅ 保存成功！' : '❌ 保存失败');
    }

    function handleLoad() {
        const data = Storage.load();
        if (data) {
            gameState = data;
            // 恢复附加的 profile 数据
            if (data._bProfile) profile = data._bProfile;
            render();
            renderProfile();
            showMessage('📂 读档成功！');
        } else {
            showMessage('❌ 没有找到存档');
        }
    }

    function handleReset() {
        if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return;
        Storage.clear();
        gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
        profile = { sessions: [], focusUpperLimit: 0, weekdayStats: {} };
        render();
        renderProfile();
        showMessage('🗑️ 已重置');
    }

    // ===== [B] 保存状态（附加 _bProfile，通过 C 的 Storage 接口）=====
    function saveGameState() {
        // 将 _bProfile 附加到 gameState 一起持久化（C 的 spread 操作会保留额外字段）
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

        // 最多计算 24 小时的离线时间
        const cappedMinutes = Math.min(minutesElapsed, 24 * 60);
        const ticks = Math.floor(cappedMinutes / 5);

        let state = saved;
        for (let i = 0; i < ticks; i++) {
            state = GameLogic.tick(state, 5);
        }

        // 增加年龄（根据离线时间）
        state.age = saved.age + Math.floor(minutesElapsed / (24 * 60));

        gameState = state;
        // 恢复 profile
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
     * 模块1：共场陪伴 + 走神检测（B 核心实现）
     * 技术方案：Page Visibility API + 鼠标键盘空闲检测
     * ============================================================ */

    // 动态创建共学面板 DOM（使用全新 id，不与 A 冲突）
    function initCompanionUI() {
        const panel = document.createElement('section');
        panel.id = 'companion-panel';
        panel.style.cssText = 'margin-bottom:16px;padding:16px;background:#f3f8e9;border-radius:14px;';
        panel.innerHTML = `
            <div style="text-align:center;">
                <div id="focus-time" style="font-size:2rem;font-weight:700;color:#2e7d32;font-variant-numeric:tabular-nums;">00:00</div>
                <div style="display:flex;justify-content:space-around;margin:8px 0;font-size:0.85rem;color:#666;">
                    <span>中断 <b id="interrupt-count" style="color:#333;font-size:1rem;">0</b> 次</span>
                    <span>状态 <b id="focus-state" style="color:#333;font-size:1rem;">空闲</b></span>
                </div>
                <div id="focus-status" style="font-size:0.85rem;color:#666;min-height:20px;margin-bottom:10px;">点开启共学，茸茸就趴在屏幕边陪你</div>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="action-btn" id="btn-companion" style="background:#66bb6a;color:#fff;">开启共学模式</button>
                    <button class="action-btn" id="btn-end-companion" style="opacity:0.5;" disabled>结束本次</button>
                </div>
            </div>
        `;
        // 插入到属性面板之后
        el.app.insertBefore(panel, el.app.querySelector('#actions'));

        // 绑定事件
        $('btn-companion').addEventListener('click', startCompanion);
        $('btn-end-companion').addEventListener('click', endCompanion);
    }

    // 开启共学模式
    function startCompanion() {
        if (companionActive) return;
        companionActive = true;
        focusSeconds = 0;
        gameState.interruptions = 0;
        wasIdle = false;
        lastActivity = Date.now();

        $('btn-companion').disabled = true;
        $('btn-companion').style.opacity = '0.5';
        $('btn-end-companion').disabled = false;
        $('btn-end-companion').style.opacity = '1';

        $('focus-status').textContent = '茸茸趴下了 · 你专注时它打盹，走神时它看你一眼';
        $('focus-status').style.color = '#2e7d32';
        $('focus-state').textContent = '专注中';
        showMessage('开工啦，我趴这儿陪你');

        // 启动1秒心跳：专注计时 + 走神检测
        companionTimer = setInterval(companionTick, 1000);
        render();
    }

    // 结束共学模式 → 触发模块3状态记录
    function endCompanion() {
        if (!companionActive) return;
        companionActive = false;
        clearInterval(companionTimer);
        companionTimer = null;

        // 宠物伸懒腰（用 happy 动画近似）
        triggerHappyAnimation();
        $('focus-status').textContent = '本次结束 · 茸茸伸了个懒腰';
        $('focus-status').style.color = '#666';
        $('focus-state').textContent = '空闲';

        $('btn-companion').disabled = false;
        $('btn-companion').style.opacity = '1';
        $('btn-end-companion').disabled = true;
        $('btn-end-companion').style.opacity = '0.5';

        showMessage('辛苦啦，伸个懒腰～');

        // 记录本次会话 + 弹出情绪记录（模块3）
        recordSession();
        showMoodRecord();
        render();
    }

    // 共学模式1秒心跳：专注计时 + 走神检测 + 专注上限提醒
    function companionTick() {
        if (!companionActive) return;

        // 1) 专注秒数累加，每满60秒写入 focusTime（契约字段，单位分钟）
        focusSeconds += 1;
        if (focusSeconds % 60 === 0) {
            gameState.focusTime = Math.floor(focusSeconds / 60);
            saveGameState();
        }

        // 2) 更新专注时长显示
        const m = Math.floor(focusSeconds / 60);
        const s = focusSeconds % 60;
        $('focus-time').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        $('interrupt-count').textContent = gameState.interruptions;

        // 3) 走神检测
        checkIdle();

        // 4) 专注上限提醒（模块4演化雏形）
        checkFocusLimit();
    }

    // 走神检测：鼠标/键盘活动重置
    function resetActivity() {
        lastActivity = Date.now();
        if (wasIdle && companionActive) {
            // 用户回来 → 宠物重新趴下打盹
            wasIdle = false;
            $('focus-state').textContent = '专注中';
            $('focus-status').textContent = '欢迎回来 · 茸茸继续趴着陪你';
            $('focus-status').style.color = '#2e7d32';
            render();
        }
    }

    // 走神判定
    function checkIdle() {
        if (!companionActive) return;
        const idleSec = (Date.now() - lastActivity) / 1000;
        if (idleSec >= IDLE_THRESHOLD && !wasIdle) {
            // 走神 → 宠物抬头看你一眼（用 sick 动画近似"看你一眼"），继续趴下
            wasIdle = true;
            showMessage('（看了你一眼）还在吗？');
            $('focus-state').textContent = '走神了';
            $('focus-status').textContent = '茸茸发现你走神了 · 不催你，回来就好';
            $('focus-status').style.color = '#f57c00';
            render();
            // 2秒后恢复打盹姿态
            setTimeout(() => {
                if (companionActive && wasIdle) { wasIdle = false; render(); }
            }, 2200);
        }
    }

    // 标签页可见性 → 切走记为中断
    function onVisibilityChange() {
        if (document.hidden && companionActive) {
            gameState.interruptions += 1;
            $('focus-status').textContent = '检测到切换页面 · 记一次中断（不打扰你）';
            $('focus-status').style.color = '#f57c00';
            $('interrupt-count').textContent = gameState.interruptions;
        } else if (!document.hidden && companionActive) {
            lastActivity = Date.now();
            wasIdle = false;
            $('focus-status').textContent = '回来啦 · 茸茸一直在这儿';
            $('focus-status').style.color = '#2e7d32';
            $('focus-state').textContent = '专注中';
            render();
        }
    }

    // 专注超限提醒（模块4 演化雏形：发现专注上限约45分钟，第40分钟开始翻身）
    function checkFocusLimit() {
        if (!companionActive) return;
        if (focusSeconds === FOCUS_WARN_AT && Date.now() - lastFidgetWarn > 60000) {
            lastFidgetWarn = Date.now();
            triggerHappyAnimation();
            showMessage('坐不住了…要不歇1分钟？');
        }
    }

    /* ============================================================
     * 模块2：状态镜像对话（B 核心实现 · 规则引擎）
     * 点击宠物 → 弹出输入框 → 规则匹配 → 宠物回应 + 极小启动动作
     * ============================================================ */

    // 规则引擎
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

    // 动态创建镜像对话面板 DOM
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
        // 插入到共学面板之后（或 actions 之前）
        el.app.insertBefore(panel, el.app.querySelector('#actions'));

        // 添加深呼吸动画 keyframes（动态注入，不碰 A 的 CSS 文件）
        const style = document.createElement('style');
        style.textContent = '@keyframes breatheCircle{0%,100%{transform:scale(.85);}50%{transform:scale(1.15);}}';
        document.head.appendChild(style);

        // 绑定事件
        $('btn-submit-mood').addEventListener('click', submitMood);
        $('mood-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitMood();
        });
    }

    // 提交状态镜像对话
    function submitMood() {
        const input = $('mood-input');
        const text = (input.value || '').trim();
        if (!text) { showMessage('跟茸茸说一句嘛'); return; }
        const rule = matchRule(text);

        // 宠物回应
        const resp = $('mirror-resp');
        resp.innerHTML = '茸茸：<b style="color:#e65100;">' + rule.resp + '</b>';
        resp.classList.add('show');
        resp.style.display = 'block';

        // 同步气泡 + 动画
        showMessage(rule.resp);
        triggerHappyAnimation();

        // 执行极小启动动作
        runStartupAction(rule.action);
        input.value = '';
    }

    // 极小启动动作
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

    // 深呼吸倒计时启动动作
    function startBreatheTimer() {
        const timerEl = $('breathe-timer');
        timerEl.style.display = 'block';
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
     * 模块3：状态记录（B 核心实现）
     * 学习结束后 → 三个表情按钮 → 点击即记录 + 自动采集数据
     * ============================================================ */

    // 动态创建情绪记录面板 DOM
    function initRecordUI() {
        const panel = document.createElement('section');
        panel.id = 'record-panel';
        panel.style.cssText = 'display:none;margin-bottom:16px;padding:16px;background:#fce4ec;border-radius:14px;text-align:center;';
        panel.innerHTML = `
            <p style="margin:0 0 12px;font-size:0.9rem;color:#666;">本次学习结束啦，现在感觉怎么样？</p>
            <div style="display:flex;gap:14px;justify-content:center;">
                <button class="action-btn" data-mood="happy" title="不错" style="font-size:1.8rem;padding:8px 14px;">😊</button>
                <button class="action-btn" data-mood="neutral" title="一般" style="font-size:1.8rem;padding:8px 14px;">😐</button>
                <button class="action-btn" data-mood="sad" title="不太好" style="font-size:1.8rem;padding:8px 14px;">😫</button>
            </div>
        `;
        el.app.insertBefore(panel, el.app.querySelector('#actions'));

        // 绑定情绪按钮
        panel.querySelectorAll('[data-mood]').forEach(btn => {
            btn.addEventListener('click', () => recordMood(btn.dataset.mood));
        });
    }

    function showMoodRecord() {
        $('record-panel').style.display = 'block';
    }

    function hideMoodRecord() {
        $('record-panel').style.display = 'none';
    }

    // 记录情绪（写入契约字段 mood）
    function recordMood(mood) {
        gameState.mood = mood;
        // 记入本次会话
        const last = profile.sessions[profile.sessions.length - 1];
        if (last) last.mood = mood;
        saveGameState();

        hideMoodRecord();
        const faceCh = mood === 'happy' ? '😊' : (mood === 'neutral' ? '😐' : '😫');
        showMessage(mood === 'happy' ? '收到啦，记下了 😊' :
                    mood === 'neutral' ? '嗯，记下了，辛苦了' : '抱抱，明天会好一点');
        triggerHappyAnimation();
        renderProfile();
    }

    // 记录一次学习会话（自动采集：专注时长、中断次数、时间段）
    function recordSession() {
        const focusMin = Math.floor(focusSeconds / 60);
        if (focusMin < 1) return; // 不足1分钟不记录

        const now = new Date();
        const session = {
            date: now.toISOString().slice(0, 10),
            startHour: now.getHours(),
            focusMin: focusMin,
            interruptions: gameState.interruptions,
            mood: 'neutral'
        };
        profile.sessions.push(session);

        // 更新专注上限（模块4 演化数据）
        if (focusMin > profile.focusUpperLimit) {
            profile.focusUpperLimit = focusMin;
        }

        // 周X统计（模块4 演化数据：发现周X下午状态最差）
        const wd = now.getDay();
        if (!profile.weekdayStats[wd]) profile.weekdayStats[wd] = { focusMin: 0, count: 0 };
        profile.weekdayStats[wd].focusMin += focusMin;
        profile.weekdayStats[wd].count += 1;

        saveGameState();
    }

    /* ============================================================
     * 模块4：长期陪伴演化（B 提供数据入口与触发，加分项）
     * ============================================================ */

    // 动态创建画像面板 DOM
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
        if (profile.sessions.length === 0) {
            panel.innerHTML = '<span style="color:#888;font-style:italic;">还没有学习记录 · 茸茸会慢慢了解你</span>';
            return;
        }

        // 计算画像维度
        const total = profile.sessions.length;
        const totalFocus = profile.sessions.reduce((s, x) => s + x.focusMin, 0);
        const avgFocus = Math.round(totalFocus / total);

        // 哪个时间段专注最长
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

        // 哪种情绪启动最快
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

        // 最近3次是否都在当前时段(±1小时)
        const recent = profile.sessions.slice(-3);
        const sameTime = recent.every(s => Math.abs(s.startHour - hour) <= 1);
        if (sameTime) {
            setTimeout(() => showMessage('你又在这个时候来啦，茸茸早等着你了'), 800);
            return;
        }

        // 周二下午状态最差 → 主动问候
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
            // 尝试普通加载
            const saved = Storage.load();
            if (saved) {
                gameState = saved;
                if (saved._bProfile) profile = saved._bProfile;
                showMessage('📂 欢迎回来！');
            } else {
                gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
                showMessage('🎉 欢迎！你的小宠物诞生了！');
            }
        }

        render();

        // 如果离线加载没有设置消息，设置默认消息
        if (!hasOffline) {
            const warning = GameLogic.getWarning(gameState);
            if (warning && !companionActive) {
                el.message.textContent = warning;
            }
        }

        // 绑定操作按钮事件（A 定义的 .action-btn，B 通过 data-action 读取）
        el.actionBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                handleAction(this.dataset.action);
            });
        });

        el.saveBtn.addEventListener('click', handleSave);
        el.loadBtn.addEventListener('click', handleLoad);
        el.resetBtn.addEventListener('click', handleReset);

        // 初始化4大模块 UI（动态创建 DOM，使用全新 id）
        initCompanionUI();    // 模块1：共场陪伴
        initMirrorUI();       // 模块2：状态镜像对话
        initRecordUI();       // 模块3：状态记录
        initProfileUI();      // 模块4：长期画像

        // 渲染画像
        renderProfile();

        // 模块1：点击宠物 → 弹出状态镜像对话
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

        // 模块1：走神检测 — 鼠标/键盘活动监听
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
            document.addEventListener(evt, resetActivity, { passive: true });
        });
        // 模块1：标签页可见性
        document.addEventListener('visibilitychange', onVisibilityChange);

        // 启动衰减定时器（通过 C 的 GameLogic.tick）
        tickInterval = setInterval(doTick, TICK_INTERVAL_MS);

        // 演化检查（模块4）
        checkEvolution();

        console.log('🐾 茸学伴 已启动 — 共场陪伴 · 状态镜像 · 状态记录 · 长期演化');
    }

    // ===== [B] 页面关闭时保存（通过 C 的 Storage 接口）=====
    window.addEventListener('beforeunload', function () {
        if (gameState) {
            saveGameState();
        }
    });

    // ===== [B] 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
