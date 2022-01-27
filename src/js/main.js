'use strict';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const select = (par, child) => par.querySelector(child);
const selectAll = (par, child) => par.querySelectorAll(child);

const PROBLEM_LINK = 'https://codeforces.com/problemset/problem/';
const PB_CONTEST_LINK = (item) =>
	`https://codeforces.com/contest/${item.contestId}/problem/${item.index}`;
const SUBMIT_LINK = (item) =>
	`https://codeforces.com/contest/${item.contestId}/submit`;

const PROBLEM_API = 'https://codeforces.com/api/problemset.problems';
const USER_STATUS_API = 'https://codeforces.com/api/user.status?handle=';
const USER_INFO_API = 'https://codeforces.com/api/user.info?handles=';
const USER_RATING_API = 'https://codeforces.com/api/user.rating?handle=';
const CONTEST_API = 'https://codeforces.com/api/contest.list';

const bmNoFill = `<i class="bi bi-bookmarks"></i>`;
const bmFill = `<i class="bi bi-bookmarks-fill"></i>`;

const toolItems = $$('.tool-item');
const contents = $$('.main-content');
const problemsetContainer = $('.main-content.problemset');
const stalkingContainer = $('.main-content.stalking');
const bookmarksContainer = $('.main-content.bookmarks');

const problemStatusList = [
	'OK',
	'TIME_LIMIT_EXCEEDED',
	'MEMORY_LIMIT_EXCEEDED',
	'COMPILATION_ERROR',
	'RUNTIME_ERROR',
	'FAILED',
	'WRONG_ANSWER',
];
const problemStatus = {
	OK: {
		color: '#00a92a',
		text: 'AC',
	},
	TIME_LIMIT_EXCEEDED: {
		color: '#fff863',
		text: 'TLE',
	},
	MEMORY_LIMIT_EXCEEDED: {
		color: '#ffa71c',
		text: 'MLE',
	},
	COMPILATION_ERROR: {
		color: '#ffa71c',
		text: 'CE',
	},
	RUNTIME_ERROR: {
		color: '#ffa71c',
		text: 'RE',
	},
	FAILED: {
		color: 'red',
		text: 'FAILED',
	},
	WRONG_ANSWER: {
		color: 'red',
		text: 'WA',
	},
	OTHER: {
		color: 'lightgrey',
	},
};

let problemsData = JSON.parse(localStorage.getItem('problems')) || {};
let lastUpdateTime = JSON.parse(localStorage.getItem('timeUpdate')) || '';
let bmarkData = JSON.parse(localStorage.getItem('bookmarks')) || [];

let listCnt = 0;
let newList = [];
let newListSize = 0;
let stalkingContent;
let stalkListCnt = 10;

const hideAll = (list) => list.forEach((item) => (item.style.display = 'none'));

const getProblemData = () => {
	async function getData() {
		const response = await fetch(PROBLEM_API);
		const data = await response.json();
		problemsData = data.result;
		localStorage.setItem('problems', JSON.stringify(problemsData));
		localStorage.setItem('timeUpdate', Date.now());
		$('.timeUpdate').innerHTML = 'Recently sync';
	}
	getData();
};

const bmarkRender = () => {
	const bookmarks = select(bookmarksContainer, '.all-content');
	bookmarks.innerHTML = bmarkData
		.map(
			(item) => `
				<div class="bmark-item" data-id="${item.id}">
					<i class="bi bi-x-circle" onclick="bmarkDelete(event)"></i>
					${item.data}
				</div>`
		)
		.join('');
	localStorage.setItem('bookmarks', JSON.stringify(bmarkData));
};
const bmarkDelete = (e) => {
	e.stopPropagation();
	const bmItem = e.target.closest('.bmark-item');

	bmarkData.forEach((item, index) => {
		if (item.id === bmItem.dataset.id) {
			bmarkData.splice(index, 1);
		}
	});
	bmarkRender();

	const delList = selectAll(
		document,
		`.problem-item[data-problemid="${bmItem.dataset.id}"] .bmContainer`
	);
	delList.forEach((item) => item.classList.remove('fill'));
};
const bmarksHandle = (e) => {
	const thisItem = e.currentTarget;
	const pblemItem = thisItem.closest('.problem-item');

	thisItem.classList.toggle('fill');
	if (thisItem.className.includes('fill')) {
		if (!bmarkData.some((item) => item.id === pblemItem.dataset.problemid))
			bmarkData.push({
				id: pblemItem.dataset.problemid,
				data: pblemItem.innerHTML,
			});
	} else {
		bmarkData.forEach((item, index) => {
			if (item.id === pblemItem.dataset.problemid)
				bmarkData.splice(index, 1);
		});
	}
	bmarkRender();
};

