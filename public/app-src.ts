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
		loadAsset(screen, cid);
	
	if (back) screenHistory.push([cid, screen, detail]);
	loadedScreen[cid] = screen;
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
		await loadScreen(Context.signin, 'page', 'goBack', false);
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
	'profile_pic': async function (ce: Event) {
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

	},

	back: goBack,
	
	page () {}, // no action needed when user simply clicks the background
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
