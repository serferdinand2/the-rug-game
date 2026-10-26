import { technologyCardMarkup, tapestryCardMarkup, TAPESTRY_CARDS } from '../../../src/lib/cards/card-layouts.js';
// Design-only decision examples for issue #3. The game engine supplies legal
// options and consequences in production; these fixtures only test the layout.
const art = (group, name) => `../../static/art/${group}/${name}.svg`;
const image = (group, name, label) => `<img src="${art(group, name)}" alt="${label}">`;
const option = (value, label, artHtml = '', extraClass = '') =>
	`<button type="button" class="decision-option ${extraClass}" data-choice="${value}" aria-pressed="false">${artHtml}<span>${label}</span></button>`;
const resources = [
	['coin', 'Coin'], ['food', 'Food'], ['worker', 'Worker'], ['culture', 'Culture'],
];
const resourceOptions = () => resources.map(([id, label]) => option(id, label, image('resource-48', id, ''))).join('');
const samples = {
	pay: {
		label: 'Pay', title: 'Pay the advancement cost', track: '#3f83a8',
		body: `<p>This example needs one food and one resource of your choice. Select the resource you would pay.</p><div class="decision-cost">Cost ${image('resource-24', 'food', 'Food')} + ${image('resource-24', 'any', 'Any resource')}</div><div class="decision-options">${resourceOptions()}</div>`,
	},
	resource: {
		label: 'Resources', title: 'Choose a resource',
		body: `<p>Choose one resource to gain. The 48 px artwork is reserved for the decision choices.</p><div class="decision-options">${resourceOptions()}</div>`,
	},
	hex: {
		label: 'Hexes', title: 'Choose a territory',
		body: `<p>Select one highlighted example territory. The board remains visible behind this prompt.</p><div class="decision-options">${['grassland','forest','mountain'].map((id, i) => option(id, `${id[0].toUpperCase()}${id.slice(1)} · ${i + 1}`, image('terrain', id, ''), '')).join('')}</div>`,
	},
	place: {
		label: 'Placement', title: 'Choose a buildable plot',
		body: `<p>Only open plots from the Mountain mat are shown. Choose where this example building would go.</p><div class="decision-options">${[1,3,5,7].map((variant, i) => option(String(i), `Plot ${i + 1}`, image('capital-terrain', `mountain-open-0${variant}`, ''))).join('')}</div>`,
	},
	cards: {
		label: 'Cards', title: 'Choose a tapestry card',
		body: '<p>Choose a tapestry card above this prompt, then confirm it here.</p>',
	},
	'setup-civ': {
		label: 'Civ setup', title: 'Choose your civilization',
		body: '<p>When Random civilizations is on, the game deals two civilizations at setup. Choose one card above to keep.</p>',
	},
	dice: {
		label: 'Dice', title: 'Choose a die result', track: '#579274',
		body: `<p>Choose one example result after a science roll.</p><div class="decision-options">${[['exploration','Exploration'],['science','Science'],['technology','Technology'],['military','Military']].map(([id,label]) => option(id, label, image('track', id, ''))).join('')}</div>`,
	},
	trap: {
		label: 'Trap', title: 'Respond to a trap',
		body: '<p>A defender chooses how to respond before the attack resolves. These are interface examples; availability comes from the game state.</p><div class="decision-options">'+option('reveal','Reveal a trap')+option('pass','Pass')+'</div>',
	},
};

