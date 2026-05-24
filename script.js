// === НАСТРОЙКА ОБЛАКА SUPABASE ===
// Замени эти строки на данные своего проекта, чтобы сохранение работало на всех устройствах!
const SUPABASE_URL = "https://ysftfljmqsavkjoguwkt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_tGe_9DH_YM2GZ12Fd24HMw_mc1Ike4K";

let supabase = null;
if (SUPABASE_URL && !SUPABASE_URL.includes("your-project-id")) {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Конфигурация динамических званий по минутам
const skillGradesConfig = [
    { req: 0, text: "🙊 Нечленораздельный студент" },
    { req: 10, text: "📝 Обычный Студент" },
    { req: 30, text: "☕ Зубрила на Кофеине" },
    { req: 60, text: "🗣️ Выпускник Школы" },
    { req: 120, text: "📚 Переводчик Мемов" },
    { req: 240, text: "📜 Магистр Грамматики" },
    { req: 480, text: "🧠 Живой Словарь" },
    { req: 960, text: "🕵️ Шпион МИ-6" },
    { req: 1920, text: "👑 Профессор Оксфорда" },
    { req: 3840, text: "🧙‍♂️ Высший Магистр Языка" },
    { req: 7680, text: "🌌 Абсолютный Разум" },
    { req: 15360, text: "👾 Божественный Кодер-Полиглот" }
];

// Базовый шаблон нового игрока
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

// Исправленная мемная ачивка: привязывается строго к ID навыка "eng_lang"
const achievementsDatabase = {
    eng_100: { 
        id: "eng_100", 
        title: "Ландон из зе грейт кэпитал", 
        desc: "Школьный мем ожил! Налетать 100 минут чисто в навыке 'Английский язык'.", 
        targetSkillId: "eng_lang", 
        targetMinutes: 100, 
        rewardTitle: "🇬🇧 Ландон из зе грейт кэпитал" 
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('toggle-skills-btn').addEventListener('click', toggleSkillsPanel);

    const rememberedUser = localStorage.getItem('life_rpg_remembered_user');
    if (rememberedUser) {
        let savedData = localStorage.getItem(`life_rpg_auth_${rememberedUser}`);
        if (savedData) {
            let parsed = JSON.parse(savedData);
            document.getElementById('auth-username').value = rememberedUser;
            document.getElementById('auth-password').value = parsed.password;
            document.getElementById('auth-remember').checked = true;
            
            if (supabase) {
                const { data, error } = await supabase.from('user_profiles').select('state').eq('username', rememberedUser).single();
                if (data && !error) {
                    gameState = data.state;
                } else {
                    gameState = parsed.state;
                }
            } else {
                gameState = parsed.state;
            }
            
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('game-interface').classList.remove('hidden');
            checkSkillsDegradation();
            renderAll();
            initDragAndDrop();
        }
    }
});

async function handleAuth() {
    const userField = document.getElementById('auth-username').value.trim();
    const passField = document.getElementById('auth-password').value.trim();
    const rememberMe = document.getElementById('auth-remember').checked;
    
    if (!userField || !passField) return alert("Введите имя и пароль!");
    
    if (supabase) {
        const { data, error } = await supabase.from('user_profiles').select('*').eq('username', userField).single();
        
        if (data) {
            if (data.password !== passField) return alert("Неверный пароль героя!");
            gameState = data.state;
        } else {
            gameState = createInitialState(userField);
            await supabase.from('user_profiles').insert({ username: userField, password: passField, state: gameState });
        }
    } else {
        const savedData = localStorage.getItem(`life_rpg_auth_${userField}`);
        if (savedData) {
            let parsed = JSON.parse(savedData);
            if (parsed.password !== passField) return alert("Неверный пароль героя!");
            gameState = parsed.state;
        } else {
            gameState = createInitialState(userField);
        }
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

async function save() {
    if (!gameState.user) return;
    const currentPassword = document.getElementById('auth-password').value.trim() || "12345";
    const authData = { password: currentPassword, state: gameState };
    
    localStorage.setItem(`life_rpg_auth_${gameState.user}`, JSON.stringify(authData));
    
    if (supabase) {
        await supabase.from('user_profiles').update({ state: gameState }).eq('username', gameState.user);
    }
}

function toggleSkillsPanel() {
    gameState.skillsCollapsed = !gameState.skillsCollapsed;
    renderAll();
    save();
}

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

function closeGradesModal() { document.getElementById('grades-modal').classList.add('hidden'); }
function openProfileModal() {
    document.getElementById('edit-username').value = gameState.user;
    document.getElementById('edit-password').value = document.getElementById('auth-password').value;
    document.getElementById('profile-modal').classList.remove('hidden');
}
function closeProfileModal() { document.getElementById('profile-modal').classList.add('hidden'); }

async function submitProfileEdit() {
    const newName = document.getElementById('edit-username').value.trim();
    const newPass = document.getElementById('edit-password').value.trim();
    if (!newName || !newPass) return alert("Поля не могут быть пустыми!");
    
    if (supabase) {
        alert("В облачном режиме имя аккаунта привязано к базе данных. Смена пароля сохранена.");
        await supabase.from('user_profiles').update({ password: newPass }).eq('username', gameState.user);
    } else {
        localStorage.removeItem(`life_rpg_auth_${gameState.user}`);
        gameState.user = newName;
    }
    
    document.getElementById('auth-username').value = newName;
    document.getElementById('auth-password').value = newPass;
    closeProfileModal();
    renderAll();
    save();
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
                checkAchievementsAutoUnlock(); 
            }
            renderAll();
            save();
        }, 1000);
    }
    renderAll();
    save();
}

