import {blake2sInit, blake2sUpdate, blake2sFinal} from "blakejs";
import { readFileSync, writeFileSync } from "fs";

Uint8Array.prototype['toHex'] = function() {
	const a = '0123456789abcdef';
	let o = '';
	for (let c = 0; c < this.length; ++c) {
		o += a[this[c] >> 4] + a[this[c] & 15];
	}
	return o;
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

const requestHandler = async (req: Request, res: Response) => {
	if (req.url.length > 54) {
		let fn = req.url.substr(req.url.length - 54);
		if (awaiters[fn]) {
			res['write'](await awaiters[fn]());
			res['end']();
		} else {
			res['end']('URL expired.');
		}
	} else {
		res['writeHead'](302, {
			Location: 'https://nasarachat.eu'
		});
		res['end']();
	}
}

const httpserver = require('https').createServer({
	cert: readFileSync('/etc/letsencrypt/live/nasarachat.eu/fullchain.pem'),
	key: readFileSync('/etc/letsencrypt/live/nasarachat.eu/privkey.pem')
}, requestHandler);

const port = 20123;
httpserver.listen(port);

const io = require('socket.io')(httpserver, {
	cors: {
		origin: "https://nasarachat.eu",
		methods: ["GET", "POST"]
	}
});

const {users, keys, emails} = (() => {
	let state = {
		users: {},
		keys: {},
		emails: {},
	};
	try {
		state = require('./state.json');
	} catch(e) {}
	return state;
})();

function normalizeUsername(u: string) {
	u = ('' + u).toLowerCase();
	u = u.replace(/[^a-z]/g, '');
	return u;
}

io.on('connection', (socket: any) => {
	socket.on('check_username_availability', (u: string) => {
		u = normalizeUsername(u);
		socket.emit('username_available', u, (
			(users[u] && 'Username taken') ||
			(u.length < 4 && 'Username too short') ||
			(u.length > 16 && 'Username too long')
		));
	});
	socket.on('register', (username: string, hash: string, {priv, pub}, email: string) => {
		if (typeof username !== 'string') return;
		if (typeof hash !== 'string') return;
		if (typeof priv !== 'string') return;
		if (typeof pub !== 'string') return;
		if (typeof email !== 'string') return;
		username = normalizeUsername(username);
		if (username.length < 4) {
			return socket.emit('register_response', username, false, 'Username too short');
		}
		if (username.length > 16) {
			return socket.emit('register_response', username, false, 'Username too long');
		}
		if (!hash.match(/^[a-f0-9]{54}$/)) return;
		if (priv.length !== 1448) {
			return socket.emit('register_response', username, false, 'ERR_OPENPGP');
		}
		if (pub.length !== 1120) {
			return socket.emit('register_response', username, false, 'ERR_OPENPGP');
		}
		if (email.length && emails[email]) {
			return socket.emit('register_response', username, false, 'Email already in use.');
		}
		if (users[username]) {
			return socket.emit('register_response', username, false, 'Username already in use.');
		}

		users[username] = pub;
		emails[email] = username;
		keys[hash] = {priv, pub};
		
		socket.emit('register_response', username, true)

		writeFileSync('state.json', JSON.stringify({users, emails, keys}));
	});
	socket.on('login', (username: string, hash: string) => {
		
		if (typeof username !== 'string') return;
		if (typeof hash !== 'string') return;

		username = normalizeUsername(username);

		if (keys[hash]) {
			socket.emit('login_response', username, true, null, keys[hash]);
		} else {
			socket.emit('login_response', username, false, 'Incorrent username or password.');
		}
	});
	socket.on('get_username_from_email', (email: string) => {
		socket.emit('username_from_email', email, emails[email]);
	});
	socket.on('forgot_password', async (username: string, hash: string, {priv, pub}, email: string) => {
		if (typeof username !== 'string') return;
		if (typeof hash !== 'string') return;
		if (typeof priv !== 'string') return;
		if (typeof pub !== 'string') return;
		if (typeof email !== 'string') return;
		username = normalizeUsername(username);
		if (username.length < 4) {
			return socket.emit('register_response', username, false, 'Username too short');
		}
		if (username.length > 16) {
			return socket.emit('register_response', username, false, 'Username too long');
		}
		if (!hash.match(/^[a-f0-9]{54}$/)) return;
		if (priv.length !== 1448) {
			return socket.emit('register_response', username, false, 'ERR_OPENPGP');
		}
		if (pub.length !== 1120) {
			return socket.emit('register_response', username, false, 'ERR_OPENPGP');
		}
		if (!email.length || !emails[email]) {
			return socket.emit('register_response', username, false, 'Email not registered.');
		}
		if (!users[username]) {
			return socket.emit('register_response', username, false, 'User not found.');
		}
		if (emails[email] !== username) {
			return socket.emit('register_response', username, false, 'Incorrect Username/E-mail combination.');
		}
		
		socket.emit('forgot_password_await_email');

		let coughtError: any;

		const dothis = await new Promise((accept, reject) => {
			tryRestorePassword(username, email, hash, accept, reject);
		})
			.catch(e => coughtError = e);

		if (dothis === 'ACCEPT') {
			users[username] = pub;
			emails[email] = username;
			keys[hash] = {priv, pub};
			
			socket.emit('forgot_password_response', username, true)

			writeFileSync('state.json', JSON.stringify({users, emails, keys}));
		} else {
			socket.emit('forgot_password_response', username, false, dothis.toString() || coughtError.toString() || 'E-mail verification failed.');
		}
	});
});

interface MailOpts {
	from: string,
	to: string,
	subject: string,
	html?: string,
	text?: string
}

const nodemailer = require('nodemailer');
let mailer: any;
const send_mail = async (mailopts: MailOpts) => {
	if (mailer) {
		return mailer.sendMail(mailopts);
	} else {
		return Promise.resolve(process.env.CRED.split('_')).then(([user, pass]) => {
			return mailer = nodemailer.createTransport({
				host: 'smtp.seznam.cz',
				port: 465,
				secure: true,
				auth: {
					user, pass,
				}
			});
		}).then(newmailer => newmailer.sendMail(mailopts));
	}
}

send_mail({
	'from': 'nasarachat@seznam.cz',
	'to': 'nasarachat@seznam.cz',
	'subject': 'Starting NasaraChat.eu',
	'html': 'The server process has started.',
}).catch(console.log);

let awaiters = {};

function tryRestorePassword (username: string, email: string, newhash: string, accept: Function, reject: Function) {

	if (!username) return reject('Bad Username');
	if (!email) return reject('Bad Email');
	if (!email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) return reject('Invalid E-Mail address');

	const ids = {
		change: hash(username, email, newhash, 'change'),
		deny: hash(username, email, newhash, 'deny'),
		delete: hash(username, email, newhash, 'delete'),
		timeout: hash(username, email, newhash, 'timeout'),
	};

	const clearAwaiters = () => {
		for (const a in ids) {
			delete awaiters[ids[a]];
		}
	}

	awaiters[ids.change] = () => {
		clearAwaiters();
		accept('ACCEPT');
		return 'Password changed successfully.';
	}

	awaiters[ids.deny] = () => {
		clearAwaiters();
		reject('The link saying "Deny password change" was clicked.');
		return 'Password NOT changed.';
	}

	awaiters[ids.delete] = () => {
		clearAwaiters();
		reject('Account deleted by link in e-mail.');
		if (users[emails[email]]) delete users[emails[email]];
		if (emails[email]) delete emails[email];
		return 'Account deleted.';
	}

	awaiters[ids.timeout] = () => {
		clearAwaiters();
		reject('You took over 4 minutes, request timed out.');
		return 'Request timed out.';
	}

	setTimeout(() => {
		if (awaiters[ids.timeout]) {
			awaiters[ids.timeout]();
		}
	}, 300000);

	mailer['sendMail']({
		'from': 'nasarachat@seznam.cz',
		'to': email,
		'subject': 'NasaraChat.eu Password Reset',
		'html': `<h1>Someone is trying to change your password on <a href="nasarachat.eu">NasaraChat.eu</a></h1>`
		+ `<br>`
		+ `<br>If this was you, and you requested this password change, click <a href="https://nasarachat.eu:${port}/change_password/${ids.change}">here</a>.`
		+ `<br>If you wish to DENY this request, click <a href="https://nasarachat.eu:${port}/change_password/${ids.deny}">here</a>.`
		+ `<br>You can also delete your account by clicking <a href="https://nasarachat.eu:${port}/change_password/${ids.delete}">here</a>.`
		+ `<br>`
		+ `<br>The above links are available until ${new Date(Date.now() + 290000)}`
		+ `<br>`
		+ `<br>Beware of phishing scams! Never enter any information on webpages you are sent via E-mail.`
		+ `<br>We will not ask you for your password.`
		+ `<br>`
		+ `<br>Thank you for using NasaraChat.`
	})
		.catch((e: Error) => {
			reject('Sending e-mail failed!');
			clearAwaiters();
		});
}