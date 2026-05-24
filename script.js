(function () {
    'use strict';

    const REDIRECT_URL = 'https://skrotrack.com/click';

    const chatBody     = document.getElementById('chatBody');
    const chatInner    = document.getElementById('chatInner');
    const chatStatus   = document.getElementById('chatStatus');
    const actions      = document.getElementById('actions');
    const navCity      = document.getElementById('navCity');
    const onlineDot    = document.querySelector('.nav-online-dot');
    const distanceEl   = document.getElementById('distance');
    const rivalsEl     = document.getElementById('rivals');
    const timerEl      = document.getElementById('timer');
    const urgencyEl    = document.getElementById('urgency');
    const statusTime   = document.getElementById('statusTime');
    const emojiBurst   = document.getElementById('emojiBurst');
    const matchOverlay = document.getElementById('matchOverlay');

    // ===== Системный статус-бар (часы) =====
    function updateStatusTime() {
        const d = new Date();
        statusTime.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
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
    if (userCity && navCity) navCity.textContent = ', ' + userCity;

    // ===== Случайная "близость" 0.4–2.5 км =====
    function setDistance() {
        const d = (0.4 + Math.random() * 2.1).toFixed(1);
        distanceEl.textContent = d;
    }
    setDistance();

    // ===== Счётчик соперников: 3 → 4 → 5 → 4 ... (live ревность) =====
    let rivals = 3;
    rivalsEl.textContent = rivals;
    setInterval(() => {
        // 60% шанс +1, 40% -1, диапазон 3–7
        const goUp = Math.random() < 0.6;
        rivals = goUp ? Math.min(7, rivals + 1) : Math.max(3, rivals - 1);
        rivalsEl.textContent = rivals;
        rivalsEl.classList.add('flash');
        setTimeout(() => rivalsEl.classList.remove('flash'), 400);
    }, 4000);

    // ===== Звук уведомления через Web Audio =====
    let audioCtx = null, audioUnlocked = false;
    function unlockAudio() {
        if (audioUnlocked) return;
        audioUnlocked = true;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        } catch (e) {}
    }
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
            } else if (type === 'match') {
                o.frequency.setValueAtTime(523, now);
                o.frequency.exponentialRampToValueAtTime(784, now + 0.15);
                o.frequency.exponentialRampToValueAtTime(1047, now + 0.3);
            } else {
                o.frequency.setValueAtTime(660, now);
            }
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            o.start(now);
            o.stop(now + 0.45);
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
        // Без smooth — на мобилках программный плавный скролл может блокировать
        // последующие пользовательские свайпы.
        requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
    }
    function scrollToElement(el) {
        requestAnimationFrame(() => {
            // offsetTop относится к offsetParent (внутреннему .chat-inner),
            // поэтому считаем смещение через getBoundingClientRect.
            const containerTop = chatBody.getBoundingClientRect().top;
            const elTop = el.getBoundingClientRect().top;
            chatBody.scrollTop += (elTop - containerTop) - 8;
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
        chatInner.appendChild(node);
        setStatus('печатает...', 'typing');
        scrollToBottom();
    }
    function hideTyping() {
        const t = document.getElementById('typing');
        if (t) t.remove();
        setStatus('в сети', 'online');
    }

    function addMessage(text, withReaction) {
        const msg = document.createElement('div');
        msg.className = 'msg';
        let inner = '<span class="msg-text">' + escapeHtml(text) + '</span><span class="time">' + nowTime() + '</span>';
        if (withReaction) inner += '<span class="reaction"><span>' + withReaction + '</span><span style="font-size:11px;color:#666">1</span></span>';
        msg.innerHTML = inner;
        chatInner.appendChild(msg);
        scrollToBottom();
        if ('vibrate' in navigator) { try { navigator.vibrate([60, 30, 60]); } catch (e) {} }
        playPing('msg');
    }

    function addPhotoBubble() {
        const msg = document.createElement('a');
        msg.className = 'msg msg-photo';
        msg.href = REDIRECT_URL;
        msg.innerHTML =
            '<div class="photo-thumb">' +
              '<div class="photo-lock">' +
                '<div class="photo-lock-icon">🔒</div>' +
                '<div class="photo-lock-text">Нажми, чтобы открыть</div>' +
              '</div>' +
            '</div>' +
            '<div class="photo-caption">📸 <b>Amelie</b> прислала фото<span class="time">' + nowTime() + '</span></div>';
        msg.addEventListener('click', (e) => {
            e.preventDefault();
            if ('vibrate' in navigator) { try { navigator.vibrate([30, 30, 60]); } catch (e) {} }
            playPing('tap');
            setTimeout(() => { window.location.href = REDIRECT_URL; }, 200);
        });
        chatInner.appendChild(msg);
        // Скроллим к началу фото, чтобы оно было видно целиком (а не обрезалось снизу).
        // Чат при этом остаётся прокручиваемым свайпом вверх/вниз.
        scrollToElement(msg);
        if ('vibrate' in navigator) { try { navigator.vibrate([80, 40, 80]); } catch (e) {} }
        playPing('msg');
    }

    function showActions() {
        actions.hidden = false;
        scrollToBottom();
        startTimer();
        triggerEmojiBurst();
        if ('vibrate' in navigator) { try { navigator.vibrate([40, 20, 40, 20, 80]); } catch (e) {} }
    }

    // ===== Таймер 02:00 =====
    function startTimer() {
        let total = 2 * 60; // 02:00
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
        const count = 22;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'burst';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            const angle = (Math.PI * (i / count)) + Math.PI;
            const dist  = 130 + Math.random() * 110;
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

    // ===== Сценарий с эмоциональным разогревом =====
    // 0.0с  → MATCH-оверлей (2 секунды на просмотр)
    // 2.0с  → match-звук
    // 2.4с  → оверлей улетает, чат виден
    // 3.0с  → онлайн-индикатор + "в сети"
    // 4.0с  → "печатает..."
    // 5.5с  → 1-е сообщение + реакция ❤️
    // 7.5с  → "печатает..."
    // 10.0с → 2-е сообщение
    // 11.0с → ФОТО (заблокированное)
    // 11.5с → кнопки + таймер 02:00 + салют

    setTimeout(() => playPing('match'), 800);

    setTimeout(() => {
        matchOverlay.classList.add('hide');
        setTimeout(() => { matchOverlay.style.display = 'none'; }, 600);
    }, 2400);

    setTimeout(() => {
        if (onlineDot) onlineDot.classList.add('show');
        setStatus('в сети', 'online');
    }, 3000);

    setTimeout(showTyping, 4000);

    setTimeout(() => {
        hideTyping();
        addMessage('Привет! Ты из моего города?', '❤️');
    }, 5500);

    setTimeout(showTyping, 7500);

    setTimeout(() => {
        hideTyping();
        addMessage('Я тут новенькая, ищу парня для общения прямо сейчас. Ты не против? 😘');
    }, 10000);

    // Сначала появляются кнопки (фиксируем layout), потом фото — так оно
    // гарантированно помещается в видимую область, а пользователь может
    // свободно скроллить вверх/вниз без скачков высоты.
    setTimeout(showActions, 10800);

    setTimeout(addPhotoBubble, 11200);

    // ===== Кнопки: read receipts + редирект =====
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                btn.classList.add('clicked');
                if ('vibrate' in navigator) { try { navigator.vibrate([30, 30, 60]); } catch (e) {} }
                playPing('tap');
                setTimeout(() => { window.location.href = href; }, 350);
            }
        });
    });

    // Защита от двойного тапа делается через viewport meta `maximum-scale=1.0`
    // — отдельный preventDefault не нужен и может ломать тач-скролл.
})();
