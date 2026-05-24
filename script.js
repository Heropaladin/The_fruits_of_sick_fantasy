// === НАСТРОЙКА ОБЛАКА SUPABASE ===
const SUPABASE_URL = "https://ysftfljmqsavkjoguwkt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_tGe_9DH_YM2GZ12Fd24HMw_mc1Ike4K"; 

let supabaseClient = null;

if (SUPABASE_URL && !SUPABASE_URL.includes("your-project-id")) {
    try {
        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else if (typeof Supabase !== 'undefined' && typeof Supabase.createClient === 'function') {
            supabaseClient = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.error("Ошибка инициализации клиента Supabase:", e);
    }
}

// === КОНФИГУРАЦИЯ БАЗЫ ДАННЫХ ИГРЫ ===

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

// Полная база предметов магазина
const itemsDatabase = {
    ragged_hat: { 
        id: "ragged_hat", type: "hat", name: "🎓 Рваный Колпак", bonus: 0.02, src: "hat_ragged.png", price: 15, reqStat: "intellect", reqVal: 0,
        offsets: { female: { top: "-10px", left: "40px", width: "125px" }, male: { top: "-10px", left: "40px", width: "125px" } }
    },
    mage_hat: { 
        id: "mage_hat", type: "hat", name: "🔮 Колпак Мага", bonus: 0.10, src: "hat_mage.png", price: 100, reqStat: "intellect", reqVal: 5,
        offsets: { female: { top: "10px", left: "45px", width: "120px" }, male: { top: "10px", left: "45px", width: "120px" } }
    },
    sage_crown: { 
        id: "sage_crown", type: "hat", name: "👑 Корона Мудреца", bonus: 0.25, src: "hat_crown.png", price: 350, reqStat: "intellect", reqVal: 12,
        offsets: { female: { top: "33px", left: "67px", width: "55px" }, male: { top: "33px", left: "67px", width: "55px" } }
    },
    avatar_casual_hd: {
        id: "avatar_casual_hd", type: "avatar", name: "🖼️ Облик: Casual HD", price: 50, reqStat: "intellect", reqVal: 2,
        gender: "female", src: "avatar_female_1.png"
    },
    avatar_sport_fit: {
        id: "avatar_sport_fit", type: "avatar", name: "💪 Облик: Спорт-Леди", price: 150, reqStat: "stamina", reqVal: 3,
        gender: "female", src: "Gemini_Generated_Image_5cnvt05cnvt05cnv.png"
    }
};

const achievementsDatabase = {
    eng_100: { 
        id: "eng_100", title: "Ландон из зе грейт кэпитал", desc: "Налетать 100 минут строго в навыке 'Английский язык'.", 
        targetSkillId: "eng_lang", targetMinutes: 100, rewardTitle: "🇬🇧 Ландон из зе грейт кэпитал" 
    },
    eng_500: { 
        id: "eng_500", title: "Почти Шекспир", desc: "Потратить 500 минут на изучение английского языка.", 
        targetSkillId: "eng_lang", targetMinutes: 500, rewardTitle: "📜 Почти Шекспир" 
    },
    sport_50: { 
        id: "sport_50", title: "Разминка окончена", desc: "Суммарно заниматься домашним спортом 50 минут.", 
        targetSkillId: "home_sport", targetMinutes: 50, rewardTitle: "🏃‍♂️ Физкультурник" 
    },
    sport_300: { 
        id: "sport_300", title: "Спорт - это жизнь", desc: "Потратить 300 минут на домашние тренировки.", 
        targetSkillId: "home_sport", targetMinutes: 300, rewardTitle: "🏋️‍♂️ Аполлон" 
    }
};

// === ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ ИГРЫ ===

let gameState = {};
let activeTimerId = null; 
let timerInterval = null; 
let secondsCountdown = 60; 

let avatarsConfig = {
    female: ["avatar_female_1.png"],
    male: ["avatar_male_1.png"]
};

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
            { id: "eng_lang", title: "🇬🇧 Английский язык", type: "edu", totalMinutes: 0, lastActivity: Date.now() },
            { id: "home_sport", title: "🏠 Домашний спорт", type: "sport", totalMinutes: 0, lastActivity: Date.now() }
        ],
        activeTitle: "✨ Без звания",
        pinnedAchId: "eng_100", 
        unlockedAchievements: [],
        skillsCollapsed: false,
        lastSportTime: Date.now()
    };
}