const getList = (problems) => {
	const nameSearch = $('#nameSearch');
	const tagSearch = $('#tagSearch');
	const ratingFrom = $('#ratingFrom');
	const ratingTo = $('#ratingTo');
	const contestSearch = $('#contestSearch');

	const nameSearchValue = nameSearch.value.trim().toLowerCase();
	const tagSearchValue = tagSearch.value.trim().toLowerCase();
	const ratingFromValue = Number(ratingFrom.value.trim());
	const ratingToValue = Number(ratingTo.value.trim());
	const contestSearchValue = contestSearch.value.trim();

	let problemList = Array.from(problems);

	if (nameSearchValue)
		problemList = problemList.filter((item) =>
			item.name.toLowerCase().includes(nameSearchValue)
		);

	if (tagSearchValue)
		problemList = problemList.filter((item) =>
			item.tags.some((tag) => tagSearchValue.toLowerCase().includes(tag))
		);

	if (ratingFromValue || ratingToValue)
		problemList = problemList.filter((item) => {
			if (ratingFromValue && ratingToValue)
				return (
					ratingFromValue <= item.rating &&
					item.rating <= ratingToValue
				);
			if (ratingFromValue) return ratingFromValue <= item.rating;
			return item.rating <= ratingToValue;
		});

	if (contestSearchValue)
		problemList = problemList.filter(
			(item) => item.contestId == contestSearchValue
		);

	return problemList;
};
const getListHTMLS = (list, from = 0, to = 0) => {
	return list
		.slice(from, to)
		.map((item) => {
			const pblemId = item.contestId + String(item.index.charCodeAt(0));
			return `
					<div
						class="problem-item"
						data-problemid="${pblemId}">
						<div class="bmContainer ${
							bmarkData.some((bm) => bm.id === pblemId) && 'fill'
						}" onclick="bmarksHandle(event)">
							${bmNoFill}
							${bmFill}
						</div>
						<a
							class="in-contest-link"
							target="_blank"
							rel="noopener"
							href="${PB_CONTEST_LINK(item)}">
							<i class="bi bi-box-arrow-in-up-right"></i>
						</a>
						<a
							class="submit-link"
							target="_blank"
							rel="noopener"
							href="${SUBMIT_LINK(item)}">
							<i class="bi bi-code"></i>
						</a>
						<a
							class="content-item" target="_blank" rel="noopener"
							href="${PROBLEM_LINK}/${item.contestId}/${item.index}">
							<div class="content-item__info">
								<span class="content-item__info-index">
									${item.index + ' - '}
								</span>
								<span class="content-item__info-name">
									${item.name}
								</span>
							</div>

							<div class="content-item__tags">
								${item.tags.map((item) => item).join(', ')}
							</div>
							<div class="content-item__rating">
								<span class="label">Rating:</span>
								<span class="rating"> ${item?.rating || 'Unrated'}</span>
							</div>
						</a>
					</div>`;
		})
		.join('');
};

