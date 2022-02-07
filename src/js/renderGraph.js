(() => {
	const configs = [
		{
			name: 'Node Radius',
			input: 'number',
			value: 30,
		},
		{
			name: 'Node Color',
			input: 'color',
			value: '#6399C5',
		},
		{
			name: 'Edge Width',
			input: 'number',
			value: 12,
		},
		{
			name: 'Edge Color',
			input: 'color',
			value: '#FFCCCC',
		},
		{
			name: 'Background',
			input: 'color',
			value: '#000000',
		},
	];

	document.querySelector('.container').innerHTML = `
		<div class="config">
			${configs
				.map(
					(item) => `
					<div class="${item.name.toLowerCase().split(' ').join('-')}">
						<span class="label">${item.name}</span>
						<input type="${item.input}" value="${item.value}">
					</div>`
				)
				.join('')}
		</div>

		<div class="node-list">
			<div class="content"></div>
			<div class="add-btn">Add node</div>
		</div>`;
})();