window.addEventListener('DOMContentLoaded', async () => {
    // Навешиваем клики на главные вкладки (чтобы они не ломались)
    const tabBtns = document.querySelectorAll('.tab-main-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Определяем ID таба по тексту кнопки или атрибутам
            if (btn.innerText.includes("НАВЫКИ")) switchMainTab('tab-skills');
            if (btn.innerText.includes("МАГАЗИН")) switchMainTab('tab-shop');
            if (btn.innerText.includes("ТИТУЛЫ") || btn.innerText.includes("АЧИВКИ")) switchMainTab('tab-achievements');
            if (btn.innerText.includes("КВЕСТЫ")) switchMainTab('tab-quests');
        });
    });

    const rememberedUser = localStorage.getItem('life_rpg_remembered_user');
    if (rememberedUser) {
        let savedData = localStorage.getItem(`life_rpg_auth_${rememberedUser}`);
        if (savedData) {
            let parsed = JSON.parse(savedData);
            if (document.getElementById('auth-username')) document.getElementById('auth-username').value = rememberedUser;
            if (document.getElementById('auth-password')) document.getElementById('auth-password').value = parsed.password;
            if (document.getElementById('auth-remember')) document.getElementById('auth-remember').checked = true;
            
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('user_profiles').select('state').eq('username', rememberedUser).single();
                    if (data && !error) {
                        gameState = data.state;
                    } else {
                        gameState = parsed.state;
                    }
                } catch (e) {
                    console.error("Ошибка авто-входа через Supabase:", e);
                    gameState = parsed.state;
                }
            } else {
                gameState = parsed.state;
            }
            
            if (document.getElementById('auth-screen')) document.getElementById('auth-screen').classList.add('hidden');
            if (document.getElementById('game-interface')) document.getElementById('game-interface').classList.remove('hidden');
            
            checkSkillsDegradation();
            updateAvatarsConfig();
            renderAll();
        }
    }
});

function switchMainTab(tabId) {
    document.querySelectorAll('.tab-main-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-main-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.remove('hidden');
    
    // Подсвечиваем активную кнопку
    document.querySelectorAll('.tab-main-btn').forEach(btn => {
        if (tabId === 'tab-skills' && btn.innerText.includes("НАВЫКИ")) btn.classList.add('active');
        if (tabId === 'tab-shop' && btn.innerText.includes("МАГАЗИН")) btn.classList.add('active');
        if (tabId === 'tab-achievements' && btn.innerText.includes("ТИТУЛЫ")) btn.classList.add('active');
        if (tabId === 'tab-quests' && btn.innerText.includes("КВЕСТЫ")) btn.classList.add('active');
    });
}

function updateAvatarsConfig() {
    avatarsConfig = { female: ["avatar_female_1.png"], male: ["avatar_male_1.png"] };
    if (gameState.inventory) {
        gameState.inventory.forEach(itemId => {
            const item = itemsDatabase[itemId];
            if (item && item.type === "avatar") {
                if (!avatarsConfig[item.gender].includes(item.src)) {
                    avatarsConfig[item.gender].push(item.src);
                }
            }
        });
    }
}

async function handleAuth() {
    const userField = document.getElementById('auth-username').value.trim();
    const passField = document.getElementById('auth-password').value.trim();
    const rememberMe = document.getElementById('auth-remember').checked;
    
    if (!userField || !passField) return alert("Введите имя и пароль!");
    
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('user_profiles').select('*').eq('username', userField).single();
            if (data) {
                if (data.password !== passField) return alert("Неверный пароль героя!");
                gameState = data.state;
            } else {
                gameState = createInitialState(userField);
                await supabaseClient.from('user_profiles').insert({ username: userField, password: passField, state: gameState });
            }
        } catch (e) {
            console.error(e);
            return;
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
    
    if (rememberMe) localStorage.setItem('life_rpg_remembered_user', userField);
    else localStorage.removeItem('life_rpg_remembered_user');
    
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-interface').classList.remove('hidden');
    
    checkSkillsDegradation();
    updateAvatarsConfig();
    renderAll();
    save();
}

async function save() {
    if (!gameState.user) return;
    const passInput = document.getElementById('auth-password');
    const currentPassword = passInput ? passInput.value.trim() : "12345";
    const authData = { password: currentPassword, state: gameState };
    
    localStorage.setItem(`life_rpg_auth_${gameState.user}`, JSON.stringify(authData));
    
    if (supabaseClient) {
        try {
            await supabaseClient.from('user_profiles').update({ state: gameState }).eq('username', gameState.user);
        } catch (e) {
            console.error(e);
        }
    }
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
                
                if (skill.id === "home_sport" || skill.type === "sport") {
                    gameState.lastSportTime = Date.now();
                }

                let statReward = skill.type === 'sport' ? 'stamina' : 'intellect';
                addXP(2, statReward);
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
        const skill = gameState.skills.find(s => s.id === ach.targetSkillId);
        if (skill && skill.totalMinutes >= ach.targetMinutes) {
            gameState.unlockedAchievements.push(ach.id);
            gameState.activeTitle = ach.rewardTitle; 
        }
    });
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

