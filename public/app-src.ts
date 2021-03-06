import { io } from "socket.io-client";
const localforage = require('localforage');

const {
	blake2sInit,
	blake2sUpdate,
	blake2sFinal
} = require("blakejs");

const constants = {
	profile_pic: {
		width: 360,
		height: 480
	}
}

Uint8Array.prototype['toHex'] = function() {
	const a = '0123456789abcdef';
	let o = '';
	for (let c = 0; c < this.length; ++c) {
		o += a[this[c] >> 4] + a[this[c] & 15];
	}
	return o;
}

const openpgp:any = window['openpgp'];
const showdown:any = window['showdown'];
const converter:any = window['converter'] = new showdown.Converter();

const defaultPageContext = 'page';

enum Context {
	signin = 'signin.html',
	signup = 'signup.html',
	forpwd = 'forgotpassword.html',
	header = 'header.html',
	footer = 'footer.html',

	// main screen
	main = 'main.html',
	search = 'search.html',
	notifications = 'notifications.html',
	settings = 'settings.html',
	chats = 'chats.html',
	chatscreen = 'chatscreen.html',
	newchat = 'newchat.html',
	group = 'newgroup.html',
	people = 'contacts.html',
	qrcode = 'qrcode.html',
	takephoto = 'takephoto.html',
	profilepic = 'profilepic.html',
}

enum ON_SCREEN_ELEMENTS {
	SEND_MESSAGE_BUTTON = 'send',
}

function getOnScreenElement(element: string): Element|null {
	return document.querySelector(`#${element}`);
}

function hash(...args: Array<any>) {
	const c = blake2sInit(27);
	for (const a in arguments) {
		let b = arguments[a];
		if (typeof b !== 'string') {
			if (typeof b === 'object') {
				let s = '';
				for (const n in b) {
					s += hash(b[n]);
				}
				b = s;
			} else {
				b = '' + b;
			}
		}
		b = b.split('').map((a: string)=>a.charCodeAt(0));
		blake2sUpdate(c, b);
	}
	return blake2sFinal(c)['toHex']();
}

const socket = io('wss://nasarachat.eu:20123');

interface Instance {
	username: string,
	password: string,
	authenticated: true | false,
	keys: Keys,
}

interface Keys {
	priv: string,
	pub: string,
	key?: any,
}

const instance: Instance = {
	username: null,
	password: null,
	authenticated: false,
	keys: {
		priv: null,
		pub: null
	}
};

const assets = {};

async function getAsset(asset: string) {
	if (!asset.includes('.')) {
		asset += '.html';
	}
	if (assets[asset]) {
		return assets[asset];
	}
	return fetch('assets/' + asset)
		.then(response => response.text())
		.then(html => assets[asset] = html);
}

const loadedScreen = {};

async function loadAsset(asset: string, cid: string = defaultPageContext) {
	if (!asset.includes('.')) {
		asset += '.html';
	}
	document.querySelector('#' + cid).innerHTML = await getAsset(asset);
	loadedScreen[cid] = asset;
}

const screenCache = {}

const screenHistory = [];

async function loadScreen(screen: Context, cid: string = defaultPageContext, detail: string = 'null', back: boolean = true) {
	let [ , screenLast, detailLast ] = screenHistory.length ? screenHistory[screenHistory.length - 1] : [,,];
	if (!screenCache[cid]) screenCache[cid] = {};
	if (!screenCache[cid][screenLast]) screenCache[cid][screenLast] = {};
	const ctxElem = document.querySelector(`#${cid}`);
	screenCache[cid][screenLast][detailLast] = [...ctxElem.childNodes];
	screenCache[cid][screenLast][detailLast].forEach((e: Element) => ctxElem.removeChild(e));

	if (!screenCache[cid][screen]) screenCache[cid][screen] = {};
	if (screenCache[cid][screen][detail])
		screenCache[cid][screen][detail].forEach((e: Element) => ctxElem.appendChild(e));
	else
		await loadAsset(screen, cid);
	
	if (back) screenHistory.push([cid, screen, detail]);
	loadedScreen[cid] = screen;
	if (onScreenLoad[screen]) {
		await onScreenLoad[screen](screen, cid, detail, back);
	}
}

