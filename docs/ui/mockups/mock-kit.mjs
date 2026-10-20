// Shared wireframe pieces for the brainstorm mockups.
const P = { you: '#4fa3e0', ana: '#e0675b', marko: '#6cc06a', vera: '#f2c14e' };
const TRACKS = [
  { key: 'exp', name: 'Exploration', color: '#3f8fd0', res: 'food', spaces: ['Scouting', 'Rafts', 'Wagons', 'Navigation', 'Ships', 'Tunnels', 'Trains', 'Cars', 'Airplanes', 'Space Shuttle', 'Interstellar', 'Warpgates'], at: { you: 4, ana: 2, marko: 5, vera: 1 } },
  { key: 'sci', name: 'Science', color: '#5aad5a', res: 'worker', spaces: ['Astronomy', 'Mathematics', 'Herbalism', 'Medicine', 'Chemistry', 'Biology', 'Academic Res.', 'Nutrition', 'Physics', 'Neuroscience', 'Quantum Physics', 'Alien Biology'], at: { you: 2, ana: 1, marko: 3, vera: 6 } },
  { key: 'tec', name: 'Technology', color: '#e09a2b', res: 'coin', spaces: ['Pottery', 'Carpentry', 'Stone Tools', 'Metallurgy', 'Glass', 'Steel', 'Rubber', 'Plastic', 'Electronics', 'Computers', 'Nanotech', 'AI Singularity'], at: { you: 5, ana: 0, marko: 2, vera: 3 } },
  { key: 'mil', name: 'Military', color: '#c8473c', res: 'culture', spaces: ['Archery', 'Bladed Weapons', 'Walls', 'Standing Army', 'Cavalry', 'Gunpowder', 'Tanks', 'Warplanes', 'Anti-Aircraft', 'Nuclear Bomb', 'Drone Assassins', 'Mechs'], at: { you: 1, ana: 6, marko: 0, vera: 2 } },
];
const RES = [['Coin', '#e8c14a', 3], ['Worker', '#a9a6b8', 2], ['Food', '#b7834a', 4], ['Culture', '#d0555d', 1]];

const tokens = at => Object.entries(at).map(([p, s]) => ({ p, s }));
function trackStrip(t, { vertical = false, names = false, cell = 30 } = {}) {
  const cells = [];
  for (let i = 0; i <= 12; i++) {
    const here = tokens(t.at).filter(k => k.s === i).map(k => `<i class="tok" style="background:${P[k.p]}"></i>`).join('');
    const lm = [4, 7, 10].includes(i) && !Object.values(t.at).some(s => s >= i) ? '<b class="lm" title="landmark"></b>' : '';
    const tier = i === 0 ? 'start' : i === 4 || i === 7 || i === 10 ? 'tierstart' : '';
    cells.push(`<div class="sp ${tier}" style="--c:${t.color}">${names && i ? `<span class="nm">${t.spaces[i - 1]}</span>` : `<span class="no">${i || '▸'}</span>`}${lm}<span class="toks">${here}</span></div>`);
  }
  return `<div class="track ${vertical ? 'v' : 'h'}" style="--c:${t.color};--cell:${cell}px"><div class="tname">${t.name}</div><div class="cells">${vertical ? cells.reverse().join('') : cells.join('')}</div></div>`;
}

