// Mockups of every tab of the approved main game screen (layout B without the next-moves list).
// Usage: node gen-tabs.mjs <out.html> [--standalone]
import { writeFileSync } from 'node:fs';
import { P, TRACKS, RES, header, resources, capital, incomeMat, hand, hexMap, css } from './mock-kit.mjs';

const out = process.argv[2];
const LANDMARKS = { exp: ['Lighthouse', 'Train Station', 'Launch Pad'], sci: ['Apothecary', 'Academy', 'Laboratory'], tec: ['Forge', 'Rubber Works', 'Tech Hub'], mil: ['Barracks', 'Tank Factory', 'Fusion Reactor'] };
const TAKEN = { 'exp-4': 'you', 'sci-4': 'vera', 'tec-4': 'you', 'mil-4': 'ana' };
const COST = { exp: 'food', sci: 'worker', tec: 'coin', mil: 'culture' };
const MOUNTAIN = ['000000000', '110001110', '000111000', '000111110', '000001100', '011100001', '001000000', '000000010', '001000000'];
const BCOL = { M: '#e8c14a', H: '#a9a6b8', F: '#b7834a', A: '#c8473c' };

const frame = (tab, centre, decide) => `<div class="screen">${header()}<div class="bgrid">
  <div class="centre"><div class="tabs">${['Tracks', 'Map', 'Capital', 'Cards', 'Players'].map(t => `<span class="${t === tab ? 'on' : ''}">${t}</span>`).join('')}</div>
  <div class="panel view">${centre}</div><div style="margin-top:6px">${decide}</div></div>
  <div class="panel">${resources()}<h4>Capital city</h4>${capital(11)}<h4>Income mat</h4>${incomeMat(true)}<h4>Hand</h4>${hand(4)}</div>
</div></div>`;

// ---------- Tracks ----------
function tracksView() {
  const tiers = ['I · 1 any', 'II · track + 1 any', 'III · track + 2 any', 'IV · 2 track'];
  const rows = TRACKS.map(t => {
    const cells = [];
    for (let i = 0; i <= 12; i++) {
      const toks = Object.entries(t.at).filter(([, s]) => s === i).map(([p]) => `<i class="tok" style="background:${P[p]}"></i>`).join('');
      const lmIdx = [4, 7, 10].indexOf(i), owner = TAKEN[`${t.key}-${i}`];
      const lm = lmIdx >= 0 ? `<b class="lmk" style="${owner ? `background:${P[owner]};color:#120d1c` : ''}">${LANDMARKS[t.key][lmIdx]}</b>` : '';
      const next = t.at.you + 1 === i, tier = Math.ceil(i / 3), res = COST[t.key];
      const cost = next ? `<span class="cost2">${[0, 'any', res + ' + any', res + ' + 2 any', '2 ' + res][tier]}</span>` : '';
      cells.push(`<div class="cell ${i === 0 ? 'start' : ''} ${[4, 7, 10].includes(i) ? 'tier' : ''} ${next ? 'next' : ''}"><span class="n">${i || ''}</span><span class="nm">${i ? t.spaces[i - 1] : 'start'}</span>${lm}${cost}<span class="tk">${toks}</span></div>`);
    }
    return `<div class="trk" style="--c:${t.color}"><div class="tl">${t.name}<small>pays ${COST[t.key]}</small></div>${cells.join('')}</div>`;
  }).join('');
  const ach = [['Complete any track', [15, 10, 5], {}], ['Topple 2 outposts', [15, 10, 5], { 0: 'ana' }], ['Conquer the middle island', [10, 5], { 0: 'marko' }]]
    .map(([n, vps, who]) => `<div class="ach"><b>${n}</b><div>${vps.map((v, i) => `<span style="${who[i] ? `background:${P[who[i]]};color:#120d1c` : ''}">${v}</span>`).join('')}</div></div>`).join('');
  return `<div class="tiers"><span style="grid-column:span 2"></span>${tiers.map(t => `<em style="grid-column:span 3">${t}</em>`).join('')}</div>${rows}
  <div class="tfoot"><div class="achs"><h4>Achievements</h4>${ach}</div>
  <div class="detail" style="--c:#3f8fd0"><h4>Selected space</h4><b>Exploration 5 · Ships</b><p>Tier II. Costs 1 food + 1 any.</p><p><u>Gives</u> 1 VP per territory you control. You control 4, so +4 VP.</p><p><u>Bonus</u> Pay 1 any to also gain a farm.</p><button>Advance here</button></div></div>`;
}