function addXP(amount, targetStat = null) {
    if (gameState.equippedHead && itemsDatabase[gameState.equippedHead]) {
        amount += amount * itemsDatabase[gameState.equippedHead].bonus;
    }
    gameState.xp += amount;
    let needed = gameState.lvl * 100 + (gameState.lvl - 1) * 50;
    while (gameState.xp >= needed) {
        gameState.xp -= needed;
        gameState.lvl++;
        if (targetStat && gameState.stats[targetStat] !== undefined) gameState.stats[targetStat]++;
        needed = gameState.lvl * 100 + (gameState.lvl - 1) * 50;
    }
    renderAll();
    save();
}

function buyItem(itemId) {
    const item = itemsDatabase[itemId];
    if (gameState.inventory.includes(itemId) && item.type === "avatar") {
        return alert("Этот аватар уже куплен!");
    }
    if (gameState.gold < item.price) return alert("Недостаточно золота! 💰");
    if (gameState.stats[item.reqStat] < item.reqVal) {
        return alert(`Требуется ${item.reqStat.toUpperCase()} уровня ${item.reqVal}!`);
    }
    
    gameState.gold -= item.price;
    gameState.inventory.push(itemId); 
    updateAvatarsConfig();
    renderAll();
    save();
}

function toggleEquip(itemId) {
    const item = itemsDatabase[itemId];
    if (item && item.type === "hat") {
        gameState.equippedHead = (gameState.equippedHead === itemId) ? null : itemId;
    }
    renderAll();
    save();
}

function checkSkillsDegradation() {
    const now = Date.now();
    gameState.skills.forEach(skill => {
        if (!skill.lastActivity) skill.lastActivity = now;
        let daysPassed = Math.floor((now - skill.lastActivity) / (24 * 60 * 60 * 1000));
        if (daysPassed >= 3) {
            skill.totalMinutes = Math.max(0, skill.totalMinutes - Math.floor(daysPassed / 3) * 5);
            skill.lastActivity = now;
        }
    });
}

function getSkillStatusAndGrade(minutes) {
    let currentGrade = skillGradesConfig[0].text;
    for (let i = 0; i < skillGradesConfig.length; i++) {
        if (minutes >= skillGradesConfig[i].req) currentGrade = skillGradesConfig[i].text;
        else break;
    }
    return currentGrade;
}

// === ПОЛНЫЙ И ИСПРАВЛЕННЫЙ РЕНДЕРИНГ ИНТЕРФЕЙСА ===