const onScreenLoad = {
	[Context.main]: async (screen: Context, cid: string = defaultPageContext, detail: string = 'null', back: boolean = true) => {
		let profile_pic_div: HTMLDivElement = document.querySelector('#profile_pic');
		if (!profile_pic_div.childNodes.length) {
			let picture = get_profile_picture_element(instance.username);
			picture.classList.add('profile_picture_own');
			picture.classList.remove('profile_picture_friend');
			profile_pic_div.appendChild(picture);
		}
	},
}

async function goBack() {
	if (instance.authenticated) {
		if (screenHistory.length > 1) {
			let [cid, screen, detail] = screenHistory[screenHistory.length - 2];
			await loadScreen(screen, cid, detail, false);
			screenHistory.pop();
		} else {
			await loadScreen(Context.main, 'page', 'goBack');
		}
	} else if (screenHistory.length && (screenHistory[screenHistory.length - 1][2] !== 'goBack')) {
		await loadScreen(Context.signin, 'page', 'goBack');
	}
}

const keyfn = {
	generateKeypair: async (username: string, password: string) => {
		const {key, privateKeyArmored, publicKeyArmored} = await openpgp.generateKey({
			userIds: [{username}],
			curve: 'p521',
			passphrase: password
		});
		const keypair: Keys = {
			priv: privateKeyArmored,
			pub: publicKeyArmored,
			key,
		}

		return {
			key,
			keypair
		};
	}
}

