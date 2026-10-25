// Mount the reviewed cards using the production components.
import { mount } from 'svelte';
import CardReview from './CardReview.svelte';
import '../styles/tokens.css';
import '../styles/base.css';
const target = /** @type {HTMLElement} */ (document.getElementById('app'));
mount(CardReview, { target });
