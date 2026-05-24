// === НАСТРОЙКА ОБЛАКА SUPABASE ===
const SUPABASE_URL = "https://ysftfljmqsavkjoguwkt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_GE8-KlpP0xtPpjGs2cf1EA_eyeKFSBq"; 

let supabaseClient = null;

if (SUPABASE_URL && !SUPABASE_URL.includes("your-project-id")) {
    try {
        const sb = window.supabase;
        if (sb && typeof sb.createClient === 'function') {
            supabaseClient = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.error("Ошибка инициализации клиента Supabase:", e);
    }
}

// === ВАЛЮТА (отображение) ===
const CURRENCY_NAME = 'пицца-коинов';
const CURRENCY_ICON = '🍕';

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

const itemsDatabase = {
    ragged_hat: { 
        id: "ragged_hat", type: "hat", name: "🎓 Рваный Колпак", bonus: 0.02, src: "hat_ragged.png", price: 15, reqStat: "intellect", reqVal: 0,
        offsets: {
            female: { topPct: 0.05, leftPct: 0.5, widthPct: 0.78 },
            male: { topPct: 0.05, leftPct: 0.5, widthPct: 0.78 }
        }
    },
    mage_hat: { 
        id: "mage_hat", type: "hat", name: "🔮 Колпак Мага", bonus: 0.10, src: "hat_mage.png", price: 100, reqStat: "intellect", reqVal: 5,
        offsets: {
            female: { topPct: 0.03, leftPct: 0.5, widthPct: 0.75 },
            male: { topPct: 0.03, leftPct: 0.5, widthPct: 0.75 }
        }
    },
    sage_crown: { 
        id: "sage_crown", type: "hat", name: "👑 Корона Мудреца", bonus: 0.25, src: "hat_crown.png", price: 350, reqStat: "intellect", reqVal: 12,
        offsets: {
            female: { topPct: 0.09, leftPct: 0.5, widthPct: 0.38 },
            male: { topPct: 0.09, leftPct: 0.5, widthPct: 0.38 }
        }
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

let hatPositionFrame = null;

function scheduleHatPosition() {
    if (hatPositionFrame) cancelAnimationFrame(hatPositionFrame);
    hatPositionFrame = requestAnimationFrame(() => {
        hatPositionFrame = requestAnimationFrame(applyHatPosition);
    });
}

function applyHatPosition() {
    const heroImg = document.getElementById('hero-img-base');
    const hatLayer = document.getElementById('avatar-layer-hat');
    if (!heroImg || !hatLayer || hatLayer.classList.contains('hidden')) return;
    if (!gameState.equippedHead || !itemsDatabase[gameState.equippedHead]) return;

    const item = itemsDatabase[gameState.equippedHead];
    const gender = gameState.avatarGender || 'female';
    const coords = item.offsets?.[gender] || item.offsets?.female;
    if (!coords) return;

    const container = heroImg.closest('.big-avatar-container');
    if (!container || !heroImg.offsetWidth) return;

    const containerRect = container.getBoundingClientRect();
    const heroRect = heroImg.getBoundingClientRect();
    const heroLeft = heroRect.left - containerRect.left;
    const heroTop = heroRect.top - containerRect.top;
    const heroW = heroRect.width;
    const heroH = heroRect.height;

    const topPct = coords.topPct ?? 0.05;
    const leftPct = coords.leftPct ?? 0.5;
    const widthPct = coords.widthPct ?? 0.7;

    hatLayer.style.left = `${heroLeft + heroW * leftPct}px`;
    hatLayer.style.top = `${heroTop + heroH * topPct}px`;
    hatLayer.style.width = `${heroW * widthPct}px`;
    hatLayer.style.transform = 'translateX(-50%)';
}

window.addEventListener('DOMContentLoaded', async () => {
    const toggleSkillsBtn = document.getElementById('toggle-skills-btn');
    if (toggleSkillsBtn) toggleSkillsBtn.addEventListener('click', toggleSkillsCollapse);

    const heroImg = document.getElementById('hero-img-base');
    if (heroImg) {
        heroImg.addEventListener('load', scheduleHatPosition);
    }
    window.addEventListener('resize', scheduleHatPosition);

    const rememberedUser = localStorage.getItem('life_rpg_remembered_user');
    if (rememberedUser) {
        if (document.getElementById('auth-username')) document.getElementById('auth-username').value = rememberedUser;
        if (document.getElementById('auth-remember')) document.getElementById('auth-remember').checked = true;

        const authData = localStorage.getItem(`life_rpg_auth_${rememberedUser}`);
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                if (document.getElementById('auth-password')) document.getElementById('auth-password').value = parsed.password || '';
                if (parsed.state) gameState = parsed.state;
            } catch (e) { console.error(e); }
        }
        if (!gameState || !gameState.user) {
            const legacy = localStorage.getItem(`life_rpg_state_${rememberedUser}`);
            if (legacy) {
                try {
                    gameState = JSON.parse(legacy);
                    if (!gameState.user) gameState.user = rememberedUser;
                } catch (e) { console.error(e); }
            }
        }
        if (supabaseClient && rememberedUser) {
            try {
                const { data } = await supabaseClient.from('user_profiles').select('state').eq('username', rememberedUser).maybeSingle();
                if (data?.state) gameState = parseGameState(data.state, rememberedUser);
            } catch (e) { console.error("Ошибка авто-входа через Supabase:", e); }
        }
        if (!gameState || !gameState.user) gameState = createInitialState(rememberedUser);
        normalizeGameState();

        if (gameState.user) {
            document.getElementById('auth-screen')?.classList.add('hidden');
            document.getElementById('game-interface')?.classList.remove('hidden');
            checkSkillsDegradation();
            updateAvatarsConfig();
            renderAll();
        }
    }
});

function switchMainTab(tabId) {
    document.querySelectorAll('.tab-main-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-main-btn').forEach(el => el.classList.remove('active'));
    
    // Показываем нужный блок. Если табов в HTML нет, открываем секции квестов/навыков точечно
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    } else {
        // Умный фоллбек на случай, если структура в index.html построена на секциях
        if (tabId === 'tab-skills') {
            document.getElementById('skills-container-list').parentElement.classList.remove('hidden');
        }
    }
    
    document.querySelectorAll('.tab-main-btn').forEach(btn => {
        if (tabId === 'tab-skills' && btn.innerText.includes("НАВЫКИ")) btn.classList.add('active');
        if (tabId === 'tab-shop' && btn.innerText.includes("МАГАЗИН")) btn.classList.add('active');
        if (tabId === 'tab-achievements' && (btn.innerText.includes("ТИТУЛЫ") || btn.innerText.includes("АЧИВКИ"))) btn.classList.add('active');
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

function isDuplicateKeyError(err) {
    return err?.code === '23505' || (err?.message && err.message.includes('duplicate key'));
}

function parseGameState(raw, username) {
    let state = raw;
    if (typeof state === 'string') {
        try { state = JSON.parse(state); } catch (e) { state = null; }
    }
    if (!state || typeof state !== 'object') state = createInitialState(username);
    if (!state.user) state.user = username;
    return state;
}

function loadLocalAuth(username, password) {
    try {
        const savedData = localStorage.getItem(`life_rpg_auth_${username}`);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.password !== password) return { success: false, wrongPassword: true };
            return { success: true, state: parseGameState(parsed.state, username) };
        }
        const legacy = localStorage.getItem(`life_rpg_state_${username}`);
        if (legacy) {
            return { success: true, state: parseGameState(JSON.parse(legacy), username) };
        }
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Ошибка чтения локального сохранения.' };
    }
    return { success: false };
}

async function authenticateUser(username, password) {
    if (!supabaseClient) return loadLocalAuth(username, password);

    const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        console.warn('Supabase select:', error);
    }

    if (data) {
        if (data.password !== password) {
            return { success: false, message: 'Неверный пароль героя!' };
        }
        return { success: true, state: parseGameState(data.state, username) };
    }

    // Облако не вернуло строку — сначала локальное сохранение (аккаунт мог уже существовать)
    const localFirst = loadLocalAuth(username, password);
    if (localFirst.success) return localFirst;
    if (localFirst.wrongPassword) {
        return { success: false, message: 'Неверный пароль героя!' };
    }
    if (localFirst.message) return { success: false, message: localFirst.message };

    const initialState = createInitialState(username);
    const { error: insertError } = await supabaseClient.from('user_profiles').insert({
        username,
        password,
        state: initialState
    });

    if (!insertError) {
        return { success: true, state: initialState };
    }

    if (isDuplicateKeyError(insertError)) {
        const { data: retryData } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (retryData) {
            if (retryData.password !== password) {
                return { success: false, message: 'Неверный пароль героя!' };
            }
            return { success: true, state: parseGameState(retryData.state, username) };
        }

        const localAgain = loadLocalAuth(username, password);
        if (localAgain.success) return localAgain;
        if (localAgain.wrongPassword) {
            return { success: false, message: 'Неверный пароль героя!' };
        }

        return {
            success: false,
            message: 'Аккаунт уже есть в базе, но сайт не может его прочитать. Войдите с того же браузера, где уже играли, или в Supabase включите SELECT для таблицы user_profiles (RLS).'
        };
    }

    return { success: false, message: 'Не удалось создать аккаунт: ' + insertError.message };
}