const scaleCard = (markup, width, height, scale) => `<span class="rg-card-scale" style="--card-width:${width}px;--card-height:${height}px;--card-scale:${scale}">${markup}</span>`;
document.querySelector('#hand-card-list').innerHTML = ['age-of-sail', 'alliance', 'cartography', 'dystopia'].map(id => `<button type="button" class="hand-card" data-tapestry-card="${id}" aria-label="${TAPESTRY_CARDS[id].title} tapestry card">${scaleCard(tapestryCardMarkup(id), 319, 560, .48)}</button>`).join('');
document.querySelectorAll('[data-tech-card]').forEach(card => { card.innerHTML = scaleCard(technologyCardMarkup(card.dataset.techCard), 425, 286, .65); });
const sharedArea = document.querySelector('.shared');
const cardOverview = document.querySelector('#card-overview');
const cardOverviewFrame = document.querySelector('#card-overview-frame');
let previewedCard = null;
function previewCard(card) {
	if (card?.classList.contains('floating-card--civ')) return;
	const techId = card?.dataset.techCard;
	const tapestryId = card?.dataset.tapestryCard || (card?.classList.contains('floating-card') ? card.dataset.cardChoice : null);
	if (!techId && !tapestryId) return;
	previewedCard = card;
	const width = techId ? 425 : 319;
	const height = techId ? 286 : 560;
	const bounds = sharedArea.getBoundingClientRect();
	const visibleLeft = Math.max(0, bounds.left);
	const visibleRight = Math.min(window.innerWidth, bounds.right);
	const visibleWidth = Math.max(0, visibleRight - visibleLeft);
	const visibleCenter = (visibleLeft + visibleRight) / 2;
	const fit = Math.min(1, (visibleWidth - 36) / width, (sharedArea.clientHeight - 36) / height);
	cardOverviewFrame.innerHTML = scaleCard(techId ? technologyCardMarkup(techId) : tapestryCardMarkup(tapestryId), width, height, fit);
	cardOverviewFrame.style.transform = `translateX(${visibleCenter - bounds.left - bounds.width / 2}px)`;
	cardOverview.hidden = false;
}
function clearCardPreview(card = null) {
	if (card && card !== previewedCard) return;
	previewedCard = null;
	cardOverview.hidden = true;
	cardOverviewFrame.innerHTML = '';
}
const previewTarget = target => target instanceof Element ? target.closest('.hand-card, .tech-preview__card, .era-card, .floating-card') : null;
document.addEventListener('pointerover', event => {
	const card = previewTarget(event.target);
	if (card && card !== previewTarget(event.relatedTarget)) previewCard(card);
});
document.addEventListener('pointerout', event => {
	const card = previewTarget(event.target);
	if (card && card !== previewTarget(event.relatedTarget)) clearCardPreview(card);
});
document.addEventListener('focusin', event => previewCard(previewTarget(event.target)));
document.addEventListener('focusout', event => clearCardPreview(previewTarget(event.target)));
document.addEventListener('keydown', event => { if (event.key === 'Escape') clearCardPreview(); });
window.addEventListener('resize', () => { if (previewedCard) previewCard(previewedCard); });
const overlay = document.querySelector('#decision-overlay');
const panel = overlay.querySelector('.decision-panel');
const toggle = document.querySelector('#decision-preview-toggle');
const kinds = overlay.querySelector('.decision-kinds');
const shelf = overlay.querySelector('#decision-card-shelf');
const title = overlay.querySelector('#decision-title');
const content = overlay.querySelector('#decision-content');
const status = overlay.querySelector('#decision-status');
const confirm = overlay.querySelector('#decision-confirm');
const cancel = overlay.querySelector('#decision-cancel');
const city = document.querySelector('#city');
const capitalTab = document.querySelector('.tab[data-tab="capital"]');
const incomeTab = document.querySelector('.tab[data-tab="income"]');
const erasTab = document.querySelector('.tab[data-tab="eras"]');
const civTab = document.querySelector('.tab[data-tab="civ"]');
const techTab = document.querySelector('.tab[data-tab="tech"]');
const techCards = [...document.querySelectorAll('[data-tech-card]')];
const techRows = Object.fromEntries([...document.querySelectorAll('[data-tech-row]')].map(row => [row.dataset.techRow, row]));
function syncEmptyTechRows() {
	Object.values(techRows).forEach(row => {
		const empty = row.querySelector('.tech-preview__empty');
		if (empty) empty.style.display = row.querySelector('.tech-preview__card') ? 'none' : 'grid';
	});
}
syncEmptyTechRows();
const incomeMatRows = document.querySelector('#income-mat-rows');
const eraSlots = [...document.querySelectorAll('.era-slot')];
const eraCardHost = document.querySelector('#era-card-host');
const eraCardState = document.querySelector('#era-card-state');
const turnbar = document.querySelector('.turnbar');
const turnLabel = document.querySelector('.turn-label');
const footerTitle = document.querySelector('#selection-title');
const footerDetail = document.querySelector('#selection-detail');
const TAPESTRY_CHOICES = [['age-of-sail', 'Age of Sail'], ['alliance', 'Alliance'], ['cartography', 'Cartography']];
const CIV_CHOICES = [['alchemists', 'Alchemists'], ['architects', 'Architects']];
let current = 'pay';
let chosen = null;
let chainStep = 'offer';
let chainResult = null;
let previewFarm = null;
let incomeStep = 'ability';
let incomeRolls = 1;
let incomeCard = null;
let incomeUpgrade = null;
let incomeBonus = { coin: 0, food: 0, worker: 0, culture: 0 };
let previousFooter = null;
let setupCivDone = false;
let activeEra = 3;
const ERA_DETAILS = {
	'age-of-discovery': { title: 'Age of Discovery', copy: 'When played: Roll the science die. All players advance on that track; only you gain its benefit. You may pay its bonus.' },
	capitalism: { title: 'Capitalism', copy: 'This era: When you gain income, gain 2 VP per coin earned. Whenever you gain a market, also gain 1 coin.' },
	'age-of-sail': { title: 'Age of Sail', copy: 'This era: Whenever you explore, draw a total of 3 territory tiles. Before placing, you may give 1 to an opponent to gain 3 VP.' },
	alliance: { title: 'Alliance', copy: 'This era: Choose an opponent. Neither of you may conquer the other’s territories. Whenever they upgrade a tech card, you gain the same benefit after them.' },
	cartography: { title: 'Cartography', copy: 'When played: Gain 1 territory tile and explore with it. If that exploration scores at least 3 VP, you may also conquer that territory.' },
};
inspectEra(3);
const plotName = index => `${'ABCDEFGHI'[index % 9]}${Math.floor(index / 9) + 1}`;

