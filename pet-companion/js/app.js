/**
 * app.js — 核心交互逻辑
 * 负责：按钮绑定、状态更新、动画触发、UI 渲染
 */

(function () {
    'use strict';

    // ===== DOM 引用 =====
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
        resetBtn:   $('reset-btn')
    };

    // ===== 状态 =====
    let gameState = null;
    let tickInterval = null;
    const TICK_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟

    // ===== 渲染 UI =====
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

        // 警告消息
        const warning = GameLogic.getWarning(s);
        if (warning) {
            el.message.textContent = warning;
        }
    }

    // ===== 更新宠物外观 =====
    function updatePetAppearance(s) {
        const sprite = el.petSprite;

        // 移除所有动画 class
        sprite.className = '';

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

    // ===== 触发快乐动画 =====
    function triggerHappyAnimation() {
        const sprite = el.petSprite;
        sprite.className = '';
        sprite.textContent = '🥳';
        sprite.classList.add('pet-happy');
        setTimeout(() => {
            if (gameState) updatePetAppearance(gameState);
        }, 600);
    }

    // ===== 显示消息 =====
    function showMessage(text, isImportant) {
        el.message.textContent = text;
        el.message.style.opacity = 0;
        el.message.style.transform = 'translateY(5px)';
        requestAnimationFrame(() => {
            el.message.style.opacity = 1;
            el.message.style.transform = 'translateY(0)';
        });
    }

    // ===== 执行操作 =====
    function handleAction(actionKey) {
        if (!gameState) return;
        const result = GameLogic.performAction(gameState, actionKey);
        gameState = result.state;
        render();
        showMessage(result.message);
        triggerHappyAnimation();
        // 自动保存
        Storage.save(gameState);
    }

    // ===== 游戏嘀嗒（倒计时衰减） =====
    function doTick() {
        if (!gameState) return;
        const previousHealth = gameState.health;
        gameState = GameLogic.tick(gameState, 5);
        // 如果重置了（健康归零）
        if (!gameState.level) {
            gameState.createdAt = Date.now();
            showMessage('💫 宠物涅槃重生！');
        } else if (gameState.health < previousHealth) {
            const warning = GameLogic.getWarning(gameState);
            if (warning) showMessage(warning);
        }
        render();
        Storage.save(gameState);
    }

    // ===== 存档操作 =====
    function handleSave() {
        if (!gameState) return;
        const ok = Storage.save(gameState);
        showMessage(ok ? '✅ 保存成功！' : '❌ 保存失败');
    }

    function handleLoad() {
        const data = Storage.load();
        if (data) {
            gameState = data;
            render();
            showMessage('📂 读档成功！');
        } else {
            showMessage('❌ 没有找到存档');
        }
    }

    function handleReset() {
        if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return;
        Storage.clear();
        gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
        render();
        showMessage('🗑️ 已重置');
    }

    // ===== 计算离线收益 =====
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
        render();

        if (minutesElapsed >= 1) {
            const hours = Math.floor(minutesElapsed / 60);
            const mins = minutesElapsed % 60;
            const timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
            showMessage(`⏰ 你离开了 ${timeStr}，宠物好想你！`);
        }
        return true;
    }

    // ===== 初始化 =====
    function init() {
        // 尝试加载存档
        const hasOffline = applyOfflineProgress();

        if (!gameState) {
            // 尝试普通加载
            const saved = Storage.load();
            if (saved) {
                gameState = saved;
                showMessage('📂 欢迎回来！');
            } else {
                gameState = { ...GameLogic.defaultState, createdAt: Date.now() };
                showMessage('🎉 欢迎！你的新宠物诞生了！');
            }
        }

        render();

        // 如果离线加载没有设置消息，设置默认消息
        if (!hasOffline) {
            const warning = GameLogic.getWarning(gameState);
            if (warning) {
                el.message.textContent = warning;
            }
        }

        // 绑定按钮事件
        el.actionBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                handleAction(this.dataset.action);
            });
        });

        el.saveBtn.addEventListener('click', handleSave);
        el.loadBtn.addEventListener('click', handleLoad);
        el.resetBtn.addEventListener('click', handleReset);

        // 启动定时器
        tickInterval = setInterval(doTick, TICK_INTERVAL_MS);

        console.log('🐾 Pet Companion 已启动');
    }

    // ===== 页面关闭时保存 =====
    window.addEventListener('beforeunload', function () {
        if (gameState) {
            Storage.save(gameState);
        }
    });

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();