async function handleAuth() {
    const userField = document.getElementById('auth-username').value.trim();
    const passField = document.getElementById('auth-password').value.trim();
    const rememberMe = document.getElementById('auth-remember')?.checked;

    if (!userField || !passField) return alert("Введите имя и пароль!");

    const result = await authenticateUser(userField, passField);
    if (!result.success) return alert(result.message || 'Не удалось войти.');
    gameState = result.state;

    if (rememberMe) localStorage.setItem('life_rpg_remembered_user', userField);
    else localStorage.removeItem('life_rpg_remembered_user');

    finishLogin();
}

function normalizeGameState() {
    if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
    if (!gameState.customTasks) gameState.customTasks = [];
    if (!gameState.inventory) gameState.inventory = [];
    if (!gameState.stats) gameState.stats = { intellect: 1, willpower: 1, stamina: 1, wealth: 1 };
    if (!gameState.skills) gameState.skills = createInitialState(gameState.user || 'hero').skills;
    if (gameState.skillsCollapsed === undefined) gameState.skillsCollapsed = false;
    if (!gameState.pinnedAchId) gameState.pinnedAchId = 'eng_100';
    if (!gameState.activeTitle) gameState.activeTitle = '✨ Без звания';
}

function finishLogin() {
    normalizeGameState();
    document.getElementById('auth-screen')?.classList.add('hidden');
    document.getElementById('game-interface')?.classList.remove('hidden');
    checkSkillsDegradation();
    updateAvatarsConfig();
    renderAll();
    save();
}

