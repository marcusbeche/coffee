// Configuração das bebidas (ícone, nome, descrição, tempo simulado)
const DRINKS = [
	{ id: 'espresso',     name: 'Espresso',        icon: '☕',  desc: 'Intenso e curto', durationMs: 6000 },
	{ id: 'lungo',        name: 'Café Longo',     icon: '🥤',  desc: 'Mais volume',     durationMs: 7000 },
	{ id: 'cappuccino',   name: 'Cappuccino',     icon: '🧋',  desc: 'Café + leite + espuma', durationMs: 9000 },
	{ id: 'latte',        name: 'Latte',          icon: '🥛',  desc: 'Suave e cremoso', durationMs: 9000 },
	{ id: 'mocha',        name: 'Mocha',          icon: '🍫',  desc: 'Café + chocolate', durationMs: 10000 },
	{ id: 'chocolate',    name: 'Chocolate',      icon: '🍩',  desc: 'Bebida de cacau', durationMs: 8500 },
	{ id: 'cha',          name: 'Chá',            icon: '🍵',  desc: 'Ervas ou limão',  durationMs: 7000 },
	{ id: 'agua',         name: 'Água Quente',    icon: '💧',  desc: 'Para infusões',   durationMs: 5000 }
];

// Estado
const state = {
	selectedDrink: null,
	sizeMl: 120,
	sugar: 0,
	isBrewing: false,
	testMode: false,
	soundOn: true,
	progress: 0
};

// Elementos
const $grid = document.getElementById('drinks-grid');
const $sheet = document.getElementById('sheet');
const $sheetTitle = document.getElementById('sheet-title');
const $sheetDesc = document.getElementById('sheet-desc');
const $sheetIcon = document.getElementById('sheet-icon');
const $sheetClose = document.getElementById('sheet-close');
const $brew = document.getElementById('brew');
const $brewIcon = document.getElementById('brew-icon');
const $brewTitle = document.getElementById('brew-title');
const $brewDetail = document.getElementById('brew-detail');
const $brewCancel = document.getElementById('brew-cancel');
const $ringFg = document.getElementById('ring-fg');
const $machineStatus = document.getElementById('machine-status');
const $testMode = document.getElementById('test-mode');
const $btnBrew = document.getElementById('btn-brew');
const $btnSound = document.getElementById('btn-sound');
const $btnFullscreen = document.getElementById('btn-fullscreen');

// Render grid
function renderGrid() {
	$grid.innerHTML = '';
	DRINKS.forEach(d => {
		const card = document.createElement('button');
		card.className = 'card';
		card.setAttribute('data-id', d.id);
		card.innerHTML = `
			<div class="card__icon">${d.icon}</div>
			<h3 class="card__title">${d.name}</h3>
			<p class="card__meta">${d.desc}</p>
		`;
		card.addEventListener('click', () => openSheet(d.id));
		$grid.appendChild(card);
	});
}

// Sheet controls
function openSheet(drinkId) {
	const d = DRINKS.find(x => x.id === drinkId);
	if (!d) return;
	state.selectedDrink = d;
	state.sizeMl = 120;
	state.sugar = 0;
	$sheetTitle.textContent = d.name;
	$sheetDesc.textContent = d.desc;
	$sheetIcon.textContent = d.icon;
	document.querySelectorAll('.segmented__btn').forEach(b => b.classList.remove('is-active'));
	document.querySelector('.segmented [data-size="120"]').classList.add('is-active');
	document.querySelector('.segmented [data-sugar="0"]').classList.add('is-active');
	$sheet.classList.remove('hidden');
	$sheet.setAttribute('aria-hidden', 'false');
	vibrate(10);
}
function closeSheet() {
	$sheet.classList.add('hidden');
	$sheet.setAttribute('aria-hidden', 'true');
}

// Segmented handlers
function initSegmented() {
	document.querySelectorAll('.segmented').forEach(group => {
		group.addEventListener('click', (e) => {
			const btn = e.target.closest('.segmented__btn');
			if (!btn) return;
			group.querySelectorAll('.segmented__btn').forEach(b => b.classList.remove('is-active'));
			btn.classList.add('is-active');
			const size = btn.getAttribute('data-size');
			const sugar = btn.getAttribute('data-sugar');
			if (size) state.sizeMl = Number(size);
			if (sugar) state.sugar = Number(sugar);
		});
	});
}

