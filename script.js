// Конфигурация всех званий по минутам обучения
const skillGradesConfig = [
    { req: 0, text: "🙊 Нечленораздельный студент" },
    { req: 10, text: "📝 Обычный Студент" },
    { req: 30, text: "☕ Зубрила на Кофеине" },
    { req: 60, text: "🗣️ Выпускник Школы" },
    { req: 120, text: "📚 Переводчик Мемов" },
    { req: 240, text: "📜 Магистр Грамматики" },
    { req: 480, text: "🧠 Живой Словать" },
    { req: 960, text: "🕵️ Шпион МИ-6" },
    { req: 1920, text: "👑 Профессор Оксфорда" },
    { req: 3840, text: "🧙‍♂️ Высший Магистр Языка" },
    { req: 7680, text: "🌌 Абсолютный Разум" },
    { req: 15360, text: "👾 Божественный Кодер-Полиглот" }
];

// Дефолтное состояние для новых игроков
function createInitialState(username) {
    return {
        user: username,
        lvl: 1,
        xp: 0,
        gold: 20, 
        stats: { intellect: 1, willpower: 1, stamina: 1, wealth: 1 },
        customTasks: [],
        inventory: [], 
        equippedHead: null,
        avatarGender: 'female', 
        avatarIndex: 1,
        skills: [
            { id: "eng_lang", title: "🇬🇧 Английский язык", type: "edu", totalMinutes: 0, lastActivity: Date.now() }
        ],
        activeTitle: "✨ Без звания",
        pinnedAchId: "eng_100", 
        unlockedAchievements: [],
        skillsCollapsed: false
    };
}

let gameState = {};
let activeTimerId = null; 
let timerInterval = null; 
let secondsCountdown = 60; 

const avatarsConfig = {
    female: ["avatar_female_1.png"],
    male: ["avatar_male_1.png"]
};

// Ювелирно выверенные координаты шапок под твой пиксельный аватар
const itemsDatabase = {
    ragged_hat: { 
        id: "ragged_hat", name: "🎓 Рваный Колпак", bonus: 0.02, src: "hat_ragged.png", price: 15, reqStat: "intellect", reqVal: 0,
        offsets: { female: { top: "-10px", left: "20px", width: "135px" }, male: { top: "-10px", left: "20px", width: "135px" } }
    },
    mage_hat: { 
        id: "mage_hat", name: "🔮 Колпак Мага", bonus: 0.10, src: "hat_mage.png", price: 100, reqStat: "intellect", reqVal: 5,
        offsets: { female: { top: "-18px", left: "15px", width: "135px" }, male: { top: "-18px", left: "15px", width: "135px" } }
    },
    sage_crown: { 
        id: "sage_crown", name: "👑 Корона Мудреца", bonus: 0.25, src: "hat_crown.png", price: 350, reqStat: "intellect", reqVal: 12,
        offsets: { female: { top: "52px", left: "45px", width: "85px" }, male: { top: "52px", left: "45px", width: "85px" } }
    }
};

const achievementsDatabase = {
    eng_100: { id: "eng_100", title: "Лондон Из Зе Кэпитал", desc: "Проработать 100 минут в навыках категории 'Учеба'", targetType: "edu", targetMinutes: 100, rewardTitle: "👑 Профессор Оксфорда" }
};

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggle-skills-btn').addEventListener('click', toggleSkillsPanel);

    const rememberedUser = localStorage.getItem('life_rpg_remembered_user');
    if (rememberedUser) {
        const savedData = localStorage.getItem(`life_rpg_auth_${rememberedUser}`);
        if (savedData) {
            let parsed = JSON.parse(savedData);
            gameState = parsed.state;
            
            document.getElementById('auth-username').value = rememberedUser;
            document.getElementById('auth-password').value = parsed.password;
            document.getElementById('auth-remember').checked = true;
            
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('game-interface').classList.remove('hidden');
            checkSkillsDegradation();
            renderAll();
            initDragAndDrop();
            return;
        }
    }
});