const clickListeners = {
	'username': (ce: Event) => {
		setKeyboardListener((ke: Event) => {
			setTimeout(() => {
				if (loadedScreen[defaultPageContext] == Context.signup) {
					const u: string = ce.target['value'];
					socket.emit('check_username_availability', u);
					socket.once('username_available', (u: string, a: string) => {
						if (u == ce.target['value'].toLowerCase().replace(/[^a-z]/g, '')) {
							if (a) {
								ce.target['style'].backgroundColor = "#ff0000";
								let el = document.querySelector('#usernameBadReason');
								if (!el) {
									el = document.createElement('span');
									el.id = 'usernameBadReason';
									ce.target['after'](el);
								}
								el.innerHTML = a;
							} else {
								ce.target['style'].backgroundColor = "#ddffdd";
								let el = document.querySelector('#usernameBadReason');
								if (el) {
									el.innerHTML = 'Username available.';
								}
							}
						}
					})
				}
			}, 1)
		});
	},
	'sign_up': async (ce: Event) => {
		let username = document.querySelector('#username')['value'];
		let password = document.querySelector('#password')['value'];
		username = username.toLowerCase().replace(/[^a-z]/g, '');
		password = hash(username, password);
		let email = document.querySelector('#email')['value'];
		const {key, keypair} = await keyfn.generateKeypair(username, password);
		socket.emit('register', username, hash(username, password), keypair, email || '');
		socket.once('register_response', (username: string, success: boolean, failreason?: string) => {
			if (failreason === 'ERR_OPENPGP') {
				return clickListeners['sign_up'](ce);
			}
			if (success) {
				instance.username = username;
				instance.password = password;
				instance.authenticated = true;
				instance.keys = keypair;
				loadScreen(Context.main);
			} else {
				alert(failreason);
			}
		});
	},
	'sign_in': async (ce: Event) => {
		let username = document.querySelector('#username')['value'];
		let password = document.querySelector('#password')['value'];
		username = username.toLowerCase().replace(/[^a-z]/g, '');
		password = hash(username, password);
		socket.emit('login', username, hash(username, password));
		socket.once('login_response', (username: string, success: boolean, failreason?: string, keypair?: Keys) => {
			if (success) {
				instance.username = username;
				instance.password = password;
				instance.authenticated = true;
				instance.keys = keypair;
				loadScreen(Context.main);
				openpgp.key.readArmored(keypair.priv)
				.then(({keys: [key]}) => {
					key.decrypt(password)
					.then(() => instance.keys.key = key);
				})
			} else {
				alert(failreason);
			}
		});
	},
	'new_account': (ce: Event) => {
		loadScreen(Context.signup);
	},
	'existing_account': (ce: Event) => {
		loadScreen(Context.signin);
	},
	'logout': (ce: Event) => {
		loadScreen(Context.signin);
		instance.authenticated = false;
		instance.keys.priv = instance.keys.key = null;
	},
	'signup_create_new_account': (ce: Event) => {
		loadScreen(Context.signup);
	},

	// forgotten password
	'forgot_password': (ce: Event) => {
		loadScreen(Context.forpwd);
	},
	'ar': (ce: Event) => {
		loadScreen(Context.signin);
	},
	'new_password': async (ce: Event) => {
	//	let username = document.querySelector('#username')['value'];
		let email = document.querySelector('#email')['value'];
		let password = document.querySelector('#create_new_password')['value'];

		socket.emit('get_username_from_email', email);
		let fetched_username = await new Promise((accept, reject)=> {
			socket.on('username_from_email', (rec_email: string, username?: string | null) => {
				if ((rec_email === email) && username) {
					accept(username);
				} else {
					reject('This e-mail is not registered!');
				}
			});
		})
			.catch(console.log);
		if (!fetched_username) {
			let email_not_registered = document.querySelector('#email_not_registered');
			if (!email_not_registered) {
				email_not_registered = document.createElement('span');
				email_not_registered.id = 'email_not_registered';
				email_not_registered['style'] = 'color: red';
				const email = document.querySelector('#email');
				email.after(email_not_registered);
			}
			email_not_registered.innerHTML = 'E-mail not registered!';
			return;
		}
		const username = fetched_username.toString().toLowerCase().replace(/[^a-z]/g, '');

		password = hash(username, password);
		const {key, keypair} = await keyfn.generateKeypair(username, password);

		document.querySelector('#fill').children[1].innerHTML = 'Sending email...';

		socket.emit('forgot_password', username, hash(username, password), keypair, email || '');
		
		socket.once('forgot_password_await_email', () => {
			document.querySelector('#fill').children[1].innerHTML = 'Check your e-mail!';;
		});

		{
			// remove "email not registered"
			const email_not_registered = document.querySelector('#email_not_registered');
			if (email_not_registered) email_not_registered.innerHTML = '';
		}
		socket.once('forgot_password_response', (username: string, success: boolean, failreason?: string) => {
			if (failreason === 'ERR_OPENPGP') {
				return clickListeners['new_password'](ce);
			}
			if (success) {
				instance.username = username;
				instance.password = password;
				instance.authenticated = true;
				instance.keys = keypair;
				loadScreen(Context.main);
				alert('Password changed.');
			} else {
				document.querySelector('#fill').children[1].innerHTML = (failreason);
			}
		});
	},
	
	'profile_pic': profilePictureDialog,

	pic: profilePictureDialog,

	back: goBack,
	
	page () {}, // no action needed when user simply clicks the background

	async find_people () {
		await loadScreen(Context.search);
		const searchbox: HTMLTextAreaElement = document.querySelector('#searchpeople');
		setKeyboardListener((e: KeyboardEvent) => {
			setTimeout(() => {
				socket.emit('users-suggest', searchbox.value);
				socket.once('users-suggest', (list: string[]) => {
					const sresl = document.querySelector('#search_scroll');
					for (let i=0; i<list.length; ++i) {
						const ename = `user-suggestion-${i}`;
						const el: HTMLDivElement = sresl.querySelector(`#${ename}`);
						if (el) {
							el.querySelector('.user-suggestion-username').innerHTML = list[i];
						} else {
							const div = document.createElement('div');
							div.id = ename;
							div.className = 'user-suggestion';
							const span = document.createElement('span');
							span.className = 'user-suggestion-username';
							span.innerHTML = list[i];
							div.appendChild(span);
							sresl.appendChild(div);
						}
						clickListeners[ename] = async () => {
							await startChatWith(list[i]);
						}
					}
				});
			}, 100);
		});
	},

	newchat () {
		clickListeners.find_people();
	},

	chatscreen: startChatWith,

	send () {
		const textelem: HTMLInputElement = document.querySelector('#text');
		const text = textelem.value.trim();
		if (text) {
			add_chat_message(lastChatPerson, false, text);
			sendMessage(lastChatPerson, text);
		}
		textelem.value = '';
	},

	async image (ce: Event) {
		let image_select_element = document.createElement('input');
		image_select_element.type = 'file';
		image_select_element.click();
		let file: File;
		await new Promise((accept) => {
			image_select_element.onchange = (e) => {
				accept(file = e.target['files'][0]);
			}
		}).catch(console.log);
		
		if (!file) return;

		fetch(`/user-content/${instance.username}/chat-image.jpg`, {
			method: 'PUT',
			body: file
		})
		.then(response => response.text())
		.then((picture_hash) => {
			add_chat_message(lastChatPerson, false, `![Image you sent](/user-content/chat-image.jpg?img=${picture_hash})`);
			sendMessage(lastChatPerson, `![Image from ${instance.username}](/user-content/chat-image.jpg?img=${picture_hash})`);
		});
	},
};