function renderAll() {
    if (!gameState.user) return;

    // Проверка на облысение (7 дней)
    const currentList = [...avatarsConfig[gameState.avatarGender || 'female']];
    const isBaldPunished = (Date.now() - (gameState.lastSportTime || Date.now())) >= (7 * 24 * 60 * 60 * 1000);

    // Левая панель героя
    if (document.getElementById('hero-name')) document.getElementById('hero-name').innerHTML = `<span style="font-size:16px; color:#c6ff00; text-shadow: 2px 2px #000;">${gameState.user.toUpperCase()}</span>`;
    if (document.getElementById('hero-title')) document.getElementById('hero-title').innerHTML = `<span style="font-size:11px; color:#00ffff;">${gameState.activeTitle}</span>`;
    if (document.getElementById('lvl')) document.getElementById('lvl').innerText = gameState.lvl;
    if (document.getElementById('gold-text')) document.getElementById('gold-text').innerHTML = `<span style="color:#ffcc00;">${gameState.gold} БАКСОВ</span>`;
    
    let needed = gameState.lvl * 100 + (gameState.lvl - 1) * 50;
    if (document.getElementById('xp-text')) document.getElementById('xp-text').innerText = `${Math.floor(gameState.xp)}/${needed}`;
    if (document.getElementById('xp-bar')) document.getElementById('xp-bar').style.width = `${Math.min((gameState.xp / needed) * 100, 100)}%`;
    
    // Статы
    if (document.getElementById('stat-intellect')) document.getElementById('stat-intellect').innerText = gameState.stats.intellect;
    if (document.getElementById('stat-willpower')) document.getElementById('stat-willpower').innerText = gameState.stats.willpower;
    if (document.getElementById('stat-stamina')) document.getElementById('stat-stamina').innerText = gameState.stats.stamina;
    if (document.getElementById('stat-wealth')) document.getElementById('stat-wealth').innerText = gameState.stats.wealth;

    // Текст под аватаром
    const avNumEl = document.getElementById('avatar-number');
    if (avNumEl) {
        avNumEl.innerHTML = isBaldPunished 
            ? `<span style="font-size:10px; color:#ff0055; font-weight:bold;">🚨 НАКАЗАНИЕ: ЛЫСЫЙ (МАРШ В ЗАЛ!)</span>`
            : `<span style="font-size:12px; color:white;">Облик ${gameState.avatarIndex}</span>`;
    }
    
    // Слой аватара и шапки
    const heroImg = document.getElementById('hero-img-base');
    if (heroImg) heroImg.src = isBaldPunished ? "avatar_bald_punished.png" : (currentList[gameState.avatarIndex - 1] || currentList[0]);
    
    const hatLayer = document.getElementById('avatar-layer-hat');
    if (hatLayer) {
        if (!isBaldPunished && gameState.equippedHead && itemsDatabase[gameState.equippedHead]) {
            const item = itemsDatabase[gameState.equippedHead];
            hatLayer.src = item.src;
            const coords = item.offsets[gameState.avatarGender || 'female'];
            hatLayer.style.top = coords.top; hatLayer.style.left = coords.left; hatLayer.style.width = coords.width;
            hatLayer.classList.remove('hidden');
        } else {
            hatLayer.classList.add('hidden');
        }
    }

    // Вкладка 1: НАВЫКИ
    const skillsContainer = document.getElementById('skills-container-list');
    if (skillsContainer) {
        skillsContainer.innerHTML = '';
        gameState.skills.forEach(skill => {
            const grade = getSkillStatusAndGrade(skill.totalMinutes);
            const isThisTimerRunning = (activeTimerId === skill.id);
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <div class="skill-meta" onclick="toggleSkillTimer('${skill.id}')" style="background:#1a1a24; border: 3px solid #000; padding:10px; cursor:pointer; margin-bottom:10px;">
                    <span class="skill-title" style="font-size:12px; color:white; display:block;">${skill.title}</span>
                    <span class="skill-status" style="font-size:9px; color:#ff0055; display:block; margin-top:4px;">${grade.toUpperCase()}</span>
                    <div style="font-size:11px; color:#c6ff00; margin-top:6px;">Пройдено: ${skill.totalMinutes} мин ${isThisTimerRunning ? ` (${secondsCountdown}с)` : ''}</div>
                    <button class="btn-timer ${isThisTimerRunning ? 'active' : ''}" style="margin-top:8px; width:100%; font-size:10px;">
                        ${isThisTimerRunning ? '⏹️ СТОП' : '▶️ СТАРТ'}
                    </button>
                </div>
            `;
            skillsContainer.appendChild(card);
        });
    }

    // Вкладка 2: МАГАЗИН (Рендерится динамически, чтобы кнопки работали!)
    const shopContainer = document.getElementById('shop-items-container') || document.getElementById('tab-shop');
    if (shopContainer) {
        // Если внутри таба нет контейнера для айтемов, создаем его один раз или очищаем содержимое
        let itemsBox = document.getElementById('shop-dynamic-box');
        if (!itemsBox) {
            itemsBox = document.createElement('div');
            itemsBox.id = 'shop-dynamic-box';
            shopContainer.appendChild(itemsBox);
        }
        itemsBox.innerHTML = '<h3 style="font-size:14px; color:#ffaa00; margin-bottom:15px;">🛒 МАГАЗИН ПРЕДМЕТОВ И ОБЛИКОВ</h3>';

        Object.keys(itemsDatabase).forEach(key => {
            const item = itemsDatabase[key];
            const isBought = gameState.inventory.includes(item.id);
            const isEquipped = gameState.equippedHead === item.id;
            
            const itemCard = document.createElement('div');
            itemCard.className = 'shop-item-card';
            itemCard.style = "background:#1c1c24; border:3px solid #000; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;";
            
            let actionBtnText = `КУПИТЬ (${item.price}💰)`;
            let btnClass = "";
            if (isBought) {
                if (item.type === "hat") {
                    actionBtnText = isEquipped ? "СНЯТЬ" : "НАДЕТЬ";
                    btnClass = isEquipped ? "active" : "";
                } else {
                    actionBtnText = "КУПЛЕНО";
                    btnClass = "active";
                }
            }

            itemCard.innerHTML = `
                <div>
                    <div style="font-size:12px; color:#fff; font-weight:bold;">${item.name}</div>
                    <div style="font-size:9px; color:#888; margin-top:4px;">Требует: ${item.reqStat.toUpperCase()} ${item.reqVal}</div>
                </div>
                <button class="${btnClass}" id="btn-shop-${item.id}" style="font-size:9px; padding:6px 10px;">${actionBtnText}</button>
            `;
            itemsBox.appendChild(itemCard);

            // Навешиваем рабочий клик на кнопку
            document.getElementById(`btn-shop-${item.id}`).addEventListener('click', () => {
                if (!isBought) {
                    buyItem(item.id);
                } else {
                    if (item.type === "hat") toggleEquip(item.id);
                }
            });
        });
    }

    // Вкладка 3: ДОСТИЖЕНИЯ
    const achTabContainer = document.getElementById('achievements-list-container');
    if (achTabContainer) {
        achTabContainer.innerHTML = '';
        Object.keys(achievementsDatabase).forEach(key => {
            const ach = achievementsDatabase[key];
            const skill = gameState.skills.find(s => s.id === ach.targetSkillId);
            let currentMinutes = skill ? skill.totalMinutes : 0;
            const isCompleted = currentMinutes >= ach.targetMinutes;
            
            const card = document.createElement('div');
            card.className = 'ach-card';
            card.style = `border: 3px solid ${isCompleted ? '#c6ff00' : '#000'}; background: #1c1c24; margin: 10px 0; padding: 12px;`;
            card.innerHTML = `
                <span class="ach-name" style="${isCompleted ? 'color:#c6ff00;' : 'color:white;'} font-size:11px; font-weight:bold; display:block;">
                    ${isCompleted ? '🏆' : '🔒'} ${ach.title}
                </span>
                <div style="color:#00ffff; font-size:9px; margin-top:4px;">${ach.desc}</div>
                <div style="font-size:10px; color:#aaa; margin-top:6px;">Прогресс: ${currentMinutes}/${ach.targetMinutes} мин</div>
            `;
            achTabContainer.appendChild(card);
        });
    }
}

function initDragAndDrop() {}