const tools = [
	{
		name: 'Contest',
		icon: '<i class="bi bi-card-list"></i>',
	},
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
	{
		name: 'Problemset',
		icon: '<i class="bi bi-list-task"></i>',
	},
	{
		name: 'Bookmarks',
		icon: '<i class="bi bi-bookmarks"></i>',
	},
	{
		name: 'Extras',
		icon: '<i class="bi bi-gear"></i>',
	},
	{
		name: 'Profile',
		icon: '<i class="bi bi-person"></i>',
	},
];

const toolContainer = document.querySelector('.tools');
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
