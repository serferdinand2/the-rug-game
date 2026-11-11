// Mounts the #184 mockup (docs/ui/aa-card-targets.html) with the production components.
import { mount } from 'svelte';
import CardTargetsMockup from './CardTargetsMockup.svelte';
import '../styles/tokens.css';
import '../styles/base.css';
const target = /** @type {HTMLElement} */ (document.getElementById('app'));
mount(CardTargetsMockup, { target });
