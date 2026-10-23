// Keep the archived player-color preview buttons interactive.
for (const button of document.querySelectorAll('.variant')) {
	button.addEventListener('click', () => {
		const card = button.closest('.card');
		const preview = card?.querySelector('.preview');
		if (!preview || !card) { return; }
		preview.innerHTML = button.innerHTML;
		for (const variant of card.querySelectorAll('.variant')) {
			variant.classList.toggle('selected', variant === button);
			variant.setAttribute('aria-pressed', String(variant === button));
		}
	});
}