const bindings = {
	// main screen
	mainscreen: Context.main,
	find_people: Context.search,
	notification: Context.notifications,
	settings: Context.settings,
	chatelement: Context.chats,
	addchatelement: Context.newchat,
	groupelement: Context.people,
	qrcodeelement: Context.qrcode,
	takephoto: Context.takephoto,
	profilepic: Context.profilepic,
	...Context
}

const boundClickListener = (ce: Event) => {
	loadScreen(bindings[ce['target']['id']]);
}

for (const e in bindings) {
	if (!clickListeners[e]) {
		clickListeners[e] = boundClickListener;
	}
}

let keyboardListener: Function = () => {};

const setKeyboardListener = (listener: Function) => {
	keyboardListener = listener;
}




((async () => {
	if (instance.authenticated) {
		loadScreen(Context.main);
	} else {
		loadScreen(Context.signin);
	}
	loadScreen(Context.header, 'header');
	loadScreen(Context.footer, 'footer');
})());

function clickListener(e: Event) {
	e.preventDefault();
	if (clickListeners[e.target['id']]) {
		clickListeners[e.target['id']](e);
	} else {

		if (e.target['id']) {
			console.log('Click listener not defined for', e.target['id']);
		}
		
		if (e.target['parentElement']) {
			setImmediate(() => e.target['parentElement'].click());
		}

	}
}

document.body.addEventListener('click', clickListener, true);
document.body.addEventListener('keyup', (e: Event) => keyboardListener(e), true);

window['nasara'] = {
	loadAsset: loadScreen,
	keyfn,
	sendMessage,
	profilePictureDialog,
	add_chat_message,
}

const forageInstances = {};

function storage(name: string = 'global') {
	if (!forageInstances[name]) {
		forageInstances[name] = localforage.createInstance({
			name
		});
	}
	if (storage[name]) return storage[name];
	return storage[name] = {
		async store (key: string, value: unknown) {
			return await forageInstances[name].setItem(key, value);
		},
		async fetch (key: string) {
			return await forageInstances[name].getItem(key);
		},
		async swap (key: string, value: unknown) {
			let ret = await forageInstances[name].getItem(key);
			forageInstances[name].setItem(key, value);
			return ret;
		},
	}
}

