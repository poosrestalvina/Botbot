(function () {
    'use strict';

    const chatBody = document.getElementById('chatBody');
    const chatStatus = document.getElementById('chatStatus');
    const actions = document.getElementById('actions');

    function nowTime() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    function showTyping() {
        // не плодим дублей
        if (document.getElementById('typing')) return;
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
        chatStatus.classList.add('online');
    }

    function addMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'msg';
        msg.innerHTML = `<span class="msg-text">${escapeHtml(text)}</span><span class="time">${nowTime()}</span>`;
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
        requestAnimationFrame(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    function showActions() {
        actions.hidden = false;
        scrollToBottom();
    }

    // === Сценарий с увеличенными паузами ===
    // Чувствуется как реальная переписка: девушка действительно "печатает"
    //
    //   t=1.5с  → начинает печатать
    //   t=3.0с  → 1-е сообщение: "Привет! Ты из моего города?"
    //   t=5.5с  → снова печатает (пауза перед вторым)
    //   t=8.0с  → 2-е сообщение + появляются кнопки

    setTimeout(showTyping, 1500);

    setTimeout(() => {
        hideTyping();
        addMessage('Привет! Ты из моего города?');
    }, 3000);

    setTimeout(showTyping, 5500);

    setTimeout(() => {
        hideTyping();
        addMessage('Я тут новенькая, ищу парня для общения прямо сейчас. Ты не против?');
        setTimeout(showActions, 400);
    }, 8000);

    // Тактильный отклик при клике на кнопки
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