// Исправленная авторизация без перезаписи чужих стейтов
function handleAuth() {
    const userField = document.getElementById('auth-username').value.trim();
    const passField = document.getElementById('auth-password').value.trim();
    const rememberMe = document.getElementById('auth-remember').checked;
    
    if (!userField || !passField) return alert("Введите имя и пароль!");
    
    const saveKey = `life_rpg_auth_${userField}`;
    const savedData = localStorage.getItem(saveKey);
    
    if (savedData) {
        let parsed = JSON.parse(savedData);
        if (parsed.password !== passField) return alert("Неверный пароль героя!");
        gameState = parsed.state;
    } else {
        gameState = createInitialState(userField);
    }
    
    if (rememberMe) {
        localStorage.setItem('life_rpg_remembered_user', userField);
    } else {
        localStorage.removeItem('life_rpg_remembered_user');
    }
    
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-interface').classList.remove('hidden');
    
    checkSkillsDegradation();
    renderAll();
    initDragAndDrop();
    save();
}

function logOut() {
    if (timerInterval) {
        clearInterval(timerInterval);
        activeTimerId = null;
        timerInterval = null;
    }
    localStorage.removeItem('life_rpg_remembered_user');
    document.getElementById('game-interface').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

function save() {
    if (!gameState.user) return;
    const currentPassword = document.getElementById('auth-password').value.trim() || "12345";
    const authData = {
        password: currentPassword,
        state: gameState
    };
    localStorage.setItem(`life_rpg_auth_${gameState.user}`, JSON.stringify(authData));
}

function toggleSkillsPanel() {
    gameState.skillsCollapsed = !gameState.skillsCollapsed;
    const wrapper = document.getElementById('skills-collapsible-wrapper');
    const arrow = document.getElementById('collapse-arrow');
    
    if (gameState.skillsCollapsed) {
        wrapper.classList.add('collapsed');
        arrow.innerText = '►';
    } else {
        wrapper.classList.remove('collapsed');
        arrow.innerText = '▼';
    }
    save();
}

// Модалка просмотра рангов
function openGradesModal() {
    const listContainer = document.getElementById('grades-modal-list');
    listContainer.innerHTML = '';
    
    skillGradesConfig.forEach(g => {
        const row = document.createElement('div');
        row.className = 'grade-row-info';
        
        let timeText = g.req === 0 ? "Старт" : `${g.req} мин (${(g.req/60).toFixed(1)}ч)`;
        row.innerHTML = `<span>${g.text}</span><span>${timeText}</span>`;
        listContainer.appendChild(row);
    });
    
    document.getElementById('grades-modal').classList.remove('hidden');
}

function closeGradesModal() {
    document.getElementById('grades-modal').classList.add('hidden');
}

function openProfileModal() {
    document.getElementById('edit-username').value = gameState.user;
    document.getElementById('edit-password').value = document.getElementById('auth-password').value;
    document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

function submitProfileEdit() {
    const newName = document.getElementById('edit-username').value.trim();
    const newPass = document.getElementById('edit-password').value.trim();
    
    if (!newName || !newPass) return alert("Поля не могут быть пустыми!");
    
    localStorage.removeItem(`life_rpg_auth_${gameState.user}`);
    
    gameState.user = newName;
    document.getElementById('auth-username').value = newName;
    document.getElementById('auth-password').value = newPass;
    
    if (localStorage.getItem('life_rpg_remembered_user')) {
        localStorage.setItem('life_rpg_remembered_user', newName);
    }
    
    closeProfileModal();
    renderAll();
    save();
    alert("Профиль успешно обновлен!");
}

function deleteSkill(skillId, event) {
    event.stopPropagation();
    if (confirm("Вы действительно хотите удалить этот навык?")) {
        if (activeTimerId === skillId) {
            clearInterval(timerInterval);
            activeTimerId = null;
        }
        gameState.skills = gameState.skills.filter(s => s.id !== skillId);
        renderAll();
        initDragAndDrop();
        save();
    }
}

function openNewSkillModal() { document.getElementById('skill-modal').classList.remove('hidden'); }
function closeNewSkillModal() { document.getElementById('skill-modal').classList.add('hidden'); }

function submitNewSkill() {
    const titleInput = document.getElementById('new-skill-title').value.trim();
    const typeSelect = document.getElementById('new-skill-type').value;
    
    if (!titleInput) return alert("Введите название навыка!");
    
    const newSkill = {
        id: "skill_" + Date.now(),
        title: titleInput,
        type: typeSelect,
        totalMinutes: 0,
        lastActivity: Date.now()
    };
    
    gameState.skills.push(newSkill);
    document.getElementById('new-skill-title').value = "";
    closeNewSkillModal();
    renderAll();
    initDragAndDrop();
    save();
}

function toggleSkillTimer(skillId) {
    const skill = gameState.skills.find(s => s.id === skillId);
    if (!skill) return;

    if (activeTimerId === skillId) {
        clearInterval(timerInterval);
        activeTimerId = null;
        timerInterval = null;
    } else {
        if (timerInterval) clearInterval(timerInterval);
        activeTimerId = skillId;
        secondsCountdown = 60; 
        
        timerInterval = setInterval(() => {
            secondsCountdown--;
            if (secondsCountdown <= 0) {
                skill.totalMinutes++;
                skill.lastActivity = Date.now(); 
                secondsCountdown = 60;
                addXP(2, 'intellect');
            }
            renderAll();
            save();
        }, 1000);
    }
    renderAll();
    save();
}

function initDragAndDrop() {
    const container = document.getElementById('skills-container-list');
    const cards = container.querySelectorAll('.skill-card');
    
    cards.forEach(card => {
        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            const currentCards = Array.from(container.querySelectorAll('.skill-card'));
            const newOrderedSkills = [];
            currentCards.forEach(cardEl => {
                const sId = cardEl.getAttribute('data-id');
                const foundSkill = gameState.skills.find(s => s.id == sId);
                if (foundSkill) newOrderedSkills.push(foundSkill);
            });
            gameState.skills = newOrderedSkills;
            save();
        });
    });
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggingCard = document.querySelector('.dragging');
        if (draggingCard) {
            if (afterElement == null) container.appendChild(draggingCard);
            else container.insertBefore(draggingCard, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.skill-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: -Infinity }).element;
}