const stalkRender = (data) => {
	stalkingContent = select(stalkingContainer, '.all-content');
	stalkingContent.innerHTML;
	data.forEach(
		(user) =>
			(stalkingContent.innerHTML += `
					<div class="userSubmissionStalk">
						<div class="problemDetail">
							<span class="problemName">${user.problem.name}</span>
							<span class="problemRate">${user.problem?.rating || 'Unrated'}</span>
							<span class="problemVerdict" style="color:${
								problemStatusList.includes(user.verdict)
									? problemStatus[user.verdict].color
									: problemStatus['OTHER'].color
							}">
							${
								problemStatusList.includes(user.verdict)
									? problemStatus[user.verdict].text
									: user.verdict
							}</span>
						</div>
						<div class="time" style="text-align: center">${new Date(
							user.creationTimeSeconds * 1000
						)}</div>
					</div>`)
	);
};
const loadEvent = (e) => {
	e.target.style.display = 'none';
	const problemsetAllContent = select(problemsetContainer, '.all-content');
	problemsetAllContent.innerHTML += getListHTMLS(
		newList,
		listCnt,
		listCnt + 20
	);
	listCnt += 20;
	if (listCnt < newListSize)
		problemsetAllContent.innerHTML += `<button class="load-more" onclick="loadEvent(event)">Load More</button>`;
};
const stalkLoadEvent = (e) => {
	const searchBar = $('#stalkHandle');
	e.target.style.display = 'none';
	(async () => {
		const value = searchBar.value.trim();
		const response = await fetch(
			`${USER_STATUS_API}${value}&from=${stalkListCnt + 1}&count=${
				stalkListCnt + 10
			}`
		);
		stalkListCnt += 10;
		const data = await response.json();
		stalkRender(data.result);
		stalkingContent.innerHTML += `<button class="load-more" onclick="stalkLoadEvent(event)">Load More</button>`;
	})();
};

toolItems.forEach((item, index) => {
	item.onclick = (e) => {
		const lastToolActive = $('.tool-container .active');
		if (lastToolActive && lastToolActive !== e.currentTarget) {
			lastToolActive.className = lastToolActive.className.replace(
				' active',
				''
			);
		}
		e.currentTarget.classList.add('active');

		hideAll(contents);
		contents[index].style.display = 'flex';
	};
});

// Problemset Handle
(() => {
	problemsetContainer.innerHTML = `<div class="header">
										<span class="title">Problemset</span>
									</div>
									<div class="timeUpdate">${
										lastUpdateTime
											? `Last update: ${new Date(
													lastUpdateTime
											  )}`
											: 'Nothing changes'
									}</div>
									<form class="search-container">
										<input placeholder="Search by name" type="text" id="nameSearch">
										<input placeholder="Search by tags, split by space" type="text" id="tagSearch">
										<div class="search-by-rating">
											<input placeholder="Rating from" type="number" id="ratingFrom">
											<input placeholder="Rating to" type="number" id="ratingTo">
										</div>
										<input placeholder="Contest ID" type="number" id="contestSearch">
										<div class="all-btn">
											<button class="submit">Search</button>
											<button class="random">Random</button>
											<button class="updateProblemBtn">Update</button>
											<button class="tags-toggle">Hide Tags</button>
										</div>
									</form>
									<div class="all-content"></div>`;

	problemsData?.problems || getProblemData();

	const problemsetAllContent = select(problemsetContainer, '.all-content');

	const searchBtn = select(problemsetContainer, '.search-container .submit');
	searchBtn.onclick = (e) => {
		e.preventDefault();

		newList = getList(problemsData.problems);
		newListSize = newList.length;
		listCnt = newListSize <= 20 ? newListSize : 20;
		problemsetAllContent.innerHTML = getListHTMLS(newList, 0, listCnt);

		if (listCnt < newListSize)
			problemsetAllContent.innerHTML += `<button class="load-more" onclick="loadEvent(event)">Load More</button>`;
	};

	const randomBtn = select(problemsetContainer, '.search-container .random');
	randomBtn.onclick = (e) => {
		e.preventDefault();

		let newList = getList(problemsData.problems);
		let listSize = newList.length;
		let randNum = Math.round(Math.random() * listSize);

		let newListHTMLS = getListHTMLS([newList[randNum]], 0, 1);

		problemsetAllContent.innerHTML = newListHTMLS;
	};

	$('.updateProblemBtn').onclick = (e) => {
		e.preventDefault();
		getProblemData();
	};

	$('.tags-toggle').onclick = (e) => {
		e.preventDefault();
		problemsetContainer.classList.toggle('no-tags');
		e.target.innerHTML =
			e.target.innerHTML === 'Hide Tags' ? 'Show Tags' : 'Hide Tags';
	};
})();

