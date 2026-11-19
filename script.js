const contentArea = document.getElementById('contentArea');
const footerText = document.getElementById('footerText');
const tabButtons = document.querySelectorAll('.tab-btn');
const gamesBtn = document.getElementById('gamesBtn');

let currentTab = 'games';
let gamesClickCount = 0;
let isGamesBroken = false;
let activeAudio = null; // Хранит текущий играющий трек

function formatTime(sec) {
  if (isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function renderChangelog() {
  const entries = VL_DATA.changelog || [];
  contentArea.innerHTML = '';

  if (entries.length === 0) {
    footerText.textContent = 'Пока больше ничего нет :(';
    return;
  }

  footerText.textContent = 'Пока больше ничего нет :(';

  entries.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'project-row changelog-row';

    const listItems = Array.isArray(entry.items)
      ? entry.items.map(text => `<li>${text}</li>`).join('')
      : '';

    card.innerHTML = `
      <div class="cover-box changelog-badge">
        <div class="cover-placeholder">${entry.version || 'UPDATE'}</div>
      </div>
      <div class="project-info">
        <div>
          <h2 class="project-title">${entry.title || entry.version}</h2>
          <p class="project-desc">${entry.date ? `Дата: ${entry.date}` : ''}</p>
          <ul class="changelog-list">${listItems}</ul>
        </div>
      </div>
    `;

    contentArea.appendChild(card);
  });
}

function renderTab(tabName) {
  // Останавливаем музыку при переключении вкладки
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  if (tabName === 'changelog') {
    renderChangelog();
    return;
  }

  const items = VL_DATA[tabName] || [];
  contentArea.innerHTML = '';

  if (items.length === 0) {
    footerText.textContent = 'Пока больше ничего нет :(';
    return;
  }

  footerText.textContent = tabName === 'secret'
    ? 'ОШИБКА 0x0000VL: КНОПКА ПОВРЕЖДЕНА'
    : 'Пока больше ничего нет :(';

  items.forEach(item => {
    const row = document.createElement('article');
    row.className = 'project-row';

    const coverHtml = item.image
      ? `<img src="${item.image}" alt="${item.title}" onerror="this.outerHTML='<div class=\\'cover-placeholder\\'>${item.title}</div>'">`
      : `<div class="cover-placeholder">${item.title}</div>`;

    // Кастомный мини-плеер VL
    const audioHtml = item.audio
      ? `
        <div class="vl-player">
          <audio preload="metadata" src="${item.audio}"></audio>
          <button class="player-btn" type="button">PLAY</button>
          <div class="player-progress" title="Кликни для перемотки">
            <div class="player-bar"></div>
          </div>
          <span class="player-time">00:00 / 00:00</span>
        </div>
      `
      : '';

    const actionHtml = item.inProgress
      ? `<span class="in-progress-btn" title="Проект ещё в разработке">В ПРОЦЕССЕ</span>`
      : `<a href="${item.link}" class="download-link" download>СКАЧАТЬ[${item.size}]</a>`;

    row.innerHTML = `
      <div class="cover-box">${coverHtml}</div>
      <div class="project-info">
        <div>
          <h2 class="project-title">${item.title}</h2>
          <p class="project-desc">${item.desc}</p>
          ${audioHtml}
        </div>
        <div class="download-wrap">
          ${actionHtml}
        </div>
      </div>
    `;

    // Настройка логики мини-плеера для карточки
    if (item.audio) {
      const audioEl = row.querySelector('audio');
      const playBtn = row.querySelector('.player-btn');
      const progressBox = row.querySelector('.player-progress');
      const progressBar = row.querySelector('.player-bar');
      const timeLabel = row.querySelector('.player-time');

      audioEl.addEventListener('loadedmetadata', () => {
        timeLabel.textContent = `00:00 / ${formatTime(audioEl.duration)}`;
      });

      playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
          // Ставим на паузу любой другой трек, если он играет
          if (activeAudio && activeAudio !== audioEl) {
            activeAudio.pause();
          }
          audioEl.play();
          activeAudio = audioEl;
          playBtn.textContent = 'PAUSE';
          playBtn.classList.add('playing');
        } else {
          audioEl.pause();
          playBtn.textContent = 'PLAY';
          playBtn.classList.remove('playing');
        }
      });

      audioEl.addEventListener('pause', () => {
        playBtn.textContent = 'PLAY';
        playBtn.classList.remove('playing');
      });

      audioEl.addEventListener('timeupdate', () => {
        const percent = (audioEl.currentTime / audioEl.duration) * 100 || 0;
        progressBar.style.width = `${percent}%`;
        timeLabel.textContent = `${formatTime(audioEl.currentTime)} / ${formatTime(audioEl.duration)}`;
      });

      audioEl.addEventListener('ended', () => {
        playBtn.textContent = 'PLAY';
        playBtn.classList.remove('playing');
        progressBar.style.width = '0%';
      });

      // Перемотка кликом по полосе прогресса
      progressBox.addEventListener('click', (e) => {
        const rect = progressBox.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;
        if (!isNaN(audioEl.duration)) {
          audioEl.currentTime = clickRatio * audioEl.duration;
        }
      });
    }

    contentArea.appendChild(row);
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    if (tab === 'games') {
      gamesClickCount++;

      if (!isGamesBroken) {
        if (gamesClickCount === 4) {
          gamesBtn.classList.add('dmg-1');
        } else if (gamesClickCount === 8) {
          gamesBtn.classList.add('dmg-2');
        } else if (gamesClickCount === 12) {
          gamesBtn.classList.add('dmg-3');
        } else if (gamesClickCount >= 15) {
          isGamesBroken = true;
          gamesBtn.classList.add('shattered');
          gamesBtn.querySelector('.tab-label').textContent = 'ERR_0R';
          document.body.classList.add('broken-mode');
        }
      }
    }

    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (tab === 'games' && isGamesBroken) {
      currentTab = 'secret';
      renderTab('secret');
    } else {
      currentTab = tab;
      renderTab(tab);
    }
  });
});

document.getElementById('vlLogo').addEventListener('click', () => {
  if (isGamesBroken) {
    isGamesBroken = false;
    gamesClickCount = 0;
    gamesBtn.classList.remove('dmg-1', 'dmg-2', 'dmg-3', 'shattered');
    gamesBtn.querySelector('.tab-label').textContent = 'GAMES';
    document.body.classList.remove('broken-mode');
    if (currentTab === 'secret') {
      renderTab('games');
    }
  }
});

renderTab('games');
