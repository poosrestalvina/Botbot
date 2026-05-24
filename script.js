(function () {
    'use strict';

    const chatBody     = document.getElementById('chatBody');
    const chatStatus   = document.getElementById('chatStatus');
    const actions      = document.getElementById('actions');
    const navCity      = document.getElementById('navCity');
    const onlineDot    = document.querySelector('.nav-online-dot');
    const onlineCount  = document.getElementById('onlineCount');
    const timerEl      = document.getElementById('timer');
    const urgencyEl    = document.getElementById('urgency');
    const statusTime   = document.getElementById('statusTime');
    const emojiBurst   = document.getElementById('emojiBurst');

    // ===== Системный статус-бар (часы) =====
    function updateStatusTime() {
        const d = new Date();
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        statusTime.textContent = h + ':' + m;
    }
    updateStatusTime();
    setInterval(updateStatusTime, 30000);

    // ===== Геолокация по часовому поясу =====
    const cityByTz = {
        'Europe/Moscow':       'Москва',
        'Europe/Kaliningrad':  'Калининград',
        'Europe/Samara':       'Самара',
        'Europe/Volgograd':    'Волгоград',
        'Europe/Saratov':      'Саратов',
        'Europe/Astrakhan':    'Астрахань',
        'Europe/Ulyanovsk':    'Ульяновск',
        'Europe/Kirov':        'Киров',
        'Europe/Minsk':        'Минск',
        'Europe/Kiev':         'Киев',
        'Europe/Simferopol':   'Симферополь',
        'Asia/Yekaterinburg':  'Екатеринбург',
        'Asia/Omsk':           'Омск',
        'Asia/Novosibirsk':    'Новосибирск',
        'Asia/Krasnoyarsk':    'Красноярск',
        'Asia/Irkutsk':        'Иркутск',
        'Asia/Yakutsk':        'Якутск',
        'Asia/Vladivostok':    'Владивосток',
        'Asia/Magadan':        'Магадан',
        'Asia/Almaty':         'Алматы',
        'Asia/Tashkent':       'Ташкент',
        'Asia/Baku':           'Баку',
        'Asia/Tbilisi':        'Тбилиси',
        'Asia/Yerevan':        'Ереван'
    };

    let userCity = '';
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        userCity = cityByTz[tz] || '';
    } catch (e) {}

    if (userCity && navCity) {
        navCity.textContent = ', ' + userCity;
    }

    // ===== Социальное доказательство (живой счётчик) =====
    let online = 200 + Math.floor(Math.random() * 80);
    onlineCount.textContent = online;

    setInterval(() => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        online = Math.max(180, Math.min(310, online + delta));
        onlineCount.textContent = online;
        onlineCount.classList.add('flash');
        setTimeout(() => onlineCount.classList.remove('flash'), 400);
    }, 2500);

    // ===== Звук уведомления через Web Audio (без файлов) =====
    let audioCtx = null;
    function playPing(type) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            if (type === 'msg') {
                o.frequency.setValueAtTime(880, now);
                o.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
            } else {
                o.frequency.setValueAtTime(660, now);
            }
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            o.start(now);
            o.stop(now + 0.3);
        } catch (e) {}
    }

    // Web Audio в браузерах требует жеста пользователя — стартуем при первом тапе
    let audioUnlocked = false;
    function unlockAudio() {
        if (audioUnlocked) return;
        audioUnlocked = true;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        } catch (e) {}
    }
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('click',      unlockAudio, { once: true });

    // ===== Утилиты =====
    function nowTime() {
        const d = new Date();
        return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
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

    function setStatus(text, mode) {
        chatStatus.textContent = text;
        chatStatus.classList.remove('online', 'typing');
        if (mode) chatStatus.classList.add(mode);
    }

    function showTyping() {
        if (document.getElementById('typing')) return;
        const node = document.createElement('div');
        node.className = 'typing-indicator';
        node.id = 'typing';
        node.innerHTML = '<span></span><span></span><span></span>';
        chatBody.appendChild(node);
        setStatus('печатает...', 'typing');
        scrollToBottom();
    }

    function hideTyping() {
        const t = document.getElementById('typing');
        if (t) t.remove();
        setStatus('в сети', 'online');
    }

    function addMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'msg';
        msg.innerHTML = '<span class="msg-text">' + escapeHtml(text) + '</span><span class="time">' + nowTime() + '</span>';
        chatBody.appendChild(msg);
        scrollToBottom();

        if ('vibrate' in navigator) {
            try { navigator.vibrate([60, 30, 60]); } catch (e) {}
        }
        playPing('msg');
    }

    function showActions() {
        actions.hidden = false;
        scrollToBottom();
        startTimer();
        triggerEmojiBurst();
        if ('vibrate' in navigator) {
            try { navigator.vibrate([40, 20, 40, 20, 80]); } catch (e) {}
        }
    }

    // ===== Таймер срочности =====
    function startTimer() {
        let total = 5 * 60 - 1; // 04:59
        function tick() {
            const m = String(Math.floor(total / 60)).padStart(2, '0');
            const s = String(total % 60).padStart(2, '0');
            timerEl.textContent = m + ':' + s;
            if (total <= 30) urgencyEl.classList.add('warn');
            if (total <= 0) return;
            total--;
            setTimeout(tick, 1000);
        }
        tick();
    }

    // ===== Эмодзи-салют =====
    function triggerEmojiBurst() {
        const emojis = ['💖', '❤️', '💕', '💗', '✨', '🎉', '🌹', '😍', '💋'];
        const count = 18;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'burst';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            const angle = (Math.PI * (i / count)) + Math.PI; // верхняя полусфера
            const dist  = 120 + Math.random() * 100;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist - 40;
            el.style.setProperty('--tx', tx + 'px');
            el.style.setProperty('--ty', ty + 'px');
            el.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
            el.style.animationDelay = (Math.random() * 0.15) + 's';
            el.style.fontSize = (22 + Math.random() * 18) + 'px';
            emojiBurst.appendChild(el);
            setTimeout(() => el.remove(), 2200);
        }
    }

    // ===== Сценарий =====
    // t=0     → "была недавно"
    // t=0.8с  → онлайн-индикатор + "в сети"
    // t=1.5с  → "печатает..."
    // t=3.0с  → 1-е сообщение
    // t=5.5с  → "печатает..."
    // t=8.0с  → 2-е сообщение + кнопки + таймер + салют

    setTimeout(() => {
        if (onlineDot) onlineDot.classList.add('show');
        setStatus('в сети', 'online');
    }, 800);

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

    // ===== Кнопки: read receipts + редирект =====
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                btn.classList.add('clicked');
                if ('vibrate' in navigator) {
                    try { navigator.vibrate([30, 30, 60]); } catch (e) {}
                }
                playPing('tap');
                setTimeout(() => { window.location.href = href; }, 350);
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
