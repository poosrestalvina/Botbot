(function () {
    'use strict';

    // === Звёзды на фоне ===
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        starsContainer.appendChild(star);
    }

    // === Состояние игры ===
    let attempts = 0;
    const maxAttempts = 3;
    const boxes = document.querySelectorAll('.box');
    const messageEl = document.getElementById('message');
    const attemptsCountEl = document.getElementById('attemptsCount');
    const winScreen = document.getElementById('winScreen');
    const timerEl = document.getElementById('timer');

    const emptyMessages = [
        '😔 Пусто! Попробуй ещё раз',
        '😢 Опять мимо! Осталась последняя попытка'
    ];

    function vibrate(pattern) {
        if ('vibrate' in navigator) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = 'message show ' + type;
    }

    function createConfetti() {
        const colors = ['#ffd700', '#ff3c00', '#ff8c00', '#ffeb3b', '#ff6b6b', '#fff'];
        const shapes = ['', 'border-radius:50%;', 'border-radius:2px;'];
        for (let i = 0; i < 80; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            c.style.cssText += `background:${color};${shape}`;
            c.style.left = Math.random() * 100 + 'vw';
            c.style.animationDuration = (Math.random() * 2 + 2) + 's';
            c.style.animationDelay = Math.random() * 0.5 + 's';
            c.style.width = (Math.random() * 8 + 6) + 'px';
            c.style.height = (Math.random() * 8 + 6) + 'px';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 5000);
        }
    }

    function startTimer() {
        let seconds = 5 * 60;
        const interval = setInterval(() => {
            if (seconds <= 0) {
                clearInterval(interval);
                timerEl.textContent = '00:00';
                return;
            }
            seconds--;
            const m = String(Math.floor(seconds / 60)).padStart(2, '0');
            const s = String(seconds % 60).padStart(2, '0');
            timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    function handleBoxClick(e) {
        const box = e.currentTarget;
        if (box.classList.contains('opened') || attempts >= maxAttempts) return;

        attempts++;
        attemptsCountEl.textContent = maxAttempts - attempts;

        const iconEl = box.querySelector('.box-icon');

        if (attempts < maxAttempts) {
            // Пустая коробка
            box.classList.add('shake');
            vibrate(100);
            setTimeout(() => {
                box.classList.remove('shake');
                box.classList.add('opened');
                iconEl.textContent = '❌';
            }, 500);
            showMessage(emptyMessages[attempts - 1], 'empty');
        } else {
            // Третья попытка — выигрыш
            box.classList.add('winner', 'opened');
            iconEl.textContent = '🏆';
            vibrate([100, 50, 100, 50, 200]);
            showMessage('🎊 Ты выиграл приз!', 'win');
            createConfetti();

            // Блокируем оставшиеся коробки
            boxes.forEach(b => {
                if (!b.classList.contains('opened')) {
                    b.classList.add('disabled');
                }
            });

            setTimeout(() => {
                winScreen.classList.add('active');
                winScreen.setAttribute('aria-hidden', 'false');
                startTimer();
            }, 1200);
        }
    }

    boxes.forEach(box => {
        box.addEventListener('click', handleBoxClick);
    });

    // Защита от двойного тапа (зум на iOS)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
})();