function checkAchievementsAutoUnlock() {
    Object.keys(achievementsDatabase).forEach(key => {
        const ach = achievementsDatabase[key];
        if (gameState.unlockedAchievements.includes(ach.id)) return;

        let currentMinutes = 0;
        if (ach.targetSkillId) {
            const targetSkill = gameState.skills.find(s => s.id === ach.targetSkillId);
            if (targetSkill) currentMinutes = targetSkill.totalMinutes;
        } else {
            currentMinutes = gameState.skills.filter(s => s.type === ach.targetType).reduce((sum, s) => sum + s.totalMinutes, 0);
        }

        if (currentMinutes >= ach.targetMinutes) {
            gameState.unlockedAchievements.push(ach.id);
            gameState.activeTitle = ach.rewardTitle; 
        }
    });
}

function initDragAndDrop() {
    const container = document.getElementById('skills-container-list');
    if (!container) return;
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

// Поиск позиции для вставки карточки при переносе
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

// Экипировка шапки
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

    // РЕНДЕР ЦЕЛИ АЧИВКИ НА ПАНЕЛИ ПРОФИЛЯ
    const achPinned = achievementsDatabase[gameState.pinnedAchId];
    if (achPinned) {
        document.getElementById('pinned-ach-title').innerText = achPinned.title;
        let currentMinutes = 0;
        if (achPinned.targetSkillId) {
            const targetSkill = gameState.skills.find(s => s.id === achPinned.targetSkillId);
            if (targetSkill) currentMinutes = targetSkill.totalMinutes;
        } else {
            currentMinutes = gameState.skills.filter(s => s.type === achPinned.targetType).reduce((sum, s) => sum + s.totalMinutes, 0);
        }
        document.getElementById('pinned-ach-progress').innerText = `${currentMinutes}/${achPinned.targetMinutes} мин`;
        let pct = (currentMinutes / achPinned.targetMinutes) * 100;
        document.getElementById('pinned-ach-bar').style.width = `${Math.min(pct, 100)}%`;
    }

    // РЕНДЕР ВКЛАДКИ АЧИВОК (Починили отображение в основном меню)
    const achTabContainer = document.getElementById('achievements-list-container');
    if (achTabContainer) {
        achTabContainer.innerHTML = '';
        Object.keys(achievementsDatabase).forEach(key => {
            const ach = achievementsDatabase[key];
            let currentMinutes = 0;
            
            if (ach.targetSkillId) {
                const targetSkill = gameState.skills.find(s => s.id === ach.targetSkillId);
                if (targetSkill) currentMinutes = targetSkill.totalMinutes;
            } else {
                currentMinutes = gameState.skills.filter(s => s.type === ach.targetType).reduce((sum, s) => sum + s.totalMinutes, 0);
            }
            
            const isCompleted = currentMinutes >= ach.targetMinutes;
            const card = document.createElement('div');
            card.className = 'ach-card';
            card.style.border = isCompleted ? '4px solid #ffd700' : '4px solid #000';
            card.style.opacity = isCompleted ? '1' : '0.6';
            
            card.innerHTML = `
                <div class="item-info">
                    <span class="ach-name" style="${isCompleted ? 'color: #ffd700;' : ''}">
                        ${isCompleted ? '🏆' : '🔒'} ${ach.title}
                    </span>
                    <span class="ach-desc">${ach.desc}</span>
                    <div style="font-size: 9px; color: #aaa; margin-top: 4px;">
                        Прогресс: ${currentMinutes}/${ach.targetMinutes} мин
                    </div>
                </div>
                <div>
                    ${isCompleted ? '<span style="color:#00ff55; font-size:10px;">ВЫПОЛНЕНО</span>' : '<span style="color:#ff3355; font-size:10px;">В ПРОЦЕССЕ</span>'}
                </div>
            `;
            achTabContainer.appendChild(card);
        });
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