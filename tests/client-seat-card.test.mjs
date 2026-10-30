// The lobby's seat and code (#102): SeatCard draws only the lobby's seat states with one ×, and TableCode's field is a TextInput.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import SeatCard from '../src/lib/components/lobby/SeatCard.svelte';
import TableCode from '../src/lib/components/lobby/TableCode.svelte';

const seatSource = readFileSync(
	new URL('../src/lib/components/lobby/SeatCard.svelte', import.meta.url),
	'utf8'
);
const textInputSource = readFileSync(
	new URL('../src/lib/components/ui/TextInput.svelte', import.meta.url),
	'utf8'
);
const codeSource = readFileSync(
	new URL('../src/lib/components/lobby/TableCode.svelte', import.meta.url),
	'utf8'
);

/**
 * The seat's server-rendered HTML.
 * @param {Record<string, unknown>} props
 * @returns {string}
 */
function seat(props) {
	return render(SeatCard, { props: { seat: 3, ...props } }).body;
}

/**
 * How many × buttons the HTML has.
 * @param {string} html
 * @returns {number}
 */
function crosses(html) {
	return (html.match(/class="rg-seat-card--remove/g) ?? []).length;
}

test('an empty seat offers Open seat, and a closed one nothing (#98, #102)', () => {
	const empty = seat({ state: 'empty' });
	assert.match(empty, /aria-label="Seat 3: empty"/);
	assert.match(empty, /Open seat/);
	assert.equal(crosses(empty), 0);
	const closed = seat({ state: 'closed' });
	assert.match(closed, /aria-label="Seat 3: empty"/);
	assert.doesNotMatch(closed, /<button/);
});

test('a seat to name holds the name field, Add and the × that closes it (#102)', () => {
	const html = seat({ state: 'add', name: 'Vera' });
	assert.match(html, /aria-label="Seat 3: add a player"/);
	assert.match(html, /class="rg-seat-card--frame/);
	assert.match(html, /aria-label="Name of the player in seat 3"/);
	assert.match(html, /value="Vera"/);
	assert.match(html, /placeholder="Name, or leave empty"/);
	assert.match(html, /maxlength="24"/);
	assert.match(html, />(<!---->)?Add(<!---->)?<\/button>/);
	assert.equal(crosses(html), 1);
	assert.match(html, /aria-label="Close seat 3"/);
	assert.match(html, /title="Close the seat"/);
});

test('a player shows the badges and name, and a × only when removable (#102)', () => {
	const html = seat({
		state: 'player',
		name: 'Ana',
		you: true,
		host: true,
		ready: false,
		showCivilization: false,
	});
	assert.match(html, /aria-label="Seat 3: Ana"/);
	assert.match(html, />You</);
	assert.match(html, />Host</);
	assert.match(html, />Not ready</);
	assert.equal(crosses(html), 0);
	const removable = seat({ state: 'player', name: 'Ana', removable: true });
	assert.equal(crosses(removable), 1);
	assert.match(removable, /aria-label="Remove Ana"/);
	assert.match(removable, /title="Remove the player"/);
});

test('the name field and Add take TextInput and Button, filling the frame (owner, 2026-10-30, #102)', () => {
	const html = seat({ state: 'add', name: '' });
	assert.match(
		html,
		/class="rg-text-input rg-text-input--small [^"]*rg-text-input--block"/
	);
	assert.match(
		html,
		/<button type="submit"[^>]*class="rg-button rg-button--gold rg-button--small [^"]*rg-button--block"/
	);
	assert.doesNotMatch(seatSource, /<input|rg-seat-card--add-input/);
	assert.doesNotMatch(seatSource, /rg-seat-card--add-button/);
	assert.match(seatSource, /<TextInput/);
	assert.match(seatSource, /<Button/);
});

test('a small TextInput keeps its line border on focus only while read-only, so the add field shows the gold focus (#102)', () => {
	assert.match(
		textInputSource,
		/\.rg-text-input--small \.rg-text-input--field\[readonly\]:focus \{/
	);
	assert.doesNotMatch(
		textInputSource,
		/\.rg-text-input--small \.rg-text-input--field:focus/
	);
	assert.match(textInputSource, /\.rg-text-input--block \{/);
});

test('SeatCard keeps only the lobby states: no open seat to take, one × and its words from lobby.js (#102)', () => {
	assert.doesNotMatch(seatSource, /'open'|onSeatCardTake|Take the seat/);
	assert.equal(
		(seatSource.match(/class="rg-seat-card--remove"/g) ?? []).length,
		1
	);
	assert.match(seatSource, /seatLabel\(/);
	assert.match(seatSource, /seatBadges\(/);
	assert.doesNotMatch(seatSource, /\?[^?:\n]*\n\s*:[^\n]*\?/);
	assert.doesNotMatch(seatSource, /height: 30px/);
});

test('the table code is a small read-only TextInput with COPY (#102)', () => {
	const html = render(TableCode, { props: { code: 'DAWN2048' } }).body;
	assert.match(html, /class="rg-text-input rg-text-input--small/);
	assert.match(html, /aria-label="Table code"/);
	assert.match(html, /value="DAWN2048"/);
	assert.match(html, /readonly/);
	assert.match(html, /aria-label="Copy the table code"/);
	// No message: the field's message line stays empty, so it takes no room beside COPY.
	assert.match(html, /<p class="rg-text-input--error[^"]*"[^>]*><\/p>/);
	assert.doesNotMatch(codeSource, /<input/);
	assert.match(codeSource, /onTextInputFocus=/);
});
