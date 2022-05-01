'use strict';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const select = (par, child) => par.querySelector(child);
const selectAll = (par, child) => par.querySelectorAll(child);

// Storage Data
const storageData = {
	get: (_, key) => JSON.parse(_.getItem(key)),
	set: (_, key, val) => _.setItem(key, JSON.stringify(val)),
	del: (_, key) => _.removeItem(key),
};

let isAuth = storageData.get(sessionStorage, 'isAuth') || 0;
let thisUserId = storageData.get(sessionStorage, 'id') || 'null';
let thisUserName = storageData.get(sessionStorage, 'name') || 'null';
let thisUserPass = storageData.get(sessionStorage, 'pass') || 'null';
let thisUserHandle = storageData.get(sessionStorage, 'handle') || '';
let lastUpdateTime = storageData.get(localStorage, 'timeUpdate') || '';

// CF Link
const PBLEM_LINK = 'https://codeforces.com/problemset/problem/';
const PBLEM_SMIT = 'https://codeforces.com/contest';
const GET_CTEST_LINK = ({ contestId, index }) =>
	`${PBLEM_SMIT}/${contestId}/problem/${index}`;
const GET_SMIT_LINK = ({ contestId }) => `${PBLEM_SMIT}/${contestId}/submit`;

// API Link
const CF_TOOLKIT_API = {
	herokuLink: `https://cf-toolkit-api.herokuapp.com/api`,
	railwayLink: `https://cf-toolkit-api.up.railway.app/api`,
	test: `http://localhost:1811/api`,
};
const API_LINK = CF_TOOLKIT_API.railwayLink;

const CF_API_LINK = `https://codeforces.com/api`;
const CF_API = {
	contest: `${CF_API_LINK}/contest.list`,
	problem: `${CF_API_LINK}/problemset.problems`,
	user_info: `${CF_API_LINK}/user.info?handles=`,
	user_status: `${CF_API_LINK}/user.status?handle=`,
	user_rating: `${CF_API_LINK}/user.rating?handle=`,
};
const API_DATA = {
	problems: storageData.get(localStorage, 'problems') || {},
	bookmarks: [...(storageData.get(localStorage, 'bookmarks') || [])],
};

// Problem Status
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
const problemStatusList = [
	'OK',
	'TIME_LIMIT_EXCEEDED',
	'MEMORY_LIMIT_EXCEEDED',
	'COMPILATION_ERROR',
	'RUNTIME_ERROR',
	'FAILED',
	'WRONG_ANSWER',
];

// User Config
const thisUser = {
	name: thisUserName,
	pass: thisUserPass,
	id: thisUserId,
	handle: thisUserHandle,
};

// Elements
const bmNoFill = `<i class="bi bi-bookmarks"></i>`;
const bmFill = `<i class="bi bi-bookmarks-fill"></i>`;
const circleLoadingEle = `
<svg viewBox="25 25 50 50" class="circle-loading hide">
	<circle cx="50" cy="50" r="20" class="circle-loading"></circle>
</svg>`;

const loading = $('.loading');
const toolItems = $$('.tool-item');
const contents = $$('.main-content');
const stalkingContainer = $('.main-content.stalking');
const problemsetContainer = $('.main-content.problemset');
const bookmarksContainer = $('.main-content.bookmarks');
const extrasContainer = $('.main-content.extras');
const profileContainer = $('.main-content.profile');

let logInForm;
let logInPassInp;
let logInPassMode;
let logInBtn;
let errMsg;
let accountName;
let accountHandle;
let syncLocal;

// Variables
let listCnt = 0;
let newList = [];
let newListSize = 0;
let stalkingContent;
let stalkListCnt = 10;

const hideAll = (list) => list.forEach((item) => (item.style.display = 'none'));
const cvertDate = (date) => {
	const items = date.split(' ');
	items.length = 5;
	return `${items.pop()} , ${items.shift()} - ${items.join(' | ')}`;
};

