import { mount } from 'svelte';
import App from './App.svelte';
import '../../../src/styles/tokens.css';
import '../../../src/styles/base.css';
import '../../../src/styles/card-layouts.css';
mount(App, { target: document.getElementById('app') });