Object.assign(storage, storage());

function normalizeUsername(u: string) {
	u = ('' + u).toLowerCase();
	u = u.replace(/[^a-z]/g, '');
	return u;
}

async function queryPublicKey(user: string): Promise<string|false> {
	user = normalizeUsername(user);
	let pubkey: string = await storage('pubkey').fetch(user);
	if (pubkey) {
		return pubkey;
	}
	socket.emit('query_public_key', user);
	let res: string[] = await new Promise((accept) => socket.once('public_key', (...res: string[]) => accept(res)));
	if (res[0] === user) {
		if (res[1]) {
			storage('pubkey').store(user, res[1]);
			return res[1];
		} else {
			return false;
		}
	} else {
		return queryPublicKey(user);
	}
}

const pubKeyCache = {};

async function getPublicKeyObj(pubkey: string) {
	if (pubKeyCache[pubkey]) {
		return pubKeyCache[pubkey];
	}
	const [key] = (await openpgp.key.readArmored(pubkey)).keys;
	if (key) {
		return pubKeyCache[pubkey] = key;
	} else return false;
}

async function sendMessage(to: string, message: unknown): Promise<boolean> {
	let pubkey = await queryPublicKey(to);
	if (!pubkey) return;

	const { data: encryptedMessage } = await openpgp.encrypt({
		message: openpgp.message.fromText(JSON.stringify(message)),
		publicKeys: [ await getPublicKeyObj(pubkey) ],
		privateKeys: [ instance.keys.key ]
	});

	const transportedObject = ({
		sender: instance.username,
		recipient: to,
		message: encryptedMessage,
	});

	const { data: transportMessage } = await openpgp.encrypt({
		message: openpgp.message.fromText(JSON.stringify(transportedObject)),
		publicKeys: [ await getPublicKeyObj(pubkey) ],
		privateKeys: [ instance.keys.key ]
	});

	socket.emit('message', to, transportMessage);
	return true;
}

socket.on('public_key', (username: string, pubkey: string) => {
	if (pubkey) {
		storage('pubkey').store(username, pubkey);
	}
});

socket.on('message', async (message: string) => {
	try {
		const { data: decrypted } = await openpgp.decrypt({
			message: await openpgp.message.readArmored(message),
			privateKeys: [ instance.keys.key ]
		});
		messageVerifier(JSON.parse(decrypted));
	} catch(error) {
		console.log({
			message, error
		});
	}
});

interface MsgObject {
	message: string;
	recipient: string;
	sender: string;
}

async function messageVerifier(msgObject: MsgObject) {
	if (typeof msgObject !== 'object') {
		return console.log('Anonymous debug message:', msgObject);
	}
	let { message, recipient, sender } = msgObject;
	if (!message || !recipient || !sender) {
		return console.log('Received invalid message', msgObject);
	}
	let pubkey = await queryPublicKey(normalizeUsername(sender));
	if (!pubkey || (typeof message !== 'string') || (recipient !== instance.username)) {
		return console.log('Received invalid message', msgObject);
	}

	try {
		const { data: decrypted } = await openpgp.decrypt({
			message: await openpgp.message.readArmored(message),
			publicKeys: [ await getPublicKeyObj(pubkey) ],
			privateKeys: [ instance.keys.key ],
		});
		messageHandler(sender, JSON.parse(decrypted));

	} catch(error) {
		console.log({
			msgObject, message, recipient, sender, error
		});
	}
}

async function messageHandler(sender: string, message: any) {
	console.log('Message received!', {sender, message});
	if (typeof message === 'string') {
		// Add message receiver here!
		add_chat_message(sender, true, message);
	} else if (typeof message !== 'object') {
		console.log('Error: Invalid message received!', {sender, message});
	} else {
		// Anything besides plaintext
		switch(message.type) {
			case 'get_profile_picture': {
				sendMessage(sender, {
					type: 'set_profile_picture',
					picture: await loadProfilePicture(instance.username),
				});
				break;
			}
			case 'set_profile_picture': {
				if (message.picture) {
					setProfilePicture(sender, message.picture);
				}
				break;
			}
			default: {
				console.log('Unknown message object received:', {sender, ...message});
			}
		}
	}
}

