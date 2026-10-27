// ComponentEvent: the value every Svelte callback prop receives.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { ComponentEvent } from '../src/lib/component-event.js';

test('carries the value, the target and the original event', () => {
	const target = { tagName: 'BUTTON' };
	const original = { type: 'click' };
	const value = { track: 'exploration', space: 5 };
	const event = new ComponentEvent(value, target, original);
	assert.equal(event.value, value);
	assert.equal(event.target, target);
	assert.equal(event.originalEvent, original);
});

test('the original event is optional', () => {
	const event = new ComponentEvent('farm', { tagName: 'BUTTON' });
	assert.equal(event.originalEvent, undefined);
});