async function save() {
    if (!gameState.user) return;
    const passInput = document.getElementById('auth-password');
    const currentPassword = passInput ? passInput.value.trim() : "";
    localStorage.setItem(`life_rpg_auth_${gameState.user}`, JSON.stringify({ password: currentPassword, state: gameState }));
    localStorage.setItem(`life_rpg_state_${gameState.user}`, JSON.stringify(gameState));

    if (supabaseClient) {
        try {
            const payload = { state: gameState };
            if (currentPassword) payload.password = currentPassword;
            await supabaseClient.from('user_profiles').update(payload).eq('username', gameState.user);
        } catch (e) {
            console.error("Ошибка сохранения в Supabase:", e);
        }
    }
}

function logOut() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    activeTimerId = null;
    localStorage.removeItem('life_rpg_remembered_user');
    document.getElementById('game-interface')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.remove('hidden');
    gameState = {};
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

function questStatToKey(stat) {
    const keys = ['intellect', 'willpower', 'stamina', 'wealth'];
    if (keys.includes(stat)) return stat;
    if (typeof stat !== 'string') return 'intellect';
    if (stat.includes('Воля')) return 'willpower';
    if (stat.includes('Спорт') || stat.includes('Тело') || stat.includes('Тонус')) return 'stamina';
    if (stat.includes('Богатство')) return 'wealth';
    return 'intellect';
}