function changeGender(gender) {
    gameState.avatarGender = gender;
    gameState.avatarIndex = 1; 
    renderAll();
    save();
}

function nextAvatar() {
    const list = avatarsConfig[gameState.avatarGender];
    gameState.avatarIndex = (gameState.avatarIndex < list.length) ? gameState.avatarIndex + 1 : 1;
    renderAll();
    save();
}

function prevAvatar() {
    const list = avatarsConfig[gameState.avatarGender];
    gameState.avatarIndex = (gameState.avatarIndex > 1) ? gameState.avatarIndex - 1 : list.length;
    renderAll();
    save();
}

function getXpNeeded(level) { return level * 100 + (level - 1) * 50; }

function addXP(amount, targetStat = null) {
    if (gameState.equippedHead && itemsDatabase[gameState.equippedHead]) {
        amount += amount * itemsDatabase[gameState.equippedHead].bonus;
    }
    gameState.xp += amount;
    let needed = getXpNeeded(gameState.lvl);
    while (gameState.xp >= needed) {
        gameState.xp -= needed;
        gameState.lvl++;
        if (targetStat && gameState.stats[targetStat] !== undefined) gameState.stats[targetStat]++;
        needed = getXpNeeded(gameState.lvl);
    }
    renderAll();
    save();
}

function buyItem(itemId) {
    const item = itemsDatabase[itemId];
    if (gameState.gold < item.price) return alert("Недостаточно золота! 💰");
    gameState.gold -= item.price;
    gameState.inventory.push(itemId); 
    renderAll();
    save();
}

function toggleEquip(itemId) {
    gameState.equippedHead = (gameState.equippedHead === itemId) ? null : itemId;
    renderAll();
    save();
}

function createNewTask() {
    const nameInput = document.getElementById('task-name');
    if (!nameInput.value.trim()) return alert("Введите имя квеста!");
    
    const newTask = {
        id: Date.now(),
        name: nameInput.value,
        period: document.getElementById('task-period').value,
        stat: document.getElementById('task-stat').value,
        xp: parseInt(document.getElementById('task-xp').value) || 15,
        gold: parseInt(document.getElementById('task-gold').value) || 10
    };
    
    gameState.customTasks.push(newTask);
    nameInput.value = '';
    renderAll();
    save();
}