// Contest Handle
(() => {
	const contestContainer = $('.main-content.contest');
	contestContainer.innerHTML = `<div class="header"><span>Contest List</span></div>
								<div class="all-content current"></div>
								<div class="all-content finished"></div>`;

	const currentContent = select(contestContainer, '.all-content.current');
	const finishedContent = select(contestContainer, '.all-content.finished');

	currentContent.innerHTML += `<div class="title">Current or Upcoming Contests</div>`;
	finishedContent.innerHTML += `<div class="title">Contest History</div>`;

	const renderContest = (container, contests, isFin) => {
		contests.forEach((contest) => {
			const duration = contest.durationSeconds;
			const d = Math.floor(duration / (60 * 60 * 24)) || '';
			const h = Math.floor((duration % (60 * 60 * 24)) / (60 * 60)) || '';
			const m = Math.floor((duration % (60 * 60)) / 60) || '00';
			const s = Math.floor(duration % 60) || '';
			const length = `${d && d + ':'}${h && h + ':'}${m}${s && ':' + s}`;

			const time = new Date(contest.startTimeSeconds * 1000);
			const startTime = time
				.toString()
				.split(' ')
				.filter((item) => item.includes(':'))
				.join('');

			const startDate = time
				.toString()
				.slice(0, time.toString().indexOf(startTime) - 1);

			if (isFin)
				container.innerHTML += `
					<a
							class="contestInfo-item" target="_blank" rel=”noopener”
							href="https://codeforces.com/contest/${contest.id}"
							>
							<div class="name">${contest.name}</div>
							<div class="length">${length}</div>
							<div class="startTime">${`${startDate}, ${startTime}`}</div>
					</a>`;
			else
				container.innerHTML += `
					<div
							class="contestInfo-item" target="_blank" rel=”noopener”
							href="https://codeforces.com/contest/${contest.id}"
							>
							<div class="name">${contest.name}</div>
							<div class="length">${length}</div>
							<div class="startTime">${`${startDate}, ${startTime}`}</div>
					</div>`;
		});
	};

	(async () => {
		const response = await fetch(CONTEST_API);
		const data = await response.json();
		renderContest(
			currentContent,
			data.result.filter((item) => item.phase === 'BEFORE'),
			0
		);
		renderContest(
			finishedContent,
			data.result
				.slice(0, 15)
				.filter((item) => item.phase === 'FINISHED'),
			1
		);
	})();
})();

// User Info Handle
(() => {
	const rankColor = {
		newbie: '#ccc',
		pupil: '#7f7',
		specialist: '#7db',
		expert: '#aaf',
		'candidate master': '#f8f',
		master: '#fc8',
		'international master': '#fb5',
		grandmaster: '#f77',
		'international grandmaster': '#f33',
		'legendary grandmaster': '#f00',
	};

	const userContainer = $('.main-content.user');
	userContainer.innerHTML = `<div class="header"><span>User Info</span></div>
								<input placeholder="Search user by handle, split by ';'" type="text" id="handleSearch">
								<div class="all-content"></div>`;

	const allUserContent = select(userContainer, '.all-content');
	const renderUserInfo = (data) => {
		allUserContent.innerHTML = '';
		data.forEach(
			(user) =>
				(allUserContent.innerHTML += `
					<a
						class="user-item" target="_blank" rel=”noopener”
						href="https://codeforces.com/profile/${user.handle}"
						>
						<div class="left">
							<figure>
								<figcaption>
									<div class="rating-status">
										<span
											style="color: ${rankColor[user.maxRank]}"
											class="rank">${user.maxRank + ', '}
										</span>
										<span
											style="color: ${rankColor[user.maxRank]}"
											class="rating">${user.maxRating}
										</span>
									</div>
								</figcaption>
								<img src="${user.titlePhoto}" alt="${user.handle}">
							</figure>
						</div>
						<div class="right">
							<div class="rating-status">
								<span
									style="color: ${rankColor[user.rank]}"
									class="rank">
									${user.rank + ', '}
								</span>
								<span
									style="color: ${rankColor[user.rank]}"
									class="rating">${user.rating}
								</span>
							</div>
							${
								user.email
									? `
										<div class="email">
											<span>Email: </span>${user.email}
										</div>`
									: ''
							}
							<div class="friends">Friend of <b>${user.friendOfCount}</b> users</div>
						</div>
					</a>`)
		);
	};

	const handleSearch = $('#handleSearch');
	handleSearch.onkeydown = (e) => {
		if (e.keyCode !== 13) return;

		(async () => {
			const value = handleSearch.value.trim();
			const response = await fetch(`${USER_INFO_API}${value}`);
			const data = await response.json();
			renderUserInfo(data.result);
		})();
	};
})();

