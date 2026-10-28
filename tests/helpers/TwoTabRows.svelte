<!-- Two tab rows with the same tab ids on one page, as How to play open over the player area (#91), for tests/tabs.test.mjs. -->
<script>
	import Tabs from '../../src/lib/components/ui/Tabs.svelte';

	const TABS = [
		{ id: 'capital', label: 'Capital' },
		{ id: 'income', label: 'Income' },
	];
</script>

<Tabs
	label="Your city and cards"
	tabs={TABS}
	value="capital">
	<p>The player area's capital.</p>
</Tabs>
<Tabs
	label="How to play"
	tabs={TABS}
	value="capital">
	<p>The rules of the capital.</p>
</Tabs>
