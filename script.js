(function () {
    'use strict';

    const chatBody = document.getElementById('chatBody');
    const chatStatus = document.getElementById('chatStatus');
    const actions = document.getElementById('actions');
    const pushNotif = document.getElementById('pushNotif');
    const pushMsg = pushNotif ? pushNotif.querySelector('.push-msg') : null;

    function nowTime() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    function showTyping() {
        const node = document.createElement('div');
        node.className = 'typing-indicator';
        node.id = 'typing';
        node.innerHTML = '<span></span><span></span><span></span>';
        chatBody.appendChild(node);
        chatStatus.textContent = 'печатает...';
        chatStatus.classList.add('typing');
        scrollToBottom();
    }

    function hideTyping() {
        const t = document.getElementById('typing');
        if (t) t.remove();
        chatStatus.textContent = 'в сети';
        chatStatus.classList.remove('typing');
    }

    function addMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'msg';
        msg.innerHTML = `${escapeHtml(text)}<span class="time">${nowTime()}</span>`;
        chatBody.appendChild(msg);
        scrollToBottom();

        // Лёгкая вибрация на мобильных
        if ('vibrate' in navigator) {
            try { navigator.vibrate(40); } catch (e) {}
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function scrollToBottom() {
        // Небольшая задержка, чтобы DOM успел обновиться
        requestAnimationFrame(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    function showActions() {
        actions.hidden = false;
        scrollToBottom();
    }

    function showPush(text) {
        if (!pushNotif) return;
        if (pushMsg) pushMsg.textContent = text;
        pushNotif.hidden = false;
        // даём браузеру отрисовать состояние, потом включаем анимацию
        requestAnimationFrame(() => {
            requestAnimationFrame(() => pushNotif.classList.add('show'));
        });
        // авто-скрытие через 2.5 секунды
        setTimeout(() => {
            pushNotif.classList.remove('show');
            setTimeout(() => { pushNotif.hidden = true; }, 500);
        }, 2500);

        if ('vibrate' in navigator) {
            try { navigator.vibrate([60, 40, 60]); } catch (e) {}
        }
    }

    // === Сценарий ===
    // 0.2с — push-уведомление сверху
    // 0.4с — индикатор "печатает"
    // 1.0с — первое сообщение
    // 1.6с — снова "печатает"
    // 2.5с — второе сообщение, появляются кнопки

    setTimeout(() => showPush('Привет! Ты из моего города?'), 200);

    setTimeout(showTyping, 400);

    setTimeout(() => {
        hideTyping();
        addMessage('Привет! Ты из моего города?');
    }, 1000);

    setTimeout(showTyping, 1600);

    setTimeout(() => {
        hideTyping();
        addMessage('Я тут новенькая, ищу парня для общения прямо сейчас. Ты не против?');
        setTimeout(showActions, 250);
    }, 2500);

    // Клик по любой кнопке ведёт по href из HTML — дополнительная логика не нужна,
    // но можно добавить тактильный отклик
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if ('vibrate' in navigator) {
                try { navigator.vibrate(30); } catch (e) {}
            }
        });
    });

    // Защита от двойного тапа (зум на iOS)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
})();