function createNewTask() {
    const text = document.getElementById('task-name')?.value?.trim();
    if (!text) return alert("Введите название квеста!");

    const period = document.getElementById('task-period')?.value || 'day';
    const stat = document.getElementById('task-stat')?.value || 'intellect';
    const rewardXp = parseInt(document.getElementById('task-xp')?.value, 10) || 15;
    const rewardGold = parseInt(document.getElementById('task-gold')?.value, 10) || 10;

    if (!gameState.customTasks) gameState.customTasks = [];
    gameState.customTasks.push({
        id: 'quest_' + Date.now(),
        text,
        period,
        stat,
        rewardXp,
        rewardGold
    });

    const nameInput = document.getElementById('task-name');
    if (nameInput) nameInput.value = '';
    renderAll();
    save();
}

function completeQuest(questId) {
    const questIdx = gameState.customTasks.findIndex(q => q.id === questId);
    if (questIdx === -1) return;

    const quest = gameState.customTasks[questIdx];
    gameState.gold += quest.rewardGold;
    addXP(quest.rewardXp, questStatToKey(quest.stat));
    gameState.customTasks.splice(questIdx, 1);
    renderAll();
    save();
}

function pinAchievement(achId) {
    gameState.pinnedAchId = achId;
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

function selectAvatarBySrc(src) {
    const list = avatarsConfig[gameState.avatarGender];
    const foundIdx = list.indexOf(src);
    if (foundIdx !== -1) {
        gameState.avatarIndex = foundIdx + 1;
    }
    renderAll();
    save();
}

function buyItem(itemId) {
    const item = itemsDatabase[itemId];
    if (!item) return;
    if (gameState.inventory.includes(itemId) && item.type === "avatar") {
        return alert("Этот аватар уже куплен!");
    }
    if (gameState.gold < item.price) return alert(`Недостаточно ${CURRENCY_NAME}! ${CURRENCY_ICON}`);
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
    if (!gameState.skills) return;
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

function renderAll() {
    if (!gameState.user) return;

    const currentList = [...avatarsConfig[gameState.avatarGender || 'female']];
    const isBaldPunished = (Date.now() - (gameState.lastSportTime || Date.now())) >= (7 * 24 * 60 * 60 * 1000);

    if (document.getElementById('hero-name')) document.getElementById('hero-name').innerHTML = `<span style="font-size:16px; color:#c6ff00; text-shadow: 2px 2px #000;">${gameState.user.toUpperCase()}</span>`;
    if (document.getElementById('hero-title')) document.getElementById('hero-title').innerHTML = `<span style="font-size:11px; color:#00ffff;">${gameState.activeTitle}</span>`;
    if (document.getElementById('lvl')) document.getElementById('lvl').innerText = gameState.lvl;
    if (document.getElementById('gold-text')) document.getElementById('gold-text').innerHTML = `<span style="color:#ffcc00;">${gameState.gold} ${CURRENCY_NAME.toUpperCase()}</span>`;
    
    let needed = gameState.lvl * 100 + (gameState.lvl - 1) * 50;
    if (document.getElementById('xp-text')) document.getElementById('xp-text').innerText = `${Math.floor(gameState.xp)}/${needed}`;
    if (document.getElementById('xp-bar')) document.getElementById('xp-bar').style.width = `${Math.min((gameState.xp / needed) * 100, 100)}%`;
    
    if (document.getElementById('stat-intellect')) document.getElementById('stat-intellect').innerText = gameState.stats.intellect;
    if (document.getElementById('stat-willpower')) document.getElementById('stat-willpower').innerText = gameState.stats.willpower;
    if (document.getElementById('stat-stamina')) document.getElementById('stat-stamina').innerText = gameState.stats.stamina;
    if (document.getElementById('stat-wealth')) document.getElementById('stat-wealth').innerText = gameState.stats.wealth;

    const avNumEl = document.getElementById('avatar-number');
    if (avNumEl) {
        avNumEl.innerHTML = isBaldPunished 
            ? `<span style="font-size:10px; color:#ff0055; font-weight:bold;">🚨 НАКАЗАНИЕ: ЛЫСЫЙ (МАРШ В ЗАЛ!)</span>`
            : `<span style="font-size:12px; color:white;">Облик ${gameState.avatarIndex} из ${currentList.length}</span>`;
    }
    
    const heroImg = document.getElementById('hero-img-base');
    const currentAvatarSrc = currentList[gameState.avatarIndex - 1] || currentList[0];
    if (heroImg) heroImg.src = isBaldPunished ? "avatar_bald_punished.png" : currentAvatarSrc;
    
    const hatLayer = document.getElementById('avatar-layer-hat');
    if (hatLayer) {
        if (!isBaldPunished && gameState.equippedHead && itemsDatabase[gameState.equippedHead]) {
            const item = itemsDatabase[gameState.equippedHead];
            if (item.offsets) {
                hatLayer.src = item.src;
                hatLayer.classList.remove('hidden');
                scheduleHatPosition();
            }
        } else {
            hatLayer.classList.add('hidden');
        }
    }

    // РЕНДЕР НАВЫКОВ (Убрали черный ломающий фон)
    const skillsContainer = document.getElementById('skills-container-list');
    if (skillsContainer) {
        skillsContainer.innerHTML = '';
        gameState.skills.forEach(skill => {
            const grade = getSkillStatusAndGrade(skill.totalMinutes);
            const isThisTimerRunning = (activeTimerId === skill.id);
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <div class="skill-top-row">
                    <span class="skill-title">${skill.title}</span>
                    <span class="skill-status">${grade}</span>
                </div>
                <div class="skill-progress-text">Пройдено: ${skill.totalMinutes} мин${isThisTimerRunning ? ` (${secondsCountdown}с)` : ''}</div>
                <button type="button" class="btn-timer ${isThisTimerRunning ? 'active' : ''}" onclick="toggleSkillTimer('${skill.id}')">
                    ${isThisTimerRunning ? '⏹️ СТОП' : '▶️ СТАРТ'}
                </button>
            `;
            skillsContainer.appendChild(card);
        });
    }

    renderQuestLists();

    const pinnedAch = achievementsDatabase[gameState.pinnedAchId];
    if (pinnedAch) {
        const skill = gameState.skills.find(s => s.id === pinnedAch.targetSkillId);
        const currentMinutes = skill ? skill.totalMinutes : 0;
        const pct = Math.min(100, (currentMinutes / pinnedAch.targetMinutes) * 100);
        if (document.getElementById('pinned-ach-title')) document.getElementById('pinned-ach-title').innerText = pinnedAch.title;
        if (document.getElementById('pinned-ach-progress')) document.getElementById('pinned-ach-progress').innerText = `${currentMinutes}/${pinnedAch.targetMinutes} мин`;
        if (document.getElementById('pinned-ach-bar')) document.getElementById('pinned-ach-bar').style.width = `${pct}%`;
    }

    const invList = document.getElementById('inventory-list');
    if (invList) {
        invList.innerHTML = '';
        if (!gameState.inventory || gameState.inventory.length === 0) {
            invList.innerHTML = '<div style="font-size:9px;color:#666;">Пусто</div>';
        } else {
            gameState.inventory.forEach(itemId => {
                const item = itemsDatabase[itemId];
                if (!item) return;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'inv-chip';
                chip.style.cssText = 'font-size:8px;padding:4px 6px;margin:2px;cursor:pointer;background:#2a2a3a;border:2px solid #000;color:#fff;';
                const equipped = item.type === 'hat' && gameState.equippedHead === itemId;
                chip.innerText = (equipped ? '★ ' : '') + item.name;
                chip.addEventListener('click', () => {
                    if (item.type === 'hat') toggleEquip(itemId);
                    else if (item.type === 'avatar') {
                        changeGender(item.gender);
                        selectAvatarBySrc(item.src);
                    }
                });
                invList.appendChild(chip);
            });
        }
    }

    const skillsWrapper = document.getElementById('skills-collapsible-wrapper');
    const collapseArrow = document.getElementById('collapse-arrow');
    if (skillsWrapper) skillsWrapper.classList.toggle('hidden', !!gameState.skillsCollapsed);
    if (collapseArrow) collapseArrow.innerText = gameState.skillsCollapsed ? '▶' : '▼';

    // РЕНДЕР МАГАЗИНА
    const shopContainer = document.getElementById('shop-items-container');
    if (shopContainer) {
        shopContainer.innerHTML = '<h3 style="font-size:14px; color:#ffaa00; margin-bottom:15px;">🛒 МАГАЗИН ПРЕДМЕТОВ И ОБЛИКОВ</h3>';
        Object.keys(itemsDatabase).forEach(key => {
            const item = itemsDatabase[key];
            const isBought = gameState.inventory.includes(item.id);
            let isEquipped = item.type === "hat" ? (gameState.equippedHead === item.id) : (currentAvatarSrc === item.src && gameState.avatarGender === item.gender);
            
            const itemCard = document.createElement('div');
            itemCard.className = 'shop-item-card';
            let actionBtnText = isBought ? (isEquipped ? (item.type === "hat" ? "СНЯТЬ" : "АКТИВЕН") : "НАДЕТЬ") : `КУПИТЬ (${item.price}${CURRENCY_ICON})`;
            
            itemCard.innerHTML = `
                <div>
                    <div style="font-size:12px; color:#fff; font-weight:bold;">${item.name}</div>
                    <div style="font-size:9px; color:#888;">Требует: ${item.reqStat.toUpperCase()} ${item.reqVal}</div>
                </div>
                <button class="${isBought && isEquipped ? 'active' : ''}" id="btn-shop-${item.id}">${actionBtnText}</button>
            `;
            shopContainer.appendChild(itemCard);

            document.getElementById(`btn-shop-${item.id}`).addEventListener('click', () => {
                if (!isBought) buyItem(item.id);
                else item.type === "hat" ? toggleEquip(item.id) : (changeGender(item.gender), selectAvatarBySrc(item.src));
            });
        });
    }

    // РЕНДЕР АЧИВОК С КЛИКАБЕЛЬНЫМ ОТСЛЕЖИВАНИЕМ
    const achTabContainer = document.getElementById('achievements-list-container');
    if (achTabContainer) {
        achTabContainer.innerHTML = '';
        Object.keys(achievementsDatabase).forEach(key => {
            const ach = achievementsDatabase[key];
            const skill = gameState.skills.find(s => s.id === ach.targetSkillId);
            let currentMinutes = skill ? skill.totalMinutes : 0;
            const isCompleted = currentMinutes >= ach.targetMinutes;
            const isPinned = gameState.pinnedAchId === ach.id || gameState.pinnedAchId === key;
            
            const card = document.createElement('div');
            card.className = `ach-card ${isPinned ? 'pinned' : ''}`;
            card.style = `border: 3px solid ${isCompleted ? '#c6ff00' : (isPinned ? '#00ffff' : '#000')}; background: #1c1c24; margin: 10px 0; padding: 12px; cursor: pointer;`;
            card.innerHTML = `
                <span class="ach-name" style="${isCompleted ? 'color:#c6ff00;' : 'color:white;'} font-size:11px; font-weight:bold; display:block;">
                    ${isCompleted ? '🏆' : '🔒'} ${ach.title} ${isPinned ? '📌 (ОТСЛЕЖИВАЕТСЯ)' : ''}
                </span>
                <div style="color:#00ffff; font-size:9px; margin-top:4px;">${ach.desc}</div>
                <div style="font-size:10px; color:#aaa; margin-top:6px;">Прогресс: ${currentMinutes}/${ach.targetMinutes} мин</div>
            `;
            card.addEventListener('click', () => pinAchievement(ach.id));
            achTabContainer.appendChild(card);
        });
    }
}

function renderQuestLists() {
    const dayList = document.getElementById('list-day');
    const weekList = document.getElementById('list-week');
    if (!dayList || !weekList) return;

    const emptyMsg = '<div class="list-empty">Пусто</div>';
    dayList.innerHTML = '';
    weekList.innerHTML = '';

    const tasks = gameState.customTasks || [];
    const dayTasks = tasks.filter(q => q.period === 'day' || q.period === 'Дневной план');
    const weekTasks = tasks.filter(q => q.period === 'week' || q.period === 'Недельный рубеж');

    const appendQuest = (container, quest) => {
        const qEl = document.createElement('div');
        qEl.className = 'quest-card';
        qEl.innerHTML = `
            <div class="quest-info">
                <div class="quest-title">${quest.text}</div>
                <div class="quest-reward">+${quest.rewardXp} XP · +${quest.rewardGold} ${CURRENCY_ICON}</div>
            </div>
            <div class="quest-actions">
                <button type="button" class="btn-complete" onclick="completeQuest('${quest.id}')">✓</button>
            </div>
        `;
        container.appendChild(qEl);
    };

    if (dayTasks.length === 0) dayList.innerHTML = emptyMsg;
    else dayTasks.forEach(q => appendQuest(dayList, q));

    if (weekTasks.length === 0) weekList.innerHTML = emptyMsg;
    else weekTasks.forEach(q => appendQuest(weekList, q));
}

function toggleSkillsCollapse() {
    gameState.skillsCollapsed = !gameState.skillsCollapsed;
    renderAll();
    save();
}

function openGradesModal() {
    const modal = document.getElementById('grades-modal');
    const list = document.getElementById('grades-modal-list');
    if (list) {
        list.innerHTML = skillGradesConfig.map(g =>
            `<div style="font-size:10px;padding:6px 0;border-bottom:1px solid #333;">${g.req} мин — ${g.text}</div>`
        ).join('');
    }
    modal?.classList.remove('hidden');
}

function closeGradesModal() {
    document.getElementById('grades-modal')?.classList.add('hidden');
}

function openNewSkillModal() {
    const titleInput = document.getElementById('new-skill-title');
    if (titleInput) titleInput.value = '';
    document.getElementById('skill-modal')?.classList.remove('hidden');
}

function closeNewSkillModal() {
    document.getElementById('skill-modal')?.classList.add('hidden');
}

function submitNewSkill() {
    const title = document.getElementById('new-skill-title')?.value?.trim();
    const type = document.getElementById('new-skill-type')?.value || 'edu';
    if (!title) return alert('Введите название навыка!');
    gameState.skills.push({
        id: 'custom_' + Date.now(),
        title,
        type,
        totalMinutes: 0,
        lastActivity: Date.now()
    });
    closeNewSkillModal();
    renderAll();
    save();
}

function openProfileModal() {
    const nameInput = document.getElementById('edit-username');
    const passInput = document.getElementById('edit-password');
    if (nameInput) nameInput.value = gameState.user || '';
    if (passInput) passInput.value = '';
    document.getElementById('profile-modal')?.classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profile-modal')?.classList.add('hidden');
}

function submitProfileEdit() {
    const newName = document.getElementById('edit-username')?.value?.trim();
    const newPass = document.getElementById('edit-password')?.value;
    if (newPass) {
        const authPass = document.getElementById('auth-password');
        if (authPass) authPass.value = newPass;
    }
    if (newName && newName !== gameState.user) {
        if (!confirm('Сменить имя героя? Старое локальное сохранение останется под прежним именем.')) return;
        const oldUser = gameState.user;
        localStorage.removeItem(`life_rpg_auth_${oldUser}`);
        localStorage.removeItem(`life_rpg_state_${oldUser}`);
        gameState.user = newName;
        localStorage.setItem('life_rpg_remembered_user', newName);
        if (document.getElementById('auth-username')) document.getElementById('auth-username').value = newName;
    }
    closeProfileModal();
    renderAll();
    save();
}

function resetAllProgress() {
    if (!gameState.user) return;
    if (!confirm(`Сбросить ВСЁ: уровень, ${CURRENCY_NAME}, навыки, инвентарь? Это нельзя отменить!`)) return;
    const username = gameState.user;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    activeTimerId = null;
    gameState = createInitialState(username);
    renderAll();
    save();
}