function inspectEra(era) {
	const slot = eraSlots.find(item => Number(item.dataset.era) === era);
	if (!slot || slot.tagName !== 'BUTTON' || slot.disabled) return;
	const id = slot.dataset.card;
	const detail = ERA_DETAILS[id];
	if (!detail) return;
	eraSlots.filter(item => item.tagName === 'BUTTON').forEach(item => item.setAttribute('aria-pressed', String(item === slot)));
	eraCardHost.innerHTML = scaleCard(tapestryCardMarkup(id), 319, 560, 1);
	eraCardHost.closest('.era-card').dataset.tapestryCard = id;
	eraCardState.textContent = `Era ${['', 'I', 'II', 'III', 'IV'][era]} · ${era === activeEra ? 'Active' : 'Earlier'}`;
}
function setActiveEra(era, cardId = null) {
	activeEra = era;
	if (cardId) {
		const slot = eraSlots.find(item => Number(item.dataset.era) === era);
		slot.dataset.card = cardId;
		slot.querySelector('span').textContent = ERA_DETAILS[cardId].title;
		slot.disabled = false;
	}
	eraSlots.forEach(item => {
		item.dataset.active = String(Number(item.dataset.era) === era);
		item.classList.toggle('is-pending', Number(item.dataset.era) === era && item.disabled);
	});
	if (cardId) inspectEra(era);
}
document.querySelector('.era-slots').addEventListener('click', event => {
	const slot = event.target.closest('.era-slot');
	if (slot) inspectEra(Number(slot.dataset.era));
});

// The printed names and effects follow the engine's income-mat data. The
// number of removed buildings is a fixed layout example for this mockup.
const incomeMatFixture = [
	{ id: 'market', name: 'Markets', removed: 2, spaces: [
		['Barter', 'Coin and VP per tech card', `${image('resource-24', 'coin', '')}<small>VP / tech</small>`],
		['Currency', 'Coin', image('resource-24', 'coin', '')],
		['Banking', 'VP per tech card', '<small>VP / tech</small>'],
		['Credit Cards'], ['E-Commerce'], ['Biometrics'],
	] },
	{ id: 'house', name: 'Houses', removed: 2, spaces: [
		['Symbology', 'Worker and capital score', `${image('resource-24', 'worker', '')}<small>Capital VP</small>`],
		['Language', 'Worker', image('resource-24', 'worker', '')],
		['Writing', 'Capital score', '<small>Capital VP</small>'],
		['Telephone'], ['Email'], ['Neural Implants'],
	] },
	{ id: 'farm', name: 'Farms', removed: 2, spaces: [
		['Hunting', 'Food and a territory tile', `${image('resource-24', 'food', '')}<small>+ territory</small>`],
		['Farming', 'Food', image('resource-24', 'food', '')],
		['Breeding', '4 VP', '<small>4 VP</small>'],
		['Preservation'], ['Fertilization'], ['Food Printing'],
	] },
	{ id: 'armory', name: 'Armories', removed: 1, spaces: [
		['Ceremony', 'Culture and a tapestry card', `${image('resource-24', 'culture', '')}<small>+ tapestry</small>`],
		['Racing', 'Culture', image('resource-24', 'culture', '')],
		['Team Sports'], ['Tabletop Games'], ['Video Games'], ['Virtual Reality'],
	] },
];
incomeMatRows.innerHTML = incomeMatFixture.map(row => `<div class="income-mat-row" data-building="${row.id}" aria-label="${row.name}, ${row.removed} removed"><div class="income-mat-row__head"><strong>${row.name}</strong><span>${row.removed} removed · ${row.removed + 1} exposed</span></div><div class="income-mat-row__spaces">${row.spaces.map(([name, rewardLabel, reward], index) => index <= row.removed
	? `<div class="income-mat-space" aria-label="${name}: ${rewardLabel}"><span class="income-mat-space__name">${name}</span><span class="income-mat-space__reward">${reward}</span></div>`
	: `<div class="income-mat-space income-mat-space--covered" tabindex="0" aria-label="${name}, covered by ${row.id}">${image('building', row.id, '')}<span>Covered</span></div>`).join('')}</div></div>`).join('');

