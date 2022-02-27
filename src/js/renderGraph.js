(() => {
	const configs = [
		{
			name: 'Node Radius',
			input: 'number',
			value: 25,
			extraList: [
				{
					name: 'Node Color',
					input: 'color',
					value: '#6ad468',
					tooltip: 1,
				},
				{
					name: 'Node Value Color',
					input: 'color',
					value: '#ffffff',
					tooltip: 1,
				},
			],
		},
		{
			name: 'Edge Width',
			input: 'number',
			value: 6,
			extraList: [
				{
					name: 'Edge Color',
					input: 'color',
					value: '#ce5050',
					tooltip: 1,
				},
				{
					name: 'Edge Value Color',
					input: 'color',
					value: '#ffffff',
					tooltip: 1,
				},
			],
		},
	];
	const other_config = [
		{
			name: 'Extra',
			extraList: [
				{
					name: 'Background',
					input: 'color',
					value: '#000000',
					tooltip: 0,
				},
				{
					name: 'Show Direct',
					input: 'checkbox',
					value: '',
					tooltip: 0,
				},
			],
		},
	];

	const cvert = (item) => item.name.toLowerCase().split(' ').join('-');

	document.querySelector('.container').innerHTML = `
		<div class="config">
			${configs
				.map(
					(item) => `
					<div>
						<span class="label">${item.name}</span>
						<input
							class="${cvert(item)}" type="${item.input}"
							value="${item.value}">
						${item?.extraList
							.map((color) => {
								return `<input
											class="${cvert(color)} ${color.tooltip ? 'tooltip' : ''}"
											type="${color.input}"
											value="${color.value}"
											${color.tooltip ? `data-ctx="${color.name}"` : ''}
											>`;
							})
							.join('')}
					</div>`
				)
				.join('')}
			${other_config
				.map((config) => {
					return `<div class="${config.name.toLowerCase()}">
						${config?.extraList
							.map((extra) => {
								return `
							<div class="extra-item">
								<span class="label">${extra.name}</span>
								<input
										class="${cvert(extra)} ${extra.tooltip ? 'tooltip' : ''}"
										type="${extra.input}"
										value="${extra.value}"
										${extra.tooltip ? `data-ctx="${extra.name}"` : ''}>
							</div>`;
							})
							.join('')}
				</div>`;
				})
				.join('')}
		</div>

		<div class="node-list">
			<div class="content"></div>
			<div class="btn-container">
				<div class="list__btn add-btn">Add node</div>
				<div class="list__btn copy-btn">Copy Data</div>
			</div>
		</div>`;
})();

(() => {
	const helpContent = [
		{
			label: 'Space moving',
			content: ['Just move your mouse'],
		},
		{
			label: 'Space moving speed',
			content: ['Type "x" to increase the moving speed'],
		},
		{
			label: 'Open Config panel',
			content: ['Type "p" to show the config panel'],
		},
		{
			label: 'Open Input Field',
			content: ['Type "i" to show the config panel'],
		},
		{
			label: 'Add new node',
			content: [
				'Click the "Add Node" button or "Click and Hold + Shift"',
			],
		},
		{
			label: 'Remove a node',
			content: ['Click the "X" button or "Click and Hold + D"'],
		},
		{
			label: 'Add node weight',
			content: ['Edit the second input field'],
		},
		{
			label: 'Add edge between two nodes',
			content: [
				'Edit the third input field like "2, 3, 4" to add adjacent node of the current node',
				'Edit the third input field like "2:6, 3:4" or "2:6/4, 3:4/4" to add weight of edges (default is 0)',
				'Or "Click and Hold + S" on the first node, then do the same for the second one',
			],
		},
	];

	const helpModal = document.querySelector('.help-modal');
	helpModal.innerHTML = `
		<div class="help-title">Help</div>
		<div class="help-container">
			${helpContent
				.map((help) => {
					return `
					<div class="help-item">
						<span class="help-label">${help.label}</span>
						<div class="help-content">${help.content
							.map(
								(item) => `
							<p>${item}</p>`
							)
							.join('')}
						</div>
					</div>`;
				})
				.join('')}
		</div>
	`;
})();

setTimeout(
	() => (document.querySelector('.help-hint').style.display = 'none'),
	6000
);
