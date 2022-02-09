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
				},
				{
					name: 'Node Value Color',
					input: 'color',
					value: '#ffffff',
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
				},
				{
					name: 'Edge Value Color',
					input: 'color',
					value: '#ffffff',
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
				},
				{
					name: 'Show Direct',
					input: 'checkbox',
					value: '',
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
						<input class="${cvert(item)}" type="${item.input}" value="${item.value}">
						${item?.extraList
							.map((color) => {
								return `<input
											class="${cvert(color)}"
											type="${color.input}"
											value="${color.value}">`;
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
										class="${cvert(extra)}"
										type="${extra.input}"
										value="${extra.value}">
							</div>`;
							})
							.join('')}
				</div>`;
				})
				.join('')}
		</div>

		<div class="node-list">
			<div class="content"></div>
			<div class="add-btn">Add node</div>
		</div>`;
})();