// ---------- Map ----------
function mapView() {
  const legend = [['Forest', '#3f7a45'], ['Mountain', '#8d8794'], ['Desert', '#d8b56a'], ['Grassland', '#b9c96a'], ['Sea', '#2c5d9a'], ['Unexplored', '#2a2140']]
    .map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  return `<div class="mapwrap">${hexMap(11, 8, 22)}<div class="legend"><h4>Map</h4>${legend}<h4>Outposts</h4>${Object.entries({ You: P.you, Ana: P.ana, Marko: P.marko, Vera: P.vera }).map(([n, c]) => `<span><i style="background:${c};border-radius:50%"></i>${n}</span>`).join('')}<p class="hint">When you explore or conquer, the hexes you may choose light up and everything else dims.</p></div></div>`;
}

// ---------- Capital ----------
function capitalView() {
  const place = {};
  const put = (r, c, v) => { place[`${r},${c}`] = v; };
  [[0, 0, 'M'], [0, 1, 'M'], [2, 0, 'H'], [2, 1, 'F'], [2, 2, 'A'], [1, 4, 'H'], [1, 8, 'F'], [4, 2, 'M'], [3, 1, 'A']].forEach(([r, c, v]) => put(r, c, v));
  const lms = [{ name: 'Lighthouse', r: 0, c: 2, h: 2, w: 2, col: P.you }, { name: 'Forge', r: 7, c: 0, h: 2, w: 2, col: P.you }];
  const ghost = { name: 'Train Station', r: 6, c: 3, h: 3, w: 3 };
  const inRect = (o, r, c) => r >= o.r && r < o.r + o.h && c >= o.c && c < o.c + o.w;
  let cells = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const blocked = MOUNTAIN[r][c] === '1', lm = lms.find(o => inRect(o, r, c)), b = place[`${r},${c}`], g = inRect(ghost, r, c);
    const cls = ['pl', c % 3 === 2 && c < 8 ? 'dr' : '', r % 3 === 2 && r < 8 ? 'db' : ''].join(' ');
    const style = blocked ? 'background:#1a1326' : lm ? `background:${lm.col}` : b ? `background:${BCOL[b]}` : g ? 'background:#5aad5a55' : '';
    cells += `<i class="${cls}" style="${style}">${blocked ? '<s></s>' : b || ''}</i>`;
  }
  const labels = [...lms, ghost].map(o => `<span class="lml ${o === ghost ? 'ghost' : ''}" style="top:calc(${o.r} * var(--q) + 4px);left:calc(${o.c} * var(--q) + 4px);width:calc(${o.w} * var(--q) - 2px);height:calc(${o.h} * var(--q) - 2px)">${o.name}${o === ghost ? '<em>⟳ rotate</em>' : ''}</span>`).join('');
  const rowDone = [1].map(r => `<b class="rowdone" style="top:calc(${r} * var(--q) + 4px)">✓</b>`).join('');
  const mat = [['Markets', 'M', ['Barter', 'Currency', 'Banking', 'Credit Cards', 'E-Commerce', 'Biometrics'], 3],
    ['Houses', 'H', ['Symbology', 'Language', 'Writing', 'Telephone', 'Email', 'Neural Implants'], 2],
    ['Farms', 'F', ['Hunting', 'Farming', 'Breeding', 'Preservation', 'Fertilization', 'Food Printing'], 2],
    ['Armories', 'A', ['Ceremony', 'Racing', 'Team Sports', 'Tabletop Games', 'Video Games', 'Virtual Reality'], 2]]
    .map(([n, k, spaces, open]) => `<div class="mrow"><b style="color:${BCOL[k]}">${n}</b>${spaces.map((s, i) => `<span class="${i < open ? 'open' : ''}" style="--b:${BCOL[k]}">${i < open ? s : `<i style="background:${BCOL[k]}">${k}</i>`}</span>`).join('')}</div>`).join('');
  return `<div class="capwrap">
    <div><h4>Capital city · Mountain</h4><div class="bigcap" style="--q:29px">${cells}${labels}${rowDone}</div>
    <p class="hint">Dotted plots are impassable. Thick lines mark the nine districts, and filling a district gives 1 resource. ✓ marks a complete row.</p></div>
    <div class="capside"><div class="civ"><div class="portrait">civ art</div><div><b>Alchemists</b><p>At the start of income turns 2–5, roll the science die as often as you dare. Rolling a track twice busts you (gain 1 any). If you stop in time, advance once on each rolled track.</p></div></div>
    <h4>Income mat · uncovered spaces pay you</h4><div class="mat">${mat}</div>
    <div class="slots2">${['Maker of Fire', 'Trade Economy', 'Era 3', 'Era 4'].map((t, i) => `<span class="${i < 2 ? 'full' : ''}">${t}</span>`).join('')}</div></div>
  </div>`;
}

