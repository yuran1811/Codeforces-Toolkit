(() => {
	const configs = [
		{
			name: 'Node Radius',
			input: 'number',
			value: 25,
			colorList: [
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
			colorList: [
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
		{
			name: 'Background',
			input: 'color',
			value: '#000000',
			colorList: [],
		},
	];

	document.querySelector('.container').innerHTML = `
		<div class="config">
			${configs
				.map(
					(item) => `
					<div>
						<span class="label">${item.name}</span>
						<input
							class="${item.name.toLowerCase().split(' ').join('-')}"
							type="${item.input}" value="${item.value}"
						>
							${item?.colorList
								.map(
									(color) =>
										`<input class="${color.name
											.toLowerCase()
											.split(' ')
											.join('-')}" type="${
											color.input
										}" value="${color.value}">`
								)
								.join('')}
					</div>`
				)
				.join('')}
		</div>

		<div class="node-list">
			<div class="content"></div>
			<div class="add-btn">Add node</div>
		</div>`;
})();