// User Rating Handle
(() => {
	const userRating = $('.main-content.rating');
	userRating.innerHTML = `<div class="header"><span>User Rating</span></div>
							<input placeholder="Show user's rating by handle" type="text" id="ratingHandleSearch">
							<div class="all-content"></div>`;

	const ratingContent = select(userRating, '.all-content');
	const renderUserInfo = (data) => {
		ratingContent.innerHTML = '';
		data.forEach(
			(contest) =>
				(ratingContent.innerHTML += `
					<div class="contest-item">
						<span class="contestId">#${contest.contestId}</span>
						<span class="contestName">${contest.contestName}</span>
						<span class="rank">No.${contest.rank}</span>
						<div class="ratingChange">
							<span>${contest.oldRating}</span>
							${
								contest.oldRating < contest.newRating
									? `<i class="bi bi-arrow-up-right"></i>`
									: `<i class="bi bi-arrow-down-right"></i>`
							}
							<span class="newRate ${
								contest.oldRating < contest.newRating
									? 'up'
									: 'down'
							}">${contest.newRating}</span>
						</div>
					</div>`)
		);
	};

	const ratingHandleSearch = $('#ratingHandleSearch');
	ratingHandleSearch.onkeydown = (e) => {
		if (e.keyCode !== 13) return;

		(async () => {
			const value = ratingHandleSearch.value.trim();
			const response = await fetch(`${USER_RATING_API}${value}`);
			const data = await response.json();
			renderUserInfo(data.result?.reverse());
		})();
	};
})();

// User Stalking Handle
(() => {
	stalkingContainer.innerHTML = `<div class="header"><span>Stalking Mode</span></div>
								<div class="stalkTools">
									<input placeholder="Search user by handle" type="text" id="stalkHandle">
									<button class="clearStalkBtn">Clear</button>
								</div>
								<div class="all-content"></div>`;

	stalkingContent = select(stalkingContainer, '.all-content');
	const searchBar = $('#stalkHandle');
	searchBar.onkeydown = (e) => {
		if (e.keyCode !== 13) return;

		(async () => {
			const value = searchBar.value.trim();
			const response = await fetch(
				`${USER_STATUS_API}${value}&from=1&count=10`
			);
			const data = await response.json();
			stalkRender(data.result);
			stalkingContent.innerHTML += `<button class="load-more" onclick="stalkLoadEvent(event)">Load More</button>`;
		})();
	};

	$('.clearStalkBtn').onclick = () => (stalkingContent.innerHTML = '');
})();

// Bookmarks Handle
(() => {
	bookmarksContainer.innerHTML = `<div class="header"><span>Bookmarks</span></div>
								<div class="bmarkTools">
									<button class="clearBmarkBtn">Clear</button>
								</div>
								<div class="all-content"></div>`;
	$('.clearBmarkBtn').onclick = () => {
		bookmarksContainer.querySelector('.all-content').innerHTML = '';
		selectAll(document, '.bmContainer').forEach((item) =>
			item.classList.remove('fill')
		);
		localStorage.removeItem('bookmarks');
		bmarkData.length = 0;
	};

	if (bmarkData) bmarkRender();
})();

// Menu Toggle Handle
(() => {
	const toolContainer = $('.tool-container');
	const toolMenu = $('.tool-btn');
	toolMenu.onclick = () => toolContainer.classList.toggle('active');
})();

// Theme select Handle
(() => {
	const themeList = [
		{ name: 'light', color: 'white' },
		{ name: 'dark', color: 'black' },
	];

	$('.theme-select').innerHTML = themeList
		.map(
			(item) =>
				`<div
					class="theme-item"
					data-theme="${item.name}"
					style="background-color:${item.color}">
				</div>`
		)
		.join('');

	$('.themeBtn').onclick = (e) => {
		e.stopPropagation();
		$('.theme-select').classList.toggle('active');
	};

	$$('.theme-item').forEach(
		(item) =>
			(item.onclick = (e) => {
				e.stopPropagation();
				document.body.setAttribute('data-theme', item.dataset.theme);
			})
	);

	document.body.onclick = () => $('.theme-select').classList.remove('active');
})();
