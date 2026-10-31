// Mounts the #32 landmark-card mockup (docs/ui/landmark-cards.html) with the production components.
import { mount } from 'svelte';
import LandmarkCardsMockup from './LandmarkCardsMockup.svelte';
import '../styles/tokens.css';
import '../styles/base.css';
const target = /** @type {HTMLElement} */ (document.getElementById('app'));
mount(LandmarkCardsMockup, { target });