const bmarksTrim = () => {
	API_DATA.bookmarks
		.sort((a, b) => {
			if (a?.contestId === b?.contestId) return a?.index < b?.index;
			return a?.contestId > b?.contestId;
		})
		.map((_, i, arr) => {
			for (let j = i + 1; j < arr.length; j++)
				if (
					arr[j]?.contestId === _?.contestId &&
					arr[j]?.index === _?.index
				)
					arr.splice(j, 1);
		});
};
const getBmarkData = async ({ name, pass }) => {
	const res = await fetch(`${API_LINK}/bookmarks/list/${name}/${pass}`);
	const data = await res.json();
	API_DATA.bookmarks = [...API_DATA.bookmarks, ...data];
	bmarksTrim();
	bmarkRender();
};
const bmarkRender = () => {
	const bookmarks = select(bookmarksContainer, '.all-content');
	bookmarks.innerHTML = API_DATA.bookmarks
		.map((item) => {
			if (!item?.contestId) return;

			const pblemId = '' + item?.contestId + item?.index.charCodeAt(0);
			const pblemTags = item?.tags.map((item) => item).join(', ');
			return `
			<div
				class="bmark-item"
				data-id="${'' + item?.contestId + item?.index.charCodeAt(0)}"
				data-problemid="${pblemId}"
				data-contestid="${item?.contestId}"
				data-name="${item?.name}"
				data-index="${item?.index}"
				data-rating="${item?.rating || 0}"
				data-tags="${pblemTags}"
			>
				<i class="bi bi-x-circle" onclick="bmarkDelete(event)"></i>
				${item?.data}
			</div>`;
		})
		.join('');
	storageData.set(localStorage, 'bookmarks', API_DATA.bookmarks);
};
const bmarkDelete = (e) => {
	e.stopPropagation();
	const bmItem = e.target.closest('.bmark-item');

	// Remove from data
	API_DATA.bookmarks.forEach((item, idx) => {
		if (item.id !== bmItem.dataset.id) return;
		const { contestId, index } = item;

		if (!confirm('Delete this bookmark ?')) return;

		API_DATA.bookmarks.splice(idx, 1);

		const { name, pass } = thisUser;
		if (name !== 'null' && pass !== 'null') {
			fetch(
				`${API_LINK}/bookmarks/del/${name}/${pass}/${contestId}/${index}`
			)
				.then(() => {
					// console.log('Success');
				})
				.catch(console.error);
		}
	});
	bmarkRender();

	// Remove from UI
	const delList = selectAll(
		document,
		`.problem-item[data-problemid="${bmItem.dataset.id}"] .bmContainer`
	);
	delList.forEach((_) => _.classList.remove('fill'));
};
const bmarksHandle = (e) => {
	const thisItem = e.currentTarget;
	const pblemItem = thisItem.closest('.problem-item');
	const data = {
		contestId: +pblemItem.dataset.contestid,
		data: pblemItem.innerHTML,
		id: pblemItem.dataset.problemid,
		index: pblemItem.dataset.index,
		name: pblemItem.dataset.name,
		rating: +pblemItem.dataset.rating,
		tags: pblemItem.dataset.tags.split(', '),
	};

	thisItem.classList.toggle('fill');
	if (thisItem.className.includes('fill')) {
		if (
			!API_DATA.bookmarks.some(
				(_) => _.id === pblemItem.dataset.problemid
			)
		) {
			API_DATA.bookmarks.push(data);

			const { name, pass } = thisUser;
			if (name !== 'null' && pass !== 'null') {
				// console.log(data);
				fetch(`${API_LINK}/bookmarks/add/${name}/${pass}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				})
					.then(() => {
						// console.log('Success');
					})
					.catch(console.error);
			}
		}
	} else {
		API_DATA.bookmarks.forEach((_, index) => {
			if (_.id === pblemItem.dataset.problemid) {
				API_DATA.bookmarks.splice(index, 1);

				if (!confirm('Delete this bookmark ?')) return;
				const { name, pass } = thisUser;
				if (name && pass) {
					fetch(
						`${API_LINK}/bookmarks/del/${name}/${pass}/${data.contestId}/${data.index}`
					)
						.then(() => {
							// console.log('Success');
						})
						.catch(console.error);
				}
			}
		});
	}
	bmarkRender();
};
const bmarksSyncLocal = (e) => {
	API_DATA.bookmarks = [
		...API_DATA.bookmarks,
		...storageData.get(localStorage, 'bookmarks'),
	];
	bmarksTrim();

	const { name, pass } = thisUser;
	if (name !== 'null' && pass !== 'null') {
		const accContainer = e.target.closest('.account-container');
		const loading = accContainer.querySelector('svg.circle-loading');

		loading?.classList.remove('hide');
		e.target.disabled = true;

		fetch(`${API_LINK}/bookmarks/add/${name}/${pass}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(API_DATA.bookmarks),
		})
			.then(() => {
				loading?.classList.add('hide');
				e.target.classList.add('success');
				setTimeout(() => {
					e.target.disabled = false;
					e.target.classList.remove('success');
				}, 1200);
			})
			.catch((err) => {
				console.error(err);

				loading?.classList.add('hide');
				e.target.classList.add('fail');
				setTimeout(() => {
					e.target.disabled = false;
					e.target.classList.remove('fail');
				}, 1200);
			});
	}
};

const getProblemData = () => {
	const problemsetAllContent = select(problemsetContainer, '.all-content');
	problemsetAllContent.innerHTML = '';

	$('.timeUpdate').innerHTML = 'Syncing . . .';

	(async () => {
		const res = await fetch(CF_API.problem);
		const data = await res.json();
		const time = Date.now();

		API_DATA.problems = data.result;

		storageData.set(localStorage, 'problems', API_DATA.problems);
		storageData.set(localStorage, 'timeUpdate', time);

		$('.timeUpdate').innerHTML = 'Recently sync';
		setTimeout(
			() =>
				($('.timeUpdate').innerHTML = cvertDate(
					new Date(time).toString()
				)),
			1500
		);
	})();
};
const getList = (problems) => {
	const getTrimValue = (_, type = 0) =>
		type ? _.value.trim().toLowerCase() : _.value.trim();

	const nameSearch = $('#nameSearch');
	const tagSearch = $('#tagSearch');
	const ratingFrom = $('#ratingFrom');
	const ratingTo = $('#ratingTo');
	const contestSearch = $('#contestSearch');

	const nameSearchValue = getTrimValue(nameSearch, 1);
	const tagSearchValue = getTrimValue(tagSearch, 1);
	const ratingFromValue = Number(getTrimValue(ratingFrom));
	const ratingToValue = Number(getTrimValue(ratingTo));
	const contestSearchValue = getTrimValue(contestSearch);

	let problemList = Array.from(problems);

	if (nameSearchValue)
		problemList = problemList.filter(({ name }) =>
			name.toLowerCase().includes(nameSearchValue)
		);

	if (tagSearchValue)
		problemList = problemList.filter(({ tags }) =>
			tags.some((tag) => tagSearchValue.toLowerCase().includes(tag))
		);

	if (ratingFromValue || ratingToValue)
		problemList = problemList.filter(({ rating }) => {
			if (ratingFromValue && ratingToValue)
				return ratingFromValue <= rating && rating <= ratingToValue;
			if (ratingFromValue) return ratingFromValue <= rating;
			return rating <= ratingToValue;
		});

	if (contestSearchValue)
		problemList = problemList.filter(
			({ contestId }) => contestId == contestSearchValue
		);

	return problemList;
};
const getListHTMLS = (list, from = 0, to = 0) => {
	return list
		.slice(from, to)
		.map((item) => {
			const pblemId = item?.contestId + String(item?.index.charCodeAt(0));
			const pblemTags = item?.tags.map((item) => item).join(', ');
			const pblemRating = item?.rating || 'Unrated';
			const pblemStatus = API_DATA.bookmarks.some(
				(_) => _?.id === pblemId
			)
				? 'fill'
				: '';

			return `
		<div
			class="problem-item"
			data-problemid="${pblemId}"
			data-contestid="${item?.contestId}"
			data-name="${item?.name}"
			data-index="${item?.index}"
			data-rating="${item?.rating || 0}"
			data-tags="${pblemTags}"
		>
			<div class="bmContainer ${pblemStatus}" onclick="bmarksHandle(event)">
				${bmNoFill + bmFill}
			</div>
			<a
				class="in-contest-link" target="_blank" rel="noopener"
				href="${GET_CTEST_LINK(item)}">
				<i class="bi bi-box-arrow-in-up-right"></i>
			</a>
			<a
				class="submit-link" target="_blank" rel="noopener"
				href="${GET_SMIT_LINK(item)}">
				<i class="bi bi-code"></i>
			</a>
			<a
				class="content-item" target="_blank" rel="noopener"
				href="${PBLEM_LINK}/${item.contestId}/${item.index}">
				<div class="content-item__info">
					<span class="content-item__info-index">
						${item.index + ' - '}
					</span>
					<span class="content-item__info-name">
						${item.name}
					</span>
				</div>

				<div class="content-item__tags"> ${pblemTags} </div>
				<div class="content-item__rating">
					<span class="label">Rating:</span>
					<span class="rating"> ${pblemRating}</span>
				</div>
			</a>
		</div>`;
		})
		.join('');
};

const stalkRender = (data) => {
	stalkingContent = select(stalkingContainer, '.all-content');
	stalkingContent.innerHTML = '';
	data.forEach((user) => {
		stalkingContent.innerHTML += `
		<div class="userSubmissionStalk">
			<div class="problemDetail">
				<a
					class="problemName" target="_blank" rel="noopener"
					href="${GET_CTEST_LINK(user.problem)}"
				>${user.problem.name}</a>

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
			<div class="time" style="text-align: center">${cvertDate(
				new Date(user.creationTimeSeconds * 1000).toString()
			)}</div>
		</div>`;
	});
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
	if (listCnt >= newListSize) return;

	problemsetAllContent.innerHTML += `
		<button class="load-more" onclick="loadEvent(event)">Load More</button>`;
};
const stalkLoadEvent = (e) => {
	e.target.style.display = 'none';

	const searchBar = $('#stalkHandle');
	(async () => {
		const value = searchBar.value.trim();
		const response = await fetch(
			`${CF_API.user_status}${value}&from=${stalkListCnt + 1}&count=${
				stalkListCnt + 10
			}`
		);
		stalkListCnt += 10;
		const data = await response.json();
		stalkRender(data.result);
		stalkingContent.innerHTML += `
		<button class="load-more" onclick="stalkLoadEvent(event)">Load More</button>`;
	})();
};

const inputAvoidSubmit = (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		e.stopPropagation();
	}
};
const logInHandle = async (e) => {
	e.preventDefault();

	const name = e.target.querySelector('.name').value.trim();
	const pass = e.target.querySelector('.pass').value.trim();
	if (!name || !pass) return;

	loading.classList.add('active');
	logInBtn.disabled = true;

	const res = await fetch(`${API_LINK}/users/auth/${name}/${pass}`);
	const { auth, id, handle } = await res.json();

	loading.classList.remove('active');
	logInBtn.disabled = false;

	let lastWrong;
	if (!auth) {
		errMsg.classList.add('isErr');
		lastWrong && clearTimeout(lastWrong);
		lastWrong = setTimeout(() => {
			errMsg.classList.remove('isErr');
		}, 3000);

		thisUser.name = '';
		thisUser.pass = '';
		thisUser.id = '';
		thisUser.handle = '';
	} else {
		profileContainer.classList.add('isAuth');
		accountName.innerHTML = name;
		accountHandle.value = handle;

		thisUser.name = name;
		thisUser.pass = pass;
		thisUser.id = id;
		thisUser.handle = handle;
		getBmarkData({ name, pass });
	}

	storageData.set(sessionStorage, 'id', id);
	storageData.set(sessionStorage, 'isAuth', auth);
	storageData.set(sessionStorage, 'name', thisUser.name);
	storageData.set(sessionStorage, 'pass', thisUser.pass);
	storageData.set(sessionStorage, 'handle', thisUser.handle);
};
const logOutHandle = () => {
	profileContainer.classList.remove('isAuth');

	thisUser.name = '';
	thisUser.pass = '';
	thisUser.id = '';
	thisUser.handle = '';

	storageData.set(sessionStorage, 'id', 'null');
	storageData.set(sessionStorage, 'isAuth', 0);
	storageData.set(sessionStorage, 'name', '');
	storageData.set(sessionStorage, 'pass', '');
	storageData.set(sessionStorage, 'handle', '');
};
const userHandleEdit = ({ target }) => {
	const handleValue = $('.account-handle-name').value.trim();
	if (!handleValue) return;

	target.disabled = true;
	fetch(
		`${API_LINK}/users/edit/${thisUser.id}/${thisUser.name}/${thisUser.pass}?_method=PUT`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ handle: handleValue }),
		}
	)
		.then(() => {
			target.classList.add('success');
			setTimeout(() => {
				target.disabled = false;
				target.classList.remove('success');
			}, 1200);

			storageData.set(sessionStorage, 'handle', handleValue);
		})
		.catch((err) => {
			console.error(err);

			target.classList.add('fail');
			setTimeout(() => {
				target.disable = false;
				target.classList.remove('fail');
			}, 1200);
		});
};