// ---------- Cards ----------
function cardsView() {
  const tap = [['Academia', 'This era', 'Whenever you invent a tech card or gain a tapestry card, gain 3 VP.', '#5aad5a'],
    ['Trade Economy', 'When played', "Pick an opponent's space on any track and gain its benefit. If it has a bonus, they get it free.", '#e09a2b'],
    ['Dark Ages', 'When played', 'Go back once on 3 tracks, then advance 3 times on the fourth. No benefits or bonuses.', '#e09a2b'],
    ['Trap', 'Trap', 'When someone conquers your territory, play this: their outpost is toppled instead of yours.', '#c8473c']];
  const tcard = ([n, t, txt, c], sel) => `<div class="tcard ${sel ? 'sel' : ''}"><div class="art">art</div><b>${n}</b><em style="background:${c}">${t}</em><p>${txt}</p></div>`;
  const techCard = (n, circle, square, pre, state) => `<div class="tech2 ${state}"><b>${n}</b><span>● ${circle}</span><span>■ ${square}</span><small>Top row needs: ${pre}</small></div>`;
  return `<h4>Tapestry hand · 4 cards</h4><div class="thand">${tap.map((c, i) => tcard(c, i === 0)).join('')}</div>
  <div class="techwrap"><div><h4>Your tech cards</h4>
    <div class="trow2"><span>Top</span>${techCard('Canned Food', '1 food', '7 VP', 'Military II', 'done')}</div>
    <div class="trow2"><span>Middle</span>${techCard('Irrigation', '1 food', '1 farm', 'Science II ✓', 'ready')}</div>
    <div class="trow2"><span>Bottom</span>${techCard('Compass', '2 territory tiles', 'Explore', 'Technology II ✓', '')}${techCard('Eyeglasses', 'Invent 1 tech', '1 VP per tech card', 'Technology II ✓', '')}</div></div>
    <div><h4>Invent from</h4><div class="trow2">${techCard('Clocks', 'Advance technology', '1 VP per tech space', 'Technology II', '')}${techCard('Concrete', '1 market', '1 VP per market', 'Exploration II', '')}${techCard('Dynamite', 'Conquer', '1 VP per territory', 'Military II', '')}<div class="deck">deck<br>21</div></div></div></div>`;
}

// ---------- Players ----------
function playersView() {
  const ppl = [['Ana', 'Militants', 41, P.ana, [3, 4, 2, 2], { exp: 2, sci: 1, tec: 0, mil: 6 }, 'Barracks', 5, 3],
    ['Marko', 'Nomads', 33, P.marko, [1, 2, 5, 0], { exp: 5, sci: 3, tec: 2, mil: 0 }, '—', 2, 4],
    ['Vera', 'Futurists', 29, P.vera, [4, 4, 1, 3], { exp: 1, sci: 6, tec: 3, mil: 2 }, 'Apothecary', 3, 2]];
  return `<div class="pgrid">${ppl.map(([n, civ, vp, col, res, at, lm, tech, handN]) => `<div class="pcard" style="--p:${col}">
    <div class="phead"><div class="portrait sm">civ</div><div><b>${n}</b><small>${civ}</small></div><span class="pvp">${vp} VP</span></div>
    <div class="res">${RES.map(([, c], i) => `<span><i style="background:${c}"></i>${res[i]}</span>`).join('')}</div>
    <div class="bars">${TRACKS.map(t => `<div><em style="color:${t.color}">${t.name.slice(0, 4)}</em><span><i style="width:${at[t.key] / 12 * 100}%;background:${t.color}"></i></span><b>${at[t.key]}</b></div>`).join('')}</div>
    <div class="pmini">${capital(7)}<div class="pfacts"><span>Landmarks: ${lm}</span><span>Tech cards: ${tech}</span><span>Hand: ${handN} cards</span><span>Played: Maker of Fire, Marathon</span></div></div>
    <button>Open full view</button></div>`).join('')}</div>`;
}