interface ProfilePictureImageElementList {
	[username: string]: HTMLImageElement;
}
const profile_picture_image_elements: ProfilePictureImageElementList = {};

function get_profile_picture_element(username: string) {
	if (profile_picture_image_elements[username]) {
		return profile_picture_image_elements[username];
	} else {
		const picture = profile_picture_image_elements[username] = new Image();
		picture.classList.add('profile_picture');
		loadProfilePicture(username);
		return picture;
	}
}

async function setProfilePicture(username: string, picture: string): Promise<boolean> {
	if (typeof username !== 'string') return;
	if (typeof picture !== 'string') return;
	username = normalizeUsername(username);
	if (!picture.match(/[a-f0-9]{64}/)) return;
	return storage('profile_picture').store(username, picture)
	.then((ret: boolean) => {
		if (ret) {
			if (profile_picture_image_elements[username]) {
				profile_picture_image_elements[username].src = `/user-content/${username}/${picture}.jpg`;
				return true;
			}
		}
		return false;
	})
}

async function loadProfilePicture(username: string): Promise<string|void> {
	if (typeof username !== 'string') return;
	username = normalizeUsername(username);
	return storage('profile_picture').fetch(username)
	.then((picture: string | false) => {
		if (picture) {
			if (profile_picture_image_elements[username]) {
				profile_picture_image_elements[username].src = `/user-content/${username}/${picture}.jpg`;
				return picture;
			}
		} else if (username !== instance.username) {
			sendMessage(username, {
				type: 'get_profile_picture',
			});
		}
	})
}

async function profilePictureDialog (ce: Event) {
	let image_select_element = document.createElement('input');
	image_select_element.type = 'file';
	image_select_element.click();
	let file: File;
	await new Promise((accept) => {
		image_select_element.onchange = (e) => {
			accept(file = e.target['files'][0]);
		}
	}).catch(console.log);
	
	if (!file) return;

	let image = new Image();
	image.crossOrigin = 'Anonymous';

	await new Promise((accept) => {
		let reader = new FileReader();
		reader.onload = (readerEvent) => {
			accept(image.src = readerEvent.target.result.toString());
		}
		reader.readAsDataURL(file);
	}).catch(console.log);

	await new Promise((accept) => image.onload = accept);
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	let ratio = image.height / image.width;
	let width: number, height: number;
	if (ratio > 1.5) {
		height = Math.min(image.height, constants.profile_pic.height);
		width = height / ratio;
	} else {
		width = Math.min(image.width, constants.profile_pic.width);
		height = width * ratio;
	}
	canvas.height = height;
	canvas.width = width;
	let ocanvas = document.createElement('canvas');
	let octx = ocanvas.getContext('2d');
	ocanvas.width = image.width;
	ocanvas.height = image.height;
	octx.drawImage(image, 0, 0, ocanvas.width, ocanvas.height);
	ctx.drawImage(ocanvas, 0, 0, ocanvas.width, ocanvas.height, 0, 0, canvas.width, canvas.height);

	canvas.toBlob((blob) => {
		fetch(`/user-content/${instance.username}/profile.jpeg`, {
			method: 'PUT',
			body: blob
		})
		.then(response => response.text())
		.then((new_profile_picture) => {
			socket.emit('update_profile_pic', instance.username, new_profile_picture);
			console.log(`Uploaded new profile picture ${new_profile_picture}`);
			socket.once('confirm_profile_pic', console.log);
			setProfilePicture(instance.username, new_profile_picture);
		})
	}, 'image/jpeg')

}