function setTrack(color) {
	panel.toggleAttribute('data-track', Boolean(color));
	if (color) panel.style.setProperty('--decision-track', color);
	else panel.style.removeProperty('--decision-track');
}
function clearPlotChoices() {
	city.querySelectorAll('.plot.farm-choice').forEach(plot => {
		plot.classList.remove('farm-choice');
		plot.removeAttribute('role');
		plot.removeAttribute('tabindex');
		plot.removeAttribute('aria-label');
	});
}

function clearCapitalFocus() {
	capitalTab.classList.remove('chain-focus');
	document.querySelectorAll('.tab.income-focus').forEach(tab => tab.classList.remove('income-focus'));
	document.body.classList.remove('farm-choice-open');
	clearPlotChoices();
}
function focusPrivateTab(tab) {
	if (!tab.classList.contains('active')) tab.click();
	document.querySelectorAll('.tab.income-focus').forEach(item => item.classList.remove('income-focus'));
	tab.classList.add('income-focus');
	tab.focus({ preventScroll: true });
}
function floatingCard([id, label], type) {
	if (type !== 'civ') return `<button type="button" class="floating-card" data-card-choice="${id}" aria-pressed="false" aria-label="Select ${label}">${scaleCard(tapestryCardMarkup(id), 319, 560, .7)}</button>`;
	const rule = type === 'civ'
		? id === 'alchemists' ? 'Roll the science die at the start of income turns 2–5.' : 'Gain rewards for completed capital districts.'
		: 'Tapestry card · This era';
	return `<button type="button" class="floating-card ${type === 'civ' ? 'floating-card--civ' : ''}" data-card-choice="${id}" aria-pressed="false" aria-label="Select ${label}"><span class="floating-card__title">${label}</span><img class="floating-card__art" src="${art(type === 'civ' ? 'civ' : 'tapestry', id)}" alt=""><span class="floating-card__rule">${rule}</span></button>`;
}
function showShelf(type) {
	shelf.hidden = false;
	shelf.innerHTML = (type === 'civ' ? CIV_CHOICES : TAPESTRY_CHOICES).map(choice => floatingCard(choice, type)).join('');
}
function hideShelf() {
	clearCardPreview();
	shelf.hidden = true;
	shelf.innerHTML = '';
}
function setTechAvailable(available) {
	techCards.forEach(card => {
		card.dataset.upgradeAvailable = String(available);
		if (!available) card.setAttribute('aria-pressed', 'false');
	});
}
function resetTechPreview() {
	const paper = techCards.find(card => card.dataset.techCard === 'paper');
	const bakery = techCards.find(card => card.dataset.techCard === 'bakery');
	const calendar = techCards.find(card => card.dataset.techCard === 'calendar');
	techRows.bottom.append(paper);
	techRows.bottom.append(calendar);
	techRows.middle.append(bakery);
	syncEmptyTechRows();
}
function moveTechPreview(id) {
	const card = techCards.find(item => item.dataset.techCard === id);
	if (!card) return;
	const from = card.parentElement.dataset.techRow;
	const next = from === 'bottom' ? 'middle' : from === 'middle' ? 'top' : null;
	if (next) {
		techRows[next].append(card);
		syncEmptyTechRows();
	}
}
function updateIncomeFooter() {
	const stepNames = { ability: 'Civilization ability', tapestry: 'Play a tapestry card', bonus: 'First of your neighbours', upgrade: 'Upgrade technology', collect: 'Score and collect', done: 'Income complete' };
	turnLabel.textContent = 'Your income turn';
	footerTitle.textContent = `Income turn 4 · ${stepNames[incomeStep]}`;
	footerDetail.textContent = incomeStep === 'done' ? 'Review the result, then continue.' : 'Resolve the highlighted step above.';
}
function restoreFooter() {
	if (!previousFooter) return;
	turnbar.classList.remove('income-turn');
	turnLabel.textContent = previousFooter.label;
	footerTitle.innerHTML = previousFooter.title;
	footerDetail.textContent = previousFooter.detail;
	previousFooter = null;
}
function clearPreviewFarm() {
	if (!previewFarm) return;
	previewFarm.classList.remove('farm', 'chain-built');
	previewFarm.innerHTML = '';
	previewFarm = null;
}
function legalPlots() {
	const lighthouse = document.querySelector('#lighthouse-piece');
	const lighthouseRect = city.contains(lighthouse) ? lighthouse.getBoundingClientRect() : null;
	return [...city.querySelectorAll('.plot')].filter(plot => {
		if ([...plot.classList].some(name => ['blocked', 'farm', 'house', 'market', 'armory', 'landmark'].includes(name))) return false;
		if (!lighthouseRect) return true;
		const rect = plot.getBoundingClientRect();
		return rect.right <= lighthouseRect.left || rect.left >= lighthouseRect.right || rect.bottom <= lighthouseRect.top || rect.top >= lighthouseRect.bottom;
	});
}
function steps(active) {
	return `<div class="chain-steps" aria-label="Ships to Farm decision sequence">${[['offer','1 · Benefit'],['place','2 · Plot'],['done','3 · Complete']].map(([id, label]) => `<span class="chain-step ${id === active ? 'is-current' : ''}">${label}</span>`).join('')}</div>`;
}
function setKinds() {
	kinds.innerHTML = Object.entries(samples).map(([id, item]) => `<button type="button" data-kind="${id}" aria-current="${id === current}">${item.label}</button>`).join('');
}
function selectPlot(index) {
	if (chainStep !== 'place') return;
	const plot = city.querySelector(`.plot[data-index="${index}"]`);
	if (!legalPlots().includes(plot)) {
		status.textContent = 'Choose an empty, passable square in the Capital tab.';
		return;
	}
	previewFarm = plot;
	previewFarm.classList.add('farm', 'chain-built');
	previewFarm.innerHTML = image('building', 'farm', 'Farm');
	chainResult = String(index);
	chainStep = 'done';
	clearCapitalFocus();
	renderChain();
	document.querySelector('#skip-optional').click();
}
function renderChain() {
	chosen = null;
	clearPlotChoices();
	kinds.hidden = true;
	confirm.hidden = false;
	cancel.hidden = false;
	cancel.textContent = 'Cancel';
	document.body.classList.toggle('farm-choice-open', chainStep === 'place');
	if (chainStep === 'offer') {
		title.textContent = 'Build a Farm?';
		content.innerHTML = `${steps('offer')}<p>Pay one food to build a Farm in your capital. Cancel returns to the optional action in the footer.</p><div class="chain-benefit">${image('building', 'farm', 'Farm')}<div><strong>Farm</strong><span class="decision-cost">Cost ${image('resource-24', 'food', 'Food')}</span></div></div>`;
		status.textContent = 'Pay to continue, or cancel.';
		confirm.textContent = 'Pay & build';
		confirm.disabled = false;
	} else if (chainStep === 'place') {
		if (!capitalTab.classList.contains('active')) capitalTab.click();
		capitalTab.classList.add('chain-focus');
		capitalTab.focus({ preventScroll: true });
		title.textContent = 'Place the Farm';
		content.innerHTML = `${steps('place')}<p>Select an empty, passable square directly in your Capital tab. The Farm will be placed as soon as you choose it.</p>`;
		const available = legalPlots();
		available.forEach(plot => {
			plot.classList.add('farm-choice');
			plot.setAttribute('role', 'button');
			plot.setAttribute('tabindex', '0');
			plot.setAttribute('aria-label', `Place Farm at ${plotName(Number(plot.dataset.index))}`);
		});
		status.textContent = available.length ? 'Choose a square in the Capital tab.' : 'No open squares are available.';
		confirm.hidden = true;
	} else {
		title.textContent = 'Farm built';
		content.innerHTML = `${steps('done')}<div class="chain-result">${image('building', 'farm', 'Farm')}<p>The Farm is on square ${plotName(Number(chainResult))} of your Mountain capital.</p></div>`;
		status.textContent = 'Placement complete. Return to your turn.';
		cancel.hidden = true;
		confirm.textContent = 'Continue';
		confirm.disabled = false;
	}
}
function startChain(trackColor = '#3f83a8') {
	clearPreviewFarm();
	setTrack(trackColor);
	current = 'chain';
	chainStep = 'offer';
	chainResult = null;
	overlay.hidden = false;
	toggle.setAttribute('aria-expanded', 'true');
	renderChain();
}

