// Mounts the #35 part 4 mockup (docs/ui/arts-architecture.html) with the production components.
import { mount } from 'svelte';
import ArtsMockup from './ArtsMockup.svelte';
import '../styles/tokens.css';
import '../styles/base.css';
const target = /** @type {HTMLElement} */ (document.getElementById('app'));
mount(ArtsMockup, { target });