let lastChatPerson = '';
async function startChatWith (user: string = lastChatPerson) {
	setKeyboardListener((e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			getOnScreenElement(ON_SCREEN_ELEMENTS.SEND_MESSAGE_BUTTON)?.['click']?.();
		}
	});
	if (typeof user !== 'string') {
		user = lastChatPerson;
	}
	if (!user) {
		return loadScreen(Context.chats);
	}
	lastChatPerson = user;
	await loadScreen(Context.chatscreen, defaultPageContext, user);
	document.querySelector('#Chatname').innerHTML = user;
	const piceld = document.querySelector('#chat_picture');
	for (const child of piceld.childNodes) {
		piceld.removeChild(child);
	}
	const profile_picture = get_profile_picture_element(user);
	profile_picture.classList.add('profile_picture_friend');
	profile_picture.classList.remove('profile_picture_own');
	piceld.appendChild(profile_picture);
	await loadProfilePicture(user);
}

const url_converter_cache: {
	[url: string]: string;
} = {};

async function get_uri_conversion (uri: string): Promise<string> {
	return `/user-content/external/${url_converter_cache[uri] || await request_uri_conversion(uri)}`;
}

async function request_uri_conversion (uri: string) {
	socket.emit('request-external-resource', uri);
	return expect_uri_conversion(uri);
}

async function expect_uri_conversion (uri: string): Promise<string> {
	return url_converter_cache[uri] || new Promise (resolve => socket.once('declare-external-resource', (ruri: string, hash: string) => {
		if (url_converter_cache[uri]) return resolve(url_converter_cache[uri]);
		if (uri === ruri) {
			resolve(url_converter_cache[uri] = hash);
		} else {
			expect_uri_conversion(uri).then(resolve);
		}
	}));
}

function clean_uri (uri: string) {
	return uri.replace(/[^a-z0-9]/gi, (m: string) => `&#${m.charCodeAt(0)};`);
}

async function add_chat_message (user: string, received: boolean, message: string) {
	var messagesDiv: HTMLDivElement;
	var goBackTo: string;
	if (user === lastChatPerson) {
		messagesDiv = document.querySelector('#chatscreen_scroll');
	} else if (screenCache[defaultPageContext]?.[Context.chatscreen]?.[user]) {
		messagesDiv = screenCache[defaultPageContext][Context.chatscreen][user].querySelector('#chatscreen_scroll');
	} else {
		goBackTo = lastChatPerson;
		await startChatWith(user);
		messagesDiv = document.querySelector('#chatscreen_scroll');
	}
	const match1 = message.match(/\(?https?\:\/\/[^ \)]*\)?/gi);
	const match2 = message.match(/\([^\(]+\:[^\)]+\)/gi);
	const URIs = (match1?.length) ? ((match2?.length) ? [...match1, ...match2] : match1) : match2 || [];
	await Promise.all(URIs.map(async (uri) => {
		while (uri[0] === '(') uri = uri.substr(1);
		while (uri[uri.length - 1] === ')') uri = uri.substr(0, uri.length - 1);
		const localuri = await get_uri_conversion(uri);
		while (message.includes(uri)) {
			message = message.replace(`](${uri})`, `](${localuri})`);
			message = message.replace(uri, `[${clean_uri(uri)}](${localuri})`);
		}
	}));
	message = message.replace(/[\<\>]/gi, (m: string) => `&#${m.charCodeAt(0)};`);
	const message_span = document.createElement('span');
	message_span.className = `chat_message ${received ? 'chat_message_left' : 'chat_message_right'}`;
	const html = converter.makeHtml(message);
	message_span.innerHTML = html;
	for (const child of message_span.querySelectorAll('*')) {
		if (child instanceof Element) {
			child.classList.add('chat_element', received ? 'chat_element_left' : 'chat_element_right');
		}
	}
	messagesDiv.appendChild(message_span);
	if (goBackTo) {
		goBack();
		startChatWith(goBackTo);
	}
}