// Tool Items Handle
toolItems.forEach((item, index) => {
	item.onclick = function () {
		const lastToolActive = $('.tool-container .active');
		if (lastToolActive && lastToolActive !== this)
			lastToolActive.classList.remove('active');
		this.classList.add('active');

		hideAll(contents);
		contents[index].style.display = 'flex';
	};
});

// Problemset Handle
(() => {
	problemsetContainer.innerHTML = `
	<div class="header">
		<span class="title">Problemset</span>
	</div>
	<div class="timeUpdate">${
		lastUpdateTime
			? `Last update: ${cvertDate(new Date(lastUpdateTime).toString())}`
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

	API_DATA.problems?.problems || getProblemData();

	const problemsetAllContent = select(problemsetContainer, '.all-content');
	const searchBtn = select(problemsetContainer, '.search-container .submit');
	const randomBtn = select(problemsetContainer, '.search-container .random');

	searchBtn.onclick = (e) => {
		e.preventDefault();

		newList = getList(API_DATA.problems.problems);
		newListSize = newList.length;
		listCnt = newListSize <= 20 ? newListSize : 20;
		problemsetAllContent.innerHTML = getListHTMLS(newList, 0, listCnt);

		if (listCnt < newListSize)
			problemsetAllContent.innerHTML += `
			<button class="load-more" onclick="loadEvent(event)">Load More</button>`;
	};

	randomBtn.onclick = (e) => {
		e.preventDefault();

		let newList = getList(API_DATA.problems.problems);
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
	contestContainer.innerHTML = `
	<div class="header"><span>Contest List</span></div>
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

	fetch(CF_API.contest)
		.then((res) => res.json())
		.then((data) => {
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
		})
		.catch(() => {
			console.log('Contest ERR');
		});
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
	userContainer.innerHTML = `
	<div class="header"><span>User Info</span></div>
		<input placeholder="Search user by handle, split by ';'" type="text" id="handleSearch">
		${circleLoadingEle}
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
			const loadingSVG =
				userContainer.querySelector('svg.circle-loading');

			loadingSVG.classList.remove('hide');
			const response = await fetch(`${CF_API.user_info}${value}`);
			const data = await response.json();
			loadingSVG.classList.add('hide');

			renderUserInfo(data.result);
		})();
	};
})();

// User Rating Handle
(() => {
	const userRating = $('.main-content.rating');
	userRating.innerHTML = `
	<div class="header"><span>User Rating</span></div>
		<input placeholder="Show user's rating by handle" type="text" id="ratingHandleSearch">
		${circleLoadingEle}
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
			const loadingSVG = userRating.querySelector('svg.circle-loading');

			loadingSVG.classList.remove('hide');
			const response = await fetch(`${CF_API.user_rating}${value}`);
			const data = await response.json();
			loadingSVG.classList.add('hide');
			renderUserInfo(data.result?.reverse());
		})();
	};
})();