// Brew overlay
let brewTimer = null;
function openBrew() {
	if (!state.selectedDrink) return;
	state.isBrewing = true;
	state.progress = 0;
	$brewIcon.textContent = state.selectedDrink.icon;
	$brewTitle.textContent = `Preparando ${state.selectedDrink.name}…`;
	$brewDetail.textContent = `${state.sizeMl} ml  •  Açúcar ${labelSugar(state.sugar)}`;
	$brew.classList.remove('hidden');
	$brew.setAttribute('aria-hidden', 'false');
	setStatus('Preparando', 'busy');
	animateRing(0);
	playBeep(880, 80);
	vibrate(20);

	const total = Math.max(4000, state.selectedDrink.durationMs * (state.sizeMl / 120));
	const startedAt = performance.now();
	cancelAnimationFrame(brewTimer);
	const step = (t) => {
		const elapsed = t - startedAt;
		const p = Math.min(1, elapsed / total);
		state.progress = p;
		animateRing(p);
		if (p < 1) {
			brewTimer = requestAnimationFrame(step);
		} else {
			onBrewDone();
		}
	};
	brewTimer = requestAnimationFrame(step);
}
function cancelBrew() {
	if (!state.isBrewing) return;
	state.isBrewing = false;
	cancelAnimationFrame(brewTimer);
	animateRing(0);
	$brew.classList.add('hidden');
	$brew.setAttribute('aria-hidden', 'true');
	setStatus('Pronta', 'ok');
	playBeep(220, 100);
}
function onBrewDone() {
	state.isBrewing = false;
	playBeep(1200, 120);
	setTimeout(() => playBeep(1400, 120), 130);
	vibrate([20, 60, 20]);
	setStatus('Pronta • Retire sua bebida', 'ok');
	setTimeout(() => {
		$brew.classList.add('hidden');
		$brew.setAttribute('aria-hidden', 'true');
		setStatus('Pronta', 'ok');
	}, 1400);
}

// Helpers
function animateRing(progress) {
	const circumference = 2 * Math.PI * 52; // r=52
	const offset = circumference * (1 - progress);
	$ringFg.style.strokeDashoffset = String(offset);
}
function labelSugar(s) {
	return s === 0 ? '0' : (s === 1 ? 'Normal' : '++');
}
function setStatus(text, mode) {
	$machineStatus.textContent = text;
	const dot = document.querySelector('.dot');
	dot.classList.remove('dot--ok', 'dot--busy', 'dot--err');
	if (mode === 'busy') dot.classList.add('dot--busy');
	else if (mode === 'err') dot.classList.add('dot--err');
	else dot.classList.add('dot--ok');
}

// Sons simples via WebAudio
let audioCtx = null;
function ensureAudioCtx() {
	if (!audioCtx) {
		try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
	}
}
function playBeep(freq = 880, ms = 80) {
	if (!state.soundOn) return;
	ensureAudioCtx();
	if (!audioCtx) return;
	const o = audioCtx.createOscillator();
	const g = audioCtx.createGain();
	o.type = 'sine';
	o.frequency.value = freq;
	o.connect(g);
	g.connect(audioCtx.destination);
	const now = audioCtx.currentTime;
	g.gain.setValueAtTime(0.0001, now);
	g.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
	g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
	o.start(now);
	o.stop(now + ms / 1000 + 0.02);
}

function vibrate(pattern) {
	if (navigator.vibrate) navigator.vibrate(pattern);
}

// Fullscreen
async function enterFullscreen() {
	const el = document.documentElement;
	if (document.fullscreenElement) return;
	try {
		await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
	} catch {}
}

// Eventos
function initEvents() {
	$sheetClose.addEventListener('click', closeSheet);
	document.getElementById('btn-brew').addEventListener('click', () => {
		closeSheet();
		openBrew();
	});
	$brewCancel.addEventListener('click', cancelBrew);
	$testMode.addEventListener('change', (e) => {
		state.testMode = e.target.checked;
		setStatus(state.testMode ? 'Modo teste ativo' : 'Pronta', state.testMode ? 'busy' : 'ok');
	});
	$btnSound.addEventListener('click', () => {
		state.soundOn = !state.soundOn;
		$btnSound.textContent = state.soundOn ? '🔊' : '🔈';
		if (state.soundOn) playBeep(660, 70);
	});
	$btnFullscreen.addEventListener('click', enterFullscreen);
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			closeSheet();
			cancelBrew();
		}
	});
}

// Inicialização
function init() {
	renderGrid();
	initSegmented();
	initEvents();
	setStatus('Pronta', 'ok');
}
document.addEventListener('DOMContentLoaded', init);