const incomeResource = (id, count = 1) => `<span class="income-icons" aria-label="${count} ${id}">${image('resource-24', id, '')}<b>${count}</b></span>`;
function incomeProgress(active) {
	const labels = [['ability', 'Ability'], ['tapestry', 'Tapestry'], ['bonus', 'Bonus'], ['upgrade', 'Upgrade'], ['collect', 'Income'], ['done', 'Complete']];
	return `<div class="income-progress" aria-label="Income turn sequence">${labels.map(([id, label]) => `<span class="${id === active ? 'active' : ''}">${label}</span>`).join('')}</div>`;
}
function incomeSummary() {
	return `<div class="income-result-grid"><div><strong>Score</strong><span>+8 VP from exposed icons · 37 → 45 VP</span></div><div><strong>Income mat</strong><span>${incomeResource('coin', 2)} ${incomeResource('worker', 2)} ${incomeResource('food', 2)} ${incomeResource('culture', 2)}</span></div><div><strong>Draws</strong><span>+1 territory tile · +1 tapestry card</span></div><div><strong>First of neighbours</strong><span>${Object.entries(incomeBonus).filter(([, amount]) => amount).map(([id, amount]) => incomeResource(id, amount)).join(' ')}</span></div></div>`;
}
function renderIncome() {
	chosen = null;
	kinds.hidden = true;
	setTrack(null);
	panel.toggleAttribute('data-income', true);
	hideShelf();
	setTechAvailable(false);
	confirm.hidden = true;
	confirm.disabled = false;
	cancel.hidden = false;
	cancel.textContent = 'Cancel';
	if (incomeStep === 'ability') {
		focusPrivateTab(civTab);
		title.textContent = 'Alchemists · income turn 4';
		const tracks = incomeRolls === 1 ? 'Exploration' : 'Exploration and Science';
		content.innerHTML = `${incomeProgress('ability')}<p>The start-of-income ability has rolled ${tracks}. Stop to advance once on each distinct track without its benefit, or roll again and risk a repeat.</p><div class="decision-options">${incomeRolls === 1 ? option('roll', 'Roll again', image('track', 'science', '')) : ''}${option('stop', 'Stop and advance')}</div>`;
		status.textContent = incomeRolls === 1 ? 'Science die: Exploration.' : 'Science die: Science. Two distinct tracks marked.';
	} else if (incomeStep === 'tapestry') {
		focusPrivateTab(erasTab);
		eraSlots.find(item => item.dataset.era === '4').classList.add('is-pending');
		showShelf('tapestry');
		title.textContent = 'Play a tapestry card';
		content.innerHTML = `${incomeProgress('tapestry')}<p>Select one tapestry card above this prompt for the era IV slot shown in Eras. Then play it here.</p>`;
		status.textContent = 'Choose a card above.';
		confirm.hidden = false;
		confirm.disabled = true;
		confirm.textContent = 'Play card';
	} else if (incomeStep === 'bonus') {
		focusPrivateTab(erasTab);
		title.textContent = 'First of your neighbours';
		const total = Object.values(incomeBonus).reduce((sum, amount) => sum + amount, 0);
		content.innerHTML = `${incomeProgress('bonus')}<p>Neither neighbour has begun era IV. Choose any three resources before the era-slot bonus is covered.</p><div class="decision-options">${resources.map(([id, label]) => `<button type="button" class="decision-option" data-income-resource="${id}" aria-label="Add ${label}">${image('resource-48', id, '')}<span>${label} <b class="income-choice-count">${incomeBonus[id] || ''}</b></span></button>`).join('')}</div><button type="button" class="income-reset" data-income-reset>Reset choices</button>`;
		status.textContent = `${total} of 3 resources chosen.`;
		confirm.hidden = false;
		confirm.disabled = total !== 3;
		confirm.textContent = 'Take bonus';
	} else if (incomeStep === 'upgrade') {
		focusPrivateTab(techTab);
		setTechAvailable(true);
		title.textContent = 'Upgrade a technology';
		content.innerHTML = `${incomeProgress('upgrade')}<p>Select a card in the highlighted Tech tab to upgrade it. Continue without selecting a card to skip the optional upgrade.</p>`;
		status.textContent = 'No technology selected; upgrade is optional.';
		confirm.hidden = false;
		confirm.textContent = 'Score & continue';
	} else if (incomeStep === 'collect') {
		focusPrivateTab(incomeTab);
		title.textContent = 'Score and collect income';
		content.innerHTML = `${incomeProgress('collect')}<p>The exposed spaces on the Income tab score first, then pay their income. This example has two markets, houses and farms, and one armory removed from the mat.</p>${incomeSummary()}`;
		status.textContent = 'Review the example rewards.';
		confirm.hidden = false;
		confirm.textContent = 'Collect income';
	} else {
		focusPrivateTab(incomeTab);
		title.textContent = 'Income turn complete';
		content.innerHTML = `${incomeProgress('done')}<p>Your next era would begin with ${incomeCard ? 'your tapestry card in the era IV slot' : 'the new era slot'} and ${incomeUpgrade === 'skip' ? 'no technology upgrade' : 'the chosen technology upgrade'}.</p>${incomeSummary()}<p class="income-result-note">This is a design preview; the game engine will calculate and save the actual turn.</p>`;
		status.textContent = 'Income turn 4 preview complete.';
		cancel.hidden = true;
		confirm.hidden = false;
		confirm.textContent = 'Continue';
	}
	updateIncomeFooter();
}
function startIncome() {
	clearCapitalFocus();
	previousFooter = { label: turnLabel.textContent, title: footerTitle.innerHTML, detail: footerDetail.textContent };
	turnbar.classList.add('income-turn');
	current = 'income';
	incomeStep = 'ability';
	incomeRolls = 1;
	incomeCard = null;
	incomeUpgrade = null;
	incomeBonus = { coin: 0, food: 0, worker: 0, culture: 0 };
	resetTechPreview();
	const nextEra = eraSlots.find(item => item.dataset.era === '4');
	nextEra.querySelector('span').textContent = 'Choose a tapestry card';
	nextEra.disabled = true;
	delete nextEra.dataset.card;
	setActiveEra(3);
	inspectEra(3);
	overlay.hidden = false;
	toggle.setAttribute('aria-expanded', 'true');
	renderIncome();
}