// User Stalking Handle
(() => {
	stalkingContainer.innerHTML = `
	<div class="header"><span>Stalking Mode</span></div>
	<div class="stalkTools">
		<input placeholder="Search user by handle" type="text" id="stalkHandle">
		<button class="clearStalkBtn">Clear</button>
		${circleLoadingEle}
	</div>
	<div class="all-content"></div>`;

	stalkingContent = select(stalkingContainer, '.all-content');
	const searchBar = $('#stalkHandle');
	searchBar.onkeydown = (e) => {
		if (e.keyCode !== 13) return;

		(async () => {
			const value = searchBar.value.trim();
			const loadingSVG =
				stalkingContainer.querySelector('svg.circle-loading');

			loadingSVG.classList.remove('hide');
			const response = await fetch(
				`${CF_API.user_status}${value}&from=1&count=10`
			);
			const data = await response.json();
			loadingSVG.classList.add('hide');
			stalkRender(data.result);
			stalkingContent.innerHTML += `
			<button class="load-more" onclick="stalkLoadEvent(event)">Load More</button>`;
		})();
	};

	$('.clearStalkBtn').onclick = () => (stalkingContent.innerHTML = '');
})();

// Bookmarks Handle
(() => {
	bookmarksContainer.innerHTML = `
	<div class="header"><span>Bookmarks</span></div>
	<div class="bmarkTools">
		<button class="clearBmarkBtn">Clear</button>
	</div>
	<div class="all-content"></div>`;

	$('.clearBmarkBtn').onclick = () => {
		if (!confirm('Delete all bookmarks ?')) return;

		const removeBookmarks = () => {
			bookmarksContainer.querySelector('.all-content').innerHTML = '';
			selectAll(document, '.bmContainer').forEach((item) =>
				item.classList.remove('fill')
			);
			storageData.del(localStorage, 'bookmarks');
			API_DATA.bookmarks.length = 0;
		};

		const { name, pass } = thisUser;
		if (name !== 'null' && pass !== 'null') {
			fetch(`${API_LINK}/bookmarks/clear/${name}/${pass}`)
				.then(() => {
					removeBookmarks();
				})
				.catch(console.error);
		} else removeBookmarks();
	};

	if (API_DATA.bookmarks) bmarkRender();
})();