const extra = `<style>
.bgrid{display:grid;grid-template-columns:1fr 230px;gap:8px;padding:8px;min-height:0}.centre{display:grid;grid-template-rows:auto 1fr auto;min-height:0;position:relative}
.view{border-radius:0 6px 6px 6px;overflow:hidden}.panel.dim{opacity:.45}
.tiers{display:grid;grid-template-columns:78px repeat(13,1fr);gap:2px;font-size:10px;color:#c9bfe0}.tiers em{font-style:normal;text-align:center;border-bottom:1px solid #6a5a92}
.trk{display:grid;grid-template-columns:78px repeat(13,1fr);gap:3px;margin-top:3px}.cost2{position:absolute;left:2px;right:2px;bottom:13px;font-size:8px;text-align:center;background:#120d1c;color:#9fe09a;border-radius:2px}.tl{color:var(--c);font-size:12px;display:flex;flex-direction:column;justify-content:center}.tl small{color:#a99cc4;font-size:8.5px}
.cell{position:relative;height:58px;background:color-mix(in srgb,var(--c) 22%,#1d1629);border:1px solid color-mix(in srgb,var(--c) 55%,#000);border-radius:3px;padding:2px}.cell.start{background:#1d1629}.cell.tier{border-left:3px solid var(--c)}
.cell.next{box-shadow:0 0 0 2px #f2d58c;z-index:1}.cell .n{position:absolute;top:1px;right:3px;font-size:7.5px;color:#ffffff55}.cell .nm{display:block;font-size:9px;line-height:1.05;color:#efe6d2;padding-right:7px}
.lmk{position:absolute;left:2px;right:2px;bottom:13px;font-weight:normal;font-size:8px;background:#f2d58c33;color:#f2d58c;border-radius:2px;text-align:center;line-height:1.3}.cell .tk{position:absolute;bottom:2px;left:2px;display:flex;gap:1px}
.tfoot{display:grid;grid-template-columns:1fr 330px;gap:10px;margin-top:4px}.achs{display:flex;flex-direction:column;gap:4px}.ach{display:flex;justify-content:space-between;align-items:center;background:#30233c;border-radius:4px;padding:4px 6px}.ach b{font-weight:normal;font-size:10px}.ach div{display:flex;gap:3px}.ach span{min-width:20px;text-align:center;background:#1d1629;border:1px solid #6a5a92;border-radius:3px;font-size:9.5px;padding:1px 2px}
.detail{background:color-mix(in srgb,var(--c) 18%,#1d1629);border:2px solid var(--c);border-radius:6px;padding:7px 9px}.detail b{color:#efe6d2;font-weight:normal;font-size:12px}.detail p{margin:3px 0;font-size:9.5px;line-height:1.35;color:#d8cfe8}.detail u{text-decoration:none;color:#f2d58c}.detail button,.pcard button{font-family:VCR,monospace;background:#5aad5a;color:#120d1c;border:0;border-radius:4px;padding:4px 8px;font-size:10px;margin-top:3px}
.capwrap{display:grid;grid-template-columns:auto 1fr;gap:12px;height:100%}.bigcap{position:relative;display:grid;grid-template-columns:repeat(9,calc(var(--q) - 1px));gap:1px;background:#120d1c;padding:4px;border-radius:4px;width:max-content}
.bigcap .pl{height:calc(var(--q) - 1px);background:#3b2f52;font-style:normal;font-size:10px;display:flex;align-items:center;justify-content:center;color:#120d1c}.bigcap .dr{box-shadow:2px 0 0 #f2d58c88}.bigcap .db{box-shadow:0 2px 0 #f2d58c88}.bigcap .dr.db{box-shadow:2px 0 0 #f2d58c88,0 2px 0 #f2d58c88}
.bigcap s{width:5px;height:5px;border-radius:50%;background:#e0702b}.lml{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8.5px;color:#120d1c;text-align:center;border:2px solid #120d1c;border-radius:3px;pointer-events:none}
.lml.ghost{border:2px dashed #9fe09a;color:#e6ffe2;background:#5aad5a33}.lml em{font-style:normal;font-size:8px;margin-top:3px;background:#120d1c;color:#9fe09a;padding:1px 4px;border-radius:3px}.rowdone{position:absolute;right:-14px;color:#9fe09a;font-size:12px}
.hint{font-size:9.5px;color:#a99cc4;max-width:270px;line-height:1.4}.capside{display:flex;flex-direction:column;gap:6px;min-width:0}
.civ{display:flex;gap:8px;background:#30233c;border-radius:6px;padding:6px}.civ b{font-family:Alagard,serif;font-weight:normal;color:#f2d58c;font-size:15px}.civ p{margin:2px 0 0;font-size:9.5px;line-height:1.35;color:#d8cfe8}
.portrait{flex:none;width:64px;height:64px;border:3px solid #e2c27a;border-radius:6px;background:linear-gradient(#3a2c55,#18121f);display:flex;align-items:center;justify-content:center;color:#6a5a92;font-size:9px}.portrait.sm{width:34px;height:34px;border-width:2px;font-size:7px}
.mat{display:flex;flex-direction:column;gap:3px}.mrow{display:grid;grid-template-columns:52px repeat(6,1fr);gap:2px;align-items:center}.mrow b{font-weight:normal;font-size:9.5px}.mrow span{height:22px;border-radius:3px;background:#1d1629;border:1px solid #3b2f52;font-size:7px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1}
.mrow span.open{border-color:var(--b);color:#efe6d2}.mrow span i{width:100%;height:100%;border-radius:2px;font-style:normal;font-size:9px;color:#120d1c;display:flex;align-items:center;justify-content:center}
.slots2{display:flex;gap:3px}.slots2 span{flex:1;font-size:8.5px;text-align:center;border:1px dashed #6a5a92;border-radius:3px;padding:4px 2px;color:#a99cc4}.slots2 span.full{border:1px solid #5aad5a;background:#5aad5a33;color:#efe6d2}
.thand{display:flex;gap:8px}.tcard{width:128px;background:linear-gradient(#30233c,#221a30);border:3px solid #e2c27a;border-radius:8px;padding:5px;display:flex;flex-direction:column;gap:3px}.tcard.sel{box-shadow:0 0 0 3px #9fe09a;transform:translateY(-4px)}
.tcard .art{height:40px;border-radius:4px;background:linear-gradient(#3a2c55,#18121f);display:flex;align-items:center;justify-content:center;color:#6a5a92;font-size:9px}.tcard b{font-family:Alagard,serif;font-weight:normal;font-size:13px;color:#f2d58c}.tcard em{font-style:normal;font-size:8px;color:#120d1c;border-radius:3px;padding:1px 4px;align-self:flex-start}.tcard p{margin:0;font-size:8.5px;line-height:1.3;color:#d8cfe8}
.techwrap{display:grid;grid-template-columns:auto 1fr;gap:14px;margin-top:8px}.trow2{display:flex;gap:5px;align-items:center;margin-top:4px}.trow2>span{width:40px;font-size:9px;color:#a99cc4}
.tech2{width:118px;background:#2a2038;border:2px solid #e09a2b;border-radius:5px;padding:3px 5px;display:flex;flex-direction:column;font-size:8px;color:#d8cfe8;line-height:1.3}.tech2 b{font-weight:normal;color:#efe6d2;font-size:10px}.tech2 small{color:#a99cc4;font-size:7.5px}.tech2.done{opacity:.6}.tech2.ready{box-shadow:0 0 0 2px #9fe09a}
.deck{width:42px;height:56px;border:2px solid #e09a2b;border-radius:5px;background:repeating-linear-gradient(45deg,#3a2c55 0 4px,#2a2038 4px 8px);font-size:8px;display:flex;align-items:center;justify-content:center;text-align:center}
.mapwrap{display:grid;grid-template-columns:1fr 150px;gap:10px;height:100%}.legend{display:flex;flex-direction:column;gap:4px;font-size:10px}.legend span{display:flex;gap:6px;align-items:center}.legend i{width:12px;height:12px;border-radius:2px;display:block}.legend h4{margin-top:6px}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;height:100%}.pcard{background:#251d2d;border:2px solid var(--p);border-radius:6px;padding:7px;display:flex;flex-direction:column;gap:6px}
.phead{display:flex;gap:6px;align-items:center}.phead b{font-weight:normal;color:var(--p);font-size:13px;display:block}.phead small{color:#a99cc4;font-size:9.5px}.pvp{margin-left:auto;color:#f2d58c;font-size:13px}
.bars div{display:grid;grid-template-columns:30px 1fr 16px;gap:4px;align-items:center;font-size:9px;margin:2px 0}.bars em{font-style:normal}.bars span{height:7px;background:#1d1629;border-radius:4px;overflow:hidden}.bars i{display:block;height:100%}
.pmini{display:flex;gap:8px;align-items:flex-start}.pfacts{display:flex;flex-direction:column;gap:3px;font-size:9px;color:#d8cfe8}
.sec{margin:34px 0 0}.sec h3{font-family:Alagard,serif;font-weight:normal;color:#f2d58c;font-size:23px;margin:0 0 4px}.sec p{color:#d8cfe8;font-size:13px;line-height:1.5;margin:4px 0}
.decide .two{margin-left:auto;display:flex;gap:6px}.decide .two button{margin:0}.decide button.alt{background:#6a5a92;color:#efe6d2}
.screen p{font-size:9.5px !important;line-height:1.35 !important;margin:2px 0 !important}.screen .tcard p{font-size:8.5px !important;line-height:1.3 !important}.screen .hint{font-size:9.5px !important}.screen h4{margin:0 0 3px}
</style>`;

