const form = document.getElementById('reminder-form');
const textInput = document.getElementById('reminder-text');
const timeInput = document.getElementById('reminder-time');
const list = document.getElementById('reminder-list');
const activeCount = document.getElementById('active-count');
const notifyBanner = document.getElementById('notify-banner');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');

let reminders = JSON.parse(localStorage.getItem('pingme_reminders')) || [];

// Проверка системных уведомлений
if ('Notification' in window && Notification.permission !== 'granted') {
  notifyBanner.classList.remove('hidden');
}

enableNotificationsBtn.addEventListener('click', async () => {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    notifyBanner.classList.add('hidden');
  }
});

// Синтезатор звука будильника (Web Audio API)
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // нота D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // нота A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn('AudioContext not allowed yet:', e);
  }
}

function saveReminders() {
  localStorage.setItem('pingme_reminders', JSON.stringify(reminders));
  render();
}

function render() {
  list.innerHTML = '';

  reminders.sort((a, b) => new Date(a.time) - new Date(b.time));

  reminders.forEach((r, idx) => {
    const li = document.createElement('li');
    if (r.triggered) li.classList.add('triggered');

    const formattedTime = new Date(r.time).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    li.innerHTML = `
      <div class="reminder-info">
        <span class="reminder-title">${r.title} ${r.triggered ? '🔔 [Сработало!]' : ''}</span>
        <span class="reminder-time">📅 ${formattedTime}</span>
      </div>
      <button class="delete-btn" title="Удалить">✕</button>
    `;

    li.querySelector('.delete-btn').addEventListener('click', () => {
      reminders.splice(idx, 1);
      saveReminders();
    });

    list.appendChild(li);
  });

  activeCount.textContent = reminders.filter(r => !r.triggered).length;
}

// Проверка срабатывания каждую секунду
setInterval(() => {
  const now = new Date().getTime();
  let changed = false;

  reminders.forEach(r => {
    const reminderTime = new Date(r.time).getTime();
    if (!r.triggered && now >= reminderTime) {
      r.triggered = true;
      changed = true;
      playBeep();

      // Системное уведомление
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ PingMe — Напоминание!', {
          body: r.title,
        });
      }
    }
  });

  if (changed) {
    saveReminders();
  }
}, 1000);

// Добавление напоминания
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = textInput.value.trim();
  const time = timeInput.value;

  if (!title || !time) return;

  reminders.push({
    title,
    time,
    triggered: false
  });

  textInput.value = '';
  timeInput.value = '';
  saveReminders();
});

render();