// Extras Handle
(() => {
	extrasContainer.innerHTML = `
	<div class="header"><span>Extras</span></div>
	<div class="all-content">
		<div class="extra-container theme-container">
			<div class="extra-btn themeBtn">
				<i class="bi bi-palette"></i>
			</div>
			<div class="extra theme-select"></div>
		</div>

		<div class="extra-container calc-container">
			<div class="extra-btn calcBtn">
				<i class="bi bi-calculator"></i>
			</div>
			<form class="extra calc-simulator">
				<input type="text" id="inp-num"
					placeholder="Num list input - split by a comma"
				/>
				<input type="text" id="inp-operator"
					placeholder="Operator input - split by a comma"
				/>
				<div id="out-res"></div>
			</form>
		</div>

		<div class="extra-container graph-container">
			<a
				class="extra-btn graphBtn" target="_blank" rel="noopener"
				href="./graphEditor.html">
				<i class="bi bi-activity"></i>
				<span> Graph Editor (click here to open in the new tab)</span>
			</a>

			<iframe src="./graphEditor.html" width="100%" height="${innerHeight}"></iframe>
		</div>
	</div>`;

	const disableExtrasActive = () => {
		const allExtraActive = $$('div.extra-btn');
		allExtraActive.forEach((item) => item.classList.remove('active'));
	};

	// const extraBtnHandle = () => {
	// 	$$('div.extra-btn').forEach((item) => {
	// 		item.addEventListener('click', (e) => {
	// 			e.stopPropagation();
	// 			const lastStatus = item.className.includes('active');
	// 			disableExtrasActive();
	// 			item.classList.toggle('active', !lastStatus);
	// 		});
	// 	});
	// };
	const themeHandle = () => {
		const themeList = [
			{ name: 'light', color: 'white' },
			{ name: 'dark', color: 'black' },
		];

		$('.theme-select').innerHTML = themeList
			.map(
				(item) => `
				<div
					class="theme-item"
					data-theme="${item.name}"
					style="background-color:${item.color}">
				</div>`
			)
			.join('');

		$$('.theme-item').forEach((item) => {
			item.onclick = (e) => {
				e.stopPropagation();
				document.body.setAttribute('data-theme', item.dataset.theme);
			};
		});
	};
	const calcHandle = () => {
		const calcSimulator = $('.calc-simulator');
		const calcOutput = $('#out-res');
		const inpNum = $('#inp-num');
		const inpOperator = $('#inp-operator');
		calcSimulator.onclick = (e) => e.stopPropagation();
		calcSimulator.oninput = () => {
			if (!inpNum.value || !inpOperator.value) {
				calcOutput.innerHTML = '';
				return;
			}

			const numArray = inpNum.value
				.trim()
				.split(',')
				.map((item) => (item ? +item : 0));
			const opeArray = inpOperator.value.trim().split(',');
			const numArrayLth = numArray.length;

			let res = numArray[0];
			for (let i = 1; i < numArrayLth; i++) {
				switch (opeArray[i - 1]) {
					case '&':
						res &= numArray[i];
						break;
					case '|':
						res |= numArray[i];
						break;
					case '^':
						res ^= numArray[i];
						break;
					case '+':
						res += numArray[i];
						break;
					case '-':
						res -= numArray[i];
						break;
					case '*':
						res *= numArray[i];
						break;
					case '%':
						res %= numArray[i];
						break;
					case '/':
						if (numArray[i]) res /= numArray[i];
						else {
							calcOutput.innerHTML =
								'Error! Becareful when divide by 0';
							return;
						}
						break;
					default:
						calcOutput.innerHTML = 'Invalid operator input!';
						break;
				}
			}
			calcOutput.innerHTML = res;
		};
	};

	(() => {
		// extraBtnHandle();
		themeHandle();
		calcHandle();
	})();

	addEventListener('click', disableExtrasActive);
})();