const decideTurn = `<div class="decide"><b>Your turn · Era 2.</b> Advance on a track or take income.<button>Income turn</button></div>`;
const decidePlace = `<div class="decide"><b>Place your Train Station</b> (3×3). Drag it, press R to rotate.<span class="two"><button class="alt">Rotate</button><button>Place here</button></span></div>`;
const decideCard = `<div class="decide"><b>Income turn · step 2 of 4:</b> play a tapestry card.<button>Play Academia</button></div>`;
const decideWait = `<div class="decide" style="border-color:#e0675b"><b style="color:#e0675b">Ana's turn.</b> Ana is choosing where to conquer…</div>`;

const page = `${css}${extra}<div class="lay">
<h2>Layout B without the next-moves list</h2>
<p class="subtitle">The left list is gone, so every tab gets the full width. Tracks is the main view on your turn. Your next space on each track has a gold outline and shows its cost, in green when you can afford it. Click it to see the details and advance. Other tabs still open by themselves when a choice needs them.</p>
<div class="sec"><h3>Tracks: your turn</h3><p>The four tracks are wider now, with every space name readable, every player's token, the tier costs across the top, landmarks in their owner's colour, and the achievements below.</p>${frame('Tracks', tracksView(), decideTurn)}</div>
<div class="sec"><h3>Map</h3><p>The full-width map with a legend. When you explore or conquer, the hexes you may pick light up.</p>${frame('Map', mapView(), decideTurn)}</div>
<div class="sec"><h3>Capital: placing a landmark</h3><p>Opened by itself because you just gained the Train Station. Your city is large, with districts and impassable plots marked. The landmark follows your mouse as a green ghost, and you rotate it, then place it. Your civilization and your full income mat sit beside the city, showing which spaces are uncovered and what each one pays.</p>${frame('Capital', capitalView(), decidePlace)}</div>
<div class="sec"><h3>Cards: during an income turn</h3><p>Opened by itself at the "play a tapestry card" step. Your hand is shown large with full text. Below it are your tech cards in their three rows, where a green outline means ready to upgrade, and the three face-up cards you could invent.</p>${frame('Cards', cardsView(), decideCard)}</div>
<div class="sec"><h3>Players: while someone else plays</h3><p>Every opponent at a glance: VP, resources, track positions, city, landmarks and cards. "Open full view" shows any player's full city and mats.</p>${frame('Players', playersView(), decideWait)}</div>
</div>`;

// --standalone writes a page that opens without the brainstorm companion.
const standalone = process.argv[3] === '--standalone';
writeFileSync(out, standalone
  ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Rug Game · main screen reference</title><style>body{margin:0;padding:24px;background:#18121f}.lay{max-width:1200px;margin:auto}</style></head><body>${page.replaceAll('/files/', 'fonts/')}</body></html>`
  : page);
console.log('wrote', out);
