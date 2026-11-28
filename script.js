const form = document.getElementById('reminder-form');
const textInput = document.getElementById('reminder-text');
const timeInput = document.getElementById('reminder-time');
const list = document.getElementById('reminder-list');
const activeCount = document.getElementById('active-count');
const notifyBanner = document.getElementById('notify-banner');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const formError = document.getElementById('form-error');

function loadReminders() {
  try {
    const raw = localStorage.getItem('pingme_reminders');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Не удалось прочитать напоминания из localStorage:', e);
    return [];
  }
}

let reminders = loadReminders();

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

  if (reminders.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state';
    emptyLi.textContent = 'Пока нет напоминаний. Добавьте первое событие выше.';
    list.appendChild(emptyLi);
    activeCount.textContent = '0';
    return;
  }

  reminders.sort((a, b) => new Date(a.time) - new Date(b.time));

  reminders.forEach((r, idx) => {
    const li = document.createElement('li');
    if (r.triggered) li.classList.add('triggered');

    const dateObj = new Date(r.time);
    const formattedTime = Number.isNaN(dateObj.getTime())
      ? 'Некорректная дата'
      : dateObj.toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

    const infoDiv = document.createElement('div');
    infoDiv.className = 'reminder-info';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'reminder-title';
    titleSpan.textContent = `${r.title}${r.triggered ? ' 🔔 [Сработало!]' : ''}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'reminder-time';
    timeSpan.textContent = `📅 ${formattedTime}`;

    infoDiv.appendChild(titleSpan);
    infoDiv.appendChild(timeSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Удалить';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      reminders.splice(idx, 1);
      saveReminders();
    });

    li.appendChild(infoDiv);
    li.appendChild(deleteBtn);
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

function showFormError(message) {
  if (!formError) return;
  formError.textContent = message;
  formError.classList.remove('hidden');
}

function clearFormError() {
  if (!formError) return;
  formError.textContent = '';
  formError.classList.add('hidden');
}

// Добавление напоминания
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = textInput.value.trim();
  const time = timeInput.value.trim();

  if (!title) {
    showFormError('Введите текст напоминания (не только пробелы).');
    textInput.focus();
    return;
  }

  if (!time || Number.isNaN(Date.parse(time))) {
    showFormError('Укажите корректные дату и время.');
    timeInput.focus();
    return;
  }

  clearFormError();

  reminders.push({
    title,
    time,
    triggered: false
  });

  textInput.value = '';
  timeInput.value = '';
  saveReminders();
});

textInput.addEventListener('input', clearFormError);
timeInput.addEventListener('input', clearFormError);

render();