// Menu Toggle Handle
(() => {
	const toolContainer = $('.tool-container');
	const toolMenu = $('.tool-btn');
	toolMenu.onclick = () => toolContainer.classList.toggle('active');
})();

// Profile Handle
(() => {
	const inputEvent = `onkeydown="inputAvoidSubmit(event)"`;

	if (isAuth) {
		profileContainer.classList.add('isAuth');
		getBmarkData({ name: thisUserName, pass: thisUserPass });
	}

	profileContainer.innerHTML = `
	<div class="header">
		<span class="log-in">Log in</span>
		<span class="is-auth">Welcome</span>
	</div>
	<form class="log-in-container">
		<input ${inputEvent} type="text" name="name" class="name" autocomplete="off" placeholder="User Name" />
		<div class="pass-container">
			<input
				${inputEvent}
				type="password" autocomplete="off"
				name="pass" class="pass" id="pass"
				placeholder="Password" />
			<label for="pass" class="pass-mode">
				<i class="bi bi-eye show"></i>
				<i class="bi bi-eye-slash hide"></i>
			</label>
		</div>
		<div class="err-msg">Check your account info</div>
		<button type="submit">
			<span> Log In </span>
		</button>
	</form>
	<div class="account-container">
		<div class="account-usage-container">
			<span class="account-name">${thisUser.name}</span>
			<button class="log-out" onclick="logOutHandle()">Log Out</button>
		</div>
		<div class="account-handle-container">
			<input class="account-handle-name" value="${thisUser.handle}"/>
			<button onclick="userHandleEdit(event)">Edit</button>
		</div>
		<button class="sync-local">Sync local bookmarks</button>
		${circleLoadingEle}
	</div>`;

	logInForm = select(profileContainer, 'form');
	logInPassInp = select(logInForm, 'input[name="pass"]');
	logInPassMode = select(logInForm, '.pass-mode');
	logInBtn = select(logInForm, 'button');
	errMsg = select(logInForm, '.err-msg');
	accountName = select(profileContainer, 'span.account-name');
	accountHandle = select(profileContainer, '.account-handle-name');
	syncLocal = select(profileContainer, 'button.sync-local');

	logInForm.onsubmit = logInHandle;
	logInPassMode.onclick = function () {
		this.classList.toggle('show');
		const isShow = this.className.includes('show');
		logInPassInp.type = isShow ? 'text' : 'password';
	};
	syncLocal.onclick = bmarksSyncLocal;
})();
