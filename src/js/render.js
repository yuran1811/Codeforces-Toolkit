const tools = [
	{
		name: 'User',
		icon: '<i class="bi bi-person-circle"></i>',
	},
	{
		name: 'Rating',
		icon: '<i class="bi bi-graph-up"></i>',
	},
	{
		name: 'Stalking',
		icon: '<i class="bi bi-person-bounding-box"></i>',
	},
	// {
	// 	name: 'ProblemSubmission',
	// 	icon: '<i class="bi bi-ui-radios"></i>',
	// },
	{
		name: 'Problemset',
		icon: '<i class="bi bi-list-task"></i>',
	},
];

const toolContainer = document.querySelector('.tool-container');
const mainContainer = document.querySelector('.main-container');

toolContainer.innerHTML += tools
	.map(
		(item, index) => `
			<div class="tool-item" data-itemIndex="${index}">
				${item.icon}
				<span class="tool-name"> ${item.name} </span>
			</div>`
	)
	.join('');

mainContainer.innerHTML = tools
	.map(
		(item) => `<div class="main-content ${item.name.toLowerCase()}"> </div>`
	)
	.join('');