function hexMap(cols = 9, rows = 7, r = 18) {
  const w = Math.sqrt(3) * r, terr = ['#9ab35a', '#3f7a45', '#8d8794', '#d8b56a', '#b9c96a'];
  let seed = 3; const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const hexes = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const cx = w * col + (row % 2 ? w / 2 : 0) + w / 2 + 2, cy = r * 1.5 * row + r + 2;
    const edge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
    const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 180 * (60 * k - 30); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
    const explored = !edge && rand() > 0.45;
    const fill = edge ? '#2c5d9a' : explored ? terr[Math.floor(rand() * terr.length)] : '#2a2140';
    hexes.push(`<polygon points="${pts}" fill="${fill}" stroke="${edge ? '#24508e' : '#1a1326'}" stroke-width="1.5"${explored || edge ? '' : ' stroke-dasharray="3 2"'}/>`);
    if (explored && rand() > 0.55) { const p = Object.values(P)[Math.floor(rand() * 4)]; hexes.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="${p}" stroke="#1a1326" stroke-width="1.5"/>`); }
  }
  const cw = w * cols + w / 2 + 4, ch = r * 1.5 * (rows - 1) + 2 * r + 4;
  return `<svg class="map" viewBox="0 0 ${cw.toFixed(0)} ${ch.toFixed(0)}" preserveAspectRatio="xMidYMid meet">${hexes.join('')}</svg>`;
}

function capital(cell = 14) {
  const blocked = new Set(['0,0', '0,1', '1,0', '8,8', '7,8', '8,7', '0,8', '8,0', '4,4', '0,4', '4,0', '8,4', '4,8', '1,8', '8,1', '2,0']);
  const built = { '3,3': '#e8c14a', '3,4': '#a9a6b8', '5,2': '#b7834a', '2,6': '#c8473c', '6,6': '#e8c14a' };
  let cells = '';
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    const k = `${x},${y}`, lh = x >= 5 && x <= 6 && y >= 3 && y <= 4;
    cells += `<i style="background:${blocked.has(k) ? '#1a1326' : lh ? '#3f8fd0' : built[k] || '#3b2f52'}"></i>`;
  }
  return `<div class="capital" style="--cell:${cell}px">${cells}</div>`;
}

function incomeMat(small = false) {
  const cols = [['Markets', '#e8c14a', 2], ['Houses', '#a9a6b8', 1], ['Farms', '#b7834a', 2], ['Armories', '#c8473c', 1]];
  const col = ([n, c, used]) => `<div class="icol"><span>${small ? n[0] : n}</span>${Array.from({ length: 6 }, (_, i) => `<i style="background:${i < used ? '#2a2140' : c}">${i < used ? '+' : ''}</i>`).join('')}</div>`;
  const slots = ['Maker of Fire', 'Trade Economy', '', '', ''].map((t, i) => `<i class="${t ? 'full' : ''}">${small ? (t ? 'E' + (i + 1) : '') : t || 'Era ' + (i + 1)}</i>`).join('');
  return `<div class="income ${small ? 'small' : ''}"><div class="icols">${cols.map(col).join('')}</div><div class="slots">${slots}</div></div>`;
}

const resources = () => `<div class="res">${RES.map(([n, c, v]) => `<span><i style="background:${c}"></i>${v}<em>${n}</em></span>`).join('')}<span class="vp">37<em>VP</em></span><span class="era">Era 2</span></div>`;
const hand = (n = 3) => `<div class="hand">${['Trade Economy', 'Marathon', 'Trap', 'Alliance'].slice(0, n).map(t => `<div class="card">${t}</div>`).join('')}</div>`;
const tech = () => `<div class="tech"><div class="trow"><span>Top</span><div class="card t">Printing Press</div></div><div class="trow"><span>Mid</span><div class="card t">Irrigation</div></div><div class="trow"><span>Bottom</span><div class="card t">Bakery</div><div class="card t">Gunpowder</div></div></div>`;
const header = () => `<div class="hdr"><b>The Rug Game</b><div class="chips">${[['You', 'Alchemists', 37, P.you, true], ['Ana', 'Militants', 41, P.ana], ['Marko', 'Nomads', 33, P.marko], ['Vera', 'Futurists', 29, P.vera]].map(([n, c, v, col, me]) => `<span class="chip ${me ? 'me' : ''}" style="--p:${col}"><i></i>${n}<em>${c} · ${v} VP</em></span>`).join('')}</div><div class="ctl">♪ ⏱ ↶ ☰</div></div>`;
const decision = (wide = true) => `<div class="decide"><b>Your turn · Era 2.</b> ${wide ? 'Choose a track to advance, or take your income turn.' : 'Advance or take income.'}<button>Income turn</button></div>`;

function nextMoves() {
  const info = { exp: ['Ships', '+1 VP per territory you control', 'food + any', true], sci: ['Herbalism', 'Roll the science die, or gain a house', 'any', true], tec: ['Steel', 'Gain 1 market, +1 VP per armory', 'coin + any', true], mil: ['Bladed Weapons', 'Gain 1 tapestry card', 'any', true] };
  return `<div class="moves"><h4>Your next moves</h4>${TRACKS.map(t => { const [nm, ben, cost, ok] = info[t.key]; return `<div class="move" style="--c:${t.color}"><div><b>${t.name} → ${nm}</b><small>${ben}</small></div><div class="cost ${ok ? 'ok' : ''}">${cost}</div></div>`; }).join('')}<div class="move inc"><div><b>Income turn (Era 3)</b><small>Civ ability · play a tapestry card · upgrade a tech · score · income</small></div></div></div>`;
}

const css = `<style>
@font-face{font-family:Alagard;src:url('/files/alagard.ttf')}@font-face{font-family:VCR;src:url('/files/vcr-osd-mono.ttf')}
.lay{color:#efe6d2;font-family:VCR,monospace}
.lay h2{font-family:Alagard,serif;font-weight:normal;color:#f2d58c;font-size:30px;margin:0 0 6px}.lay .subtitle{color:#c9bfe0}
.opt{margin:26px 0 8px;padding:16px;border:2px solid #4b3a63;border-radius:10px;background:#1d1629;cursor:pointer}
.opt.selected{border-color:#f2d58c;box-shadow:0 0 0 3px #f2d58c55}
.opt h3{font-family:Alagard,serif;font-weight:normal;color:#f2d58c;font-size:23px;margin:0 0 4px}.opt p{color:#d8cfe8;font-size:13px;line-height:1.5;margin:4px 0}
.why{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12.5px}.why div{background:#30233c;border-radius:6px;padding:8px 10px;line-height:1.5}.why b{color:#f2d58c}
.screen{height:600px;margin-top:12px;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 50% 30%,#2b2142,#120d1c);border:3px solid #0d0914;display:grid;grid-template-rows:42px 1fr;font-size:11px}
.hdr{display:flex;align-items:center;gap:12px;padding:0 12px;background:#251d2dd9;border-bottom:2px solid #3b2f52}.hdr b{font-family:Alagard,serif;font-weight:normal;font-size:17px;color:#f2d58c;white-space:nowrap}
.chips{display:flex;gap:8px;flex:1;justify-content:center}.chip{display:flex;align-items:center;gap:5px;background:#30233c;border:2px solid #3b2f52;border-radius:6px;padding:3px 8px;white-space:nowrap}.chip.me{border-color:var(--p)}.chip i{width:10px;height:10px;border-radius:50%;background:var(--p)}.chip em{font-style:normal;color:#a99cc4}
.ctl{letter-spacing:6px;color:#c9bfe0}
.track{display:flex;gap:4px;align-items:center}.track .tname{color:var(--c);font-size:10px;width:62px;text-align:right}.track .cells{display:flex;gap:2px}
.track.v{flex-direction:column}.track.v .tname{width:auto;text-align:center}.track.v .cells{flex-direction:column}
.sp{position:relative;width:var(--cell);height:var(--cell);background:color-mix(in srgb,var(--c) 26%,#1d1629);border:1px solid color-mix(in srgb,var(--c) 60%,#000);border-radius:3px;display:flex;align-items:center;justify-content:center}
.sp.start{background:#1d1629}.sp.tierstart{border-left:3px solid var(--c)}.track.v .sp.tierstart{border-left:1px solid color-mix(in srgb,var(--c) 60%,#000);border-bottom:3px solid var(--c)}
.sp .no{color:#ffffff66;font-size:9px}.sp .nm{font-size:8.5px;line-height:1;text-align:center;color:#efe6d2cc;padding:0 2px}
.sp .lm{position:absolute;top:2px;right:2px;width:6px;height:6px;background:#f2d58c;border-radius:1px}
.toks{position:absolute;bottom:1px;left:1px;display:flex;flex-wrap:wrap;gap:1px}.tok{width:7px;height:7px;border-radius:50%;border:1px solid #1a1326;display:block}
.map{width:100%;height:100%}
.capital{display:grid;grid-template-columns:repeat(9,var(--cell));gap:1px;background:#120d1c;padding:3px;border-radius:4px;width:max-content}.capital i{width:var(--cell);height:var(--cell);border-radius:1px}
.income{background:#30233c;border-radius:6px;padding:5px}.icols{display:flex;gap:4px}.icol{display:flex;flex-direction:column;gap:2px;align-items:center;flex:1}.icol span{font-size:9px;color:#c9bfe0}.icol i{width:100%;height:12px;border-radius:2px;font-style:normal;font-size:8px;text-align:center;color:#c9bfe0}
.income.small .icol i{height:7px}.slots{display:flex;gap:3px;margin-top:4px}.slots i{flex:1;height:18px;border:1px dashed #6a5a92;border-radius:3px;font-style:normal;font-size:8px;display:flex;align-items:center;justify-content:center;color:#a99cc4}.slots i.full{background:#5aad5a33;border:1px solid #5aad5a;color:#efe6d2}
.res{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.res span{display:flex;align-items:center;gap:3px;font-size:12px}.res i{width:11px;height:11px;border-radius:3px;display:block}.res em{font-style:normal;color:#a99cc4;font-size:9px}.res .vp{color:#f2d58c}.res .era{margin-left:auto;color:#c9bfe0}
.hand{display:flex;gap:5px}.card{width:54px;height:76px;background:linear-gradient(#3a2c55,#241b38);border:2px solid #e2c27a;border-radius:5px;font-size:8px;display:flex;align-items:flex-end;justify-content:center;padding:3px;text-align:center}
.card.t{width:52px;height:22px;align-items:center;border-color:#e09a2b}.tech{display:flex;flex-direction:column;gap:3px}.trow{display:flex;gap:4px;align-items:center}.trow span{width:36px;color:#a99cc4;font-size:9px}
.decide{display:flex;align-items:center;gap:10px;background:#3b2d55;border:2px solid #f2d58c;border-radius:6px;padding:7px 10px;font-size:12px}.decide b{color:#f2d58c}.decide button{margin-left:auto;font-family:VCR,monospace;background:#5aad5a;color:#120d1c;border:0;border-radius:4px;padding:5px 10px;font-size:11px}
.panel{background:#251d2dcc;border:2px solid #3b2f52;border-radius:6px;padding:7px;display:flex;flex-direction:column;gap:6px;min-height:0}.panel h4{margin:0;font-weight:normal;color:#c9bfe0;font-size:10px;text-transform:uppercase;letter-spacing:1px}
.moves{display:flex;flex-direction:column;gap:5px}.moves h4{margin:0;font-weight:normal;color:#c9bfe0;font-size:10px;text-transform:uppercase;letter-spacing:1px}
.move{display:flex;gap:6px;align-items:center;background:color-mix(in srgb,var(--c,#6a5a92) 22%,#1d1629);border:2px solid color-mix(in srgb,var(--c,#6a5a92) 70%,#000);border-radius:6px;padding:6px 8px}.move b{display:block;font-weight:normal;color:#efe6d2;font-size:11.5px}.move small{color:#c9bfe0;font-size:9.5px}.move .cost{margin-left:auto;font-size:9.5px;padding:3px 6px;border-radius:4px;background:#120d1c;white-space:nowrap}.move .cost.ok{color:#9fe09a}.move.inc{--c:#f2d58c}
.tabs{display:flex;gap:4px}.tabs span{padding:5px 10px;background:#30233c;border-radius:5px 5px 0 0;color:#a99cc4}.tabs span.on{background:#3b2d55;color:#f2d58c}
.note{position:absolute;background:#f2d58c;color:#1a1326;font-size:10px;padding:3px 6px;border-radius:4px;font-family:VCR,monospace}
</style>`;


export { P, TRACKS, RES, trackStrip, hexMap, capital, incomeMat, resources, hand, tech, header, decision, nextMoves, css };