function completeTask(id) {
    const idx = gameState.customTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
        const task = gameState.customTasks[idx];
        gameState.gold += task.gold;
        addXP(task.xp, task.stat);
        gameState.customTasks.splice(idx, 1);
        renderAll();
        save();
    }
}

function deleteTask(id) {
    gameState.customTasks = gameState.customTasks.filter(t => t.id !== id);
    renderAll();
    save();
}

function checkSkillsDegradation() {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000; 
    gameState.skills.forEach(skill => {
        if (!skill.lastActivity) skill.lastActivity = now;
        let daysPassed = Math.floor((now - skill.lastActivity) / msInDay);
        if (daysPassed >= 3) {
            let decayPool = Math.floor(daysPassed / 3) * 5;
            skill.totalMinutes = Math.max(0, skill.totalMinutes - decayPool);
            skill.lastActivity = now;
        }
    });
}

function getSkillStatusAndGrade(minutes) {
    let currentGrade = skillGradesConfig[0].text;
    for (let i = 0; i < skillGradesConfig.length; i++) {
        if (minutes >= skillGradesConfig[i].req) {
            currentGrade = skillGradesConfig[i].text;
        } else {
            break;
        }
    }
    return currentGrade;
}

function switchMainTab(tabId) {
    document.querySelectorAll('.tab-main-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-main-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

function resetAllProgress() {
    if (confirm("🚨 Сбросить ВСЕХ пользователей и весь прогресс?")) {
        localStorage.clear();
        window.location.reload();
    }
}

function renderAll() {
    if (!gameState.user) return;

    document.getElementById('hero-name').innerText = gameState.user.toUpperCase();
    document.getElementById('hero-title').innerText = gameState.activeTitle;
    document.getElementById('lvl').innerText = gameState.lvl;
    document.getElementById('gold-text').innerText = gameState.gold;
    
    let needed = getXpNeeded(gameState.lvl);
    document.getElementById('xp-text').innerText = `${Math.floor(gameState.xp)}/${needed}`;
    document.getElementById('xp-bar').style.width = `${Math.min((gameState.xp / needed) * 100, 100)}%`;
    
    document.getElementById('stat-intellect').innerText = gameState.stats.intellect;
    document.getElementById('stat-willpower').innerText = gameState.stats.willpower;
    document.getElementById('stat-stamina').innerText = gameState.stats.stamina;
    document.getElementById('stat-wealth').innerText = gameState.stats.wealth;

    document.getElementById('btn-av-female').className = (gameState.avatarGender === 'female') ? 'active' : '';
    document.getElementById('btn-av-male').className = (gameState.avatarGender === 'male') ? 'active' : '';
    document.getElementById('avatar-number').innerText = `Облик ${gameState.avatarIndex}`;
    
    const heroImg = document.getElementById('hero-img-base');
    const currentList = avatarsConfig[gameState.avatarGender || 'female'];
    heroImg.src = currentList[gameState.avatarIndex - 1] || currentList[0];
    
    const wrapper = document.getElementById('skills-collapsible-wrapper');
    const arrow = document.getElementById('collapse-arrow');
    if (gameState.skillsCollapsed) {
        wrapper.classList.add('collapsed');
        arrow.innerText = '►';
    } else {
        wrapper.classList.remove('collapsed');
        arrow.innerText = '▼';
    }

    const hatLayer = document.getElementById('avatar-layer-hat');
    if (gameState.equippedHead && itemsDatabase[gameState.equippedHead]) {
        const item = itemsDatabase[gameState.equippedHead];
        hatLayer.src = item.src;
        const coords = item.offsets[gameState.avatarGender || 'female'];
        hatLayer.style.top = coords.top;
        hatLayer.style.left = coords.left;
        hatLayer.style.width = coords.width;
        hatLayer.classList.remove('hidden');
    } else {
        hatLayer.classList.add('hidden');
    }

    const skillsContainer = document.getElementById('skills-container-list');
    skillsContainer.innerHTML = '';
    gameState.skills.forEach(skill => {
        const grade = getSkillStatusAndGrade(skill.totalMinutes);
        const isThisTimerRunning = (activeTimerId === skill.id);
        
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.setAttribute('data-id', skill.id);
        card.innerHTML = `
            <button class="btn-delete-skill" onclick="deleteSkill('${skill.id}', event)">❌</button>
            <div class="skill-meta" onclick="toggleSkillTimer('${skill.id}')">
                <span class="skill-title">${skill.title}</span>
                <span class="skill-status">${grade}</span>
            </div>
            <div class="skill-timer-zone">
                <span class="skill-time-val">Пройдено: ${skill.totalMinutes} мин ${isThisTimerRunning ? ` (${secondsCountdown}с)` : ''}</span>
                <button class="btn-timer ${isThisTimerRunning ? 'active' : ''}" onclick="toggleSkillTimer('${skill.id}')">
                    ${isThisTimerRunning ? '⏹️ СТОП' : '▶️ СТАРТ'}
                </button>
            </div>
        `;
        skillsContainer.appendChild(card);
    });

    const achPinned = achievementsDatabase[gameState.pinnedAchId];
    if (achPinned) {
        document.getElementById('pinned-ach-title').innerText = achPinned.title;
        let groupMinutes = gameState.skills.filter(s => s.type === achPinned.targetType).reduce((sum, s) => sum + s.totalMinutes, 0);
        document.getElementById('pinned-ach-progress').innerText = `${groupMinutes}/${achPinned.targetMinutes} мин`;
        let pct = (groupMinutes / achPinned.targetMinutes) * 100;
        document.getElementById('pinned-ach-bar').style.width = `${Math.min(pct, 100)}%`;
    }

    const shopBox = document.getElementById('shop-list');
    shopBox.innerHTML = '';
    Object.keys(itemsDatabase).forEach(key => {
        const item = itemsDatabase[key];
        if (!gameState.inventory.includes(key)) {
            const card = document.createElement('div');
            card.className = 'shop-item-card';
            card.innerHTML = `
                <div class="item-info">
                    <span class="item-title">${item.name}</span>
                    <span class="item-rules">ИНТ ${item.reqVal}+ | XP +${item.bonus*100}%</span>
                </div>
                <button class="btn-buy" onclick="buyItem('${item.id}')">${item.price} 💰</button>
            `;
            shopBox.appendChild(card);
        }
    });

    const invBox = document.getElementById('inventory-list');
    invBox.innerHTML = '';
    gameState.inventory.forEach(itemId => {
        const item = itemsDatabase[itemId];
        const isEquipped = gameState.equippedHead === itemId;
        const row = document.createElement('div');
        row.className = 'inv-item-row';
        row.innerHTML = `<span>${item.name}</span><button class="btn-use ${isEquipped ? 'active' : ''}" onclick="toggleEquip('${itemId}')">${isEquipped ? 'СНЯТЬ' : 'НАДЕТЬ'}</button>`;
        invBox.appendChild(row);
    });
    if (gameState.inventory.length === 0) invBox.innerHTML = '<div style="font-size:9px;color:#666;">Пусто</div>';

    const dayList = document.getElementById('list-day');
    const weekList = document.getElementById('list-week');
    dayList.innerHTML = ''; weekList.innerHTML = '';
    gameState.customTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        let icon = task.stat === 'intellect' ? '🧠' : task.stat === 'willpower' ? '⚡' : task.stat === 'stamina' ? '🔋' : '💰';
        card.innerHTML = `
            <div>
                <div class="quest-title">${task.name}</div>
                <div class="quest-reward">+${task.xp}XP / +${task.gold}💰 / +1 ${icon}</div>
            </div>
            <div class="quest-actions"><button class="btn-complete" onclick="completeTask(${task.id})">ОК</button><button class="btn-delete" onclick="deleteTask(${task.id})">Х</button></div>
        `;
        if (task.period === 'day') dayList.appendChild(card);
        else weekList.appendChild(card);
    });
}