function show(kind) {
	clearCapitalFocus();
	current = kind;
	panel.removeAttribute('data-income');
	setTrack(samples[kind].track);
	chosen = null;
	setupCivDone = false;
	hideShelf();
	setTechAvailable(false);
	kinds.hidden = false;
	title.textContent = samples[kind].title;
	content.innerHTML = samples[kind].body;
	status.textContent = 'Choose an option to continue.';
	confirm.hidden = false;
	cancel.hidden = false;
	confirm.textContent = kind === 'setup-civ' ? 'Keep civilization' : kind === 'cards' ? 'Keep card' : 'Confirm choice';
	confirm.disabled = true;
	cancel.textContent = 'Cancel';
	setKinds();
	if (kind === 'cards' || kind === 'setup-civ') showShelf(kind === 'setup-civ' ? 'civ' : 'tapestry');
}
function close() {
	if (current === 'income') restoreFooter();
	clearCapitalFocus();
	hideShelf();
	setTechAvailable(false);
	overlay.hidden = true;
	toggle.setAttribute('aria-expanded', 'false');
	if (current === 'chain' || current === 'income') show('pay');
	toggle.focus();
}
kinds.addEventListener('click', event => {
	const button = event.target.closest('[data-kind]');
	if (button) show(button.dataset.kind);
});
shelf.addEventListener('click', event => {
	const card = event.target.closest('[data-card-choice]');
	if (!card) return;
	chosen = card.dataset.cardChoice;
	shelf.querySelectorAll('[data-card-choice]').forEach(item => item.setAttribute('aria-pressed', String(item === card)));
	confirm.disabled = false;
	status.textContent = `${TAPESTRY_CARDS[chosen]?.title ?? card.querySelector('.floating-card__title')?.textContent ?? chosen} selected. Confirm below.`;
});
techCards.forEach(card => card.addEventListener('click', () => {
	if (card.dataset.upgradeAvailable !== 'true') return;
	chosen = card.dataset.techCard;
	techCards.forEach(item => item.setAttribute('aria-pressed', String(item === card)));
	confirm.textContent = 'Upgrade & score';
	status.textContent = `${card.querySelector('span').textContent} selected for upgrade.`;
}));
content.addEventListener('click', event => {
	if (current === 'income') {
		const reset = event.target.closest('[data-income-reset]');
		if (reset) {
			incomeBonus = { coin: 0, food: 0, worker: 0, culture: 0 };
			renderIncome();
			return;
		}
		const resource = event.target.closest('[data-income-resource]');
		if (resource && incomeStep === 'bonus') {
			if (Object.values(incomeBonus).reduce((sum, amount) => sum + amount, 0) < 3) {
				incomeBonus[resource.dataset.incomeResource]++;
				renderIncome();
			}
			return;
		}
		const choice = event.target.closest('[data-choice]');
		if (!choice) return;
		if (incomeStep === 'ability') {
			if (choice.dataset.choice === 'roll') incomeRolls = 2;
			else incomeStep = 'tapestry';
			renderIncome();
			return;
		}
		return;
	}
	const button = event.target.closest('[data-choice]');
	if (!button) return;
	chosen = button.dataset.choice;
	content.querySelectorAll('[data-choice]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
	confirm.disabled = false;
	status.textContent = `${button.textContent.trim()} selected.`;
});
city.addEventListener('click', event => {
	if (current !== 'chain' || chainStep !== 'place' || overlay.hidden) return;
	const plot = event.target.closest('.plot');
	if (!plot) return;
	event.stopImmediatePropagation();
	selectPlot(Number(plot.dataset.index));
}, true);
city.addEventListener('keydown', event => {
	if (current !== 'chain' || chainStep !== 'place' || !['Enter', ' '].includes(event.key)) return;
	const plot = event.target.closest('.plot.farm-choice');
	if (!plot) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	selectPlot(Number(plot.dataset.index));
}, true);
toggle.addEventListener('click', () => {
	if (!overlay.hidden) { close(); return; }
	overlay.hidden = false;
	toggle.setAttribute('aria-expanded', 'true');
	show(current);
	title.focus?.();
});
overlay.querySelector('#decision-close').addEventListener('click', close);
cancel.addEventListener('click', close);
confirm.addEventListener('click', () => {
	if (current === 'chain') {
		if (chainStep === 'done') { close(); return; }
		if (chainStep !== 'offer') return;
		chainStep = 'place';
		renderChain();
		return;
	}
	if (current === 'income') {
		if (incomeStep === 'tapestry' && chosen) {
			incomeCard = chosen;
			setActiveEra(4, chosen);
			incomeStep = 'bonus';
		} else if (incomeStep === 'bonus' && Object.values(incomeBonus).reduce((sum, amount) => sum + amount, 0) === 3) {
			incomeStep = 'upgrade';
		} else if (incomeStep === 'upgrade') {
			incomeUpgrade = chosen ?? 'skip';
			if (chosen) moveTechPreview(chosen);
			incomeStep = 'collect';
		} else if (incomeStep === 'collect') {
			incomeStep = 'done';
		} else if (incomeStep === 'done') {
			close();
			return;
		}
		renderIncome();
		return;
	}
	if (current === 'setup-civ') {
		if (setupCivDone) { close(); return; }
		if (!chosen) return;
		const label = CIV_CHOICES.find(([id]) => id === chosen)?.[1] ?? chosen;
		title.textContent = 'Civilization chosen';
		content.innerHTML = `<p>${label} is your setup choice in this preview. The other dealt civilization returns to the supply.</p>`;
		status.textContent = `${label} kept.`;
		hideShelf();
		confirm.textContent = 'Continue';
		setupCivDone = true;
		return;
	}
	if (!chosen) return;
	status.textContent = `${TAPESTRY_CARDS[chosen]?.title ?? content.querySelector('[aria-pressed="true"]')?.textContent.trim() ?? chosen} confirmed for this preview.`;
});
window.addEventListener('open-farm-chain', event => startChain(event.detail?.trackColor));
document.querySelector('.income-action').addEventListener('click', startIncome);
document.addEventListener('keydown', event => {
	if (event.key === 'Escape' && !overlay.hidden) close();
});
show(current);
