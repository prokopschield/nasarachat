import { io } from "socket.io-client";
const {
	blake2sInit,
	blake2sUpdate,
	blake2sFinal
} = require("blakejs");

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
const contexts = {
	signin: 'signin.html',
	signup: 'signup.html',
	header: 'header.html',
	footer: 'footer.html',

	// main screen
	main: 'main.html',
	search: 'search.html',
	notifications: 'notifications.html',
	settings: 'settings.html',
	chats: 'chats.html',
	newchat: 'newchat.html',
	group: 'newgroup.html',
	people: 'contacts.html',
	qrcode: 'qrcode.html',
	takephoto: 'takephoto.html',
	profilepic: 'profilepic.html',
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
	pub: string
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

const loadedAsset = {};

async function loadAsset(asset: string, cid: string = defaultPageContext) {
	if (!asset.includes('.')) {
		asset += '.html';
	}
	document.querySelector('#' + cid).innerHTML = await getAsset(asset);
	loadedAsset[cid] = asset;
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
			pub: publicKeyArmored
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
				if (loadedAsset[defaultPageContext] == contexts.signup) {
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
				loadAsset('main');
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
				loadAsset('main');
			} else {
				alert(failreason);
			}
		});
	},
	'new_account': (ce: Event) => {
		loadAsset('signup');
	},
	'existing_account': (ce: Event) => {
		loadAsset('signin');
	},
	'logout': (ce: Event) => {
		loadAsset('signin');
		instance.authenticated = false;
		instance.keys.priv = null;
	},
	'signup_create_new_account': (ce: Event) => {
		loadAsset('signup');
	},

	// forgotten password
	'forgot_password': (ce: Event) => {
		loadAsset('forgotpassword');
	},
	'ar': (ce: Event) => {
		loadAsset('signin');
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
				loadAsset('main');
				alert('Password changed.');
			} else {
				document.querySelector('#fill').children[1].innerHTML = (failreason);
			}
		});
	},
};

const bindings = {
	// main screen
	mainscreen: contexts.main,
	find_people: contexts.search,
	notification: contexts.notifications,
	settings: contexts.settings,
	chatelement: contexts.chats,
	addchatelement: contexts.newchat,
	groupelement: contexts.people,
	qrcodeelement: contexts.qrcode,
	takephoto: contexts.takephoto,
	profilepic: contexts.profilepic,
	...contexts
}

const boundClickListener = (ce: Event) => {
	loadAsset(bindings[ce['target']['id']]);
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
		loadAsset(contexts.main);
	} else {
		loadAsset(contexts.signin);
	}
	loadAsset(contexts.header, 'header');
	loadAsset(contexts.footer, 'footer');
})());

function clickListener(e: Event) {
	if (clickListeners[e.target['id']]) {
		clickListeners[e.target['id']](e);
	} else {
		console.log('Click listener not defined for', e.target['id']);
	}
}
/*
document.querySelector('#signup_create_new_account').addEventListener('click', (e: Event) => {
	e.preventDefault();
	loadAsset(contexts.signin);
}, true);*/
document.body.addEventListener('click', clickListener, true);
document.body.addEventListener('keyup', (e: Event) => keyboardListener(e), true);

window['nasara'] = {
	loadAsset,
	keyfn,
}