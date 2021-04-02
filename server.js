"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var blakejs_1 = require("blakejs");
var fs_1 = require("fs");
var https_1 = __importDefault(require("https"));
var stream_1 = require("stream");
var zlib_1 = __importDefault(require("zlib"));
Uint8Array.prototype['toHex'] = function () {
    var a = '0123456789abcdef';
    var o = '';
    for (var c = 0; c < this.length; ++c) {
        o += a[this[c] >> 4] + a[this[c] & 15];
    }
    return o;
};
function hash() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var c = blakejs_1.blake2sInit(27);
    for (var a in arguments) {
        var b = arguments[a];
        if (typeof b !== 'string') {
            if (typeof b === 'object') {
                var s = '';
                for (var n in b) {
                    s += hash(b[n]);
                }
                b = s;
            }
            else {
                b = '' + b;
            }
        }
        b = b.split('').map(function (a) { return a.charCodeAt(0); });
        blakejs_1.blake2sUpdate(c, b);
    }
    return blakejs_1.blake2sFinal(c)['toHex']();
}
var requestHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fn, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!(req.url.length > 54)) return [3 /*break*/, 4];
                fn = req.url.substr(req.url.length - 54);
                if (!awaiters[fn]) return [3 /*break*/, 2];
                _b = (_a = res)['write'];
                return [4 /*yield*/, awaiters[fn]()];
            case 1:
                _b.apply(_a, [_c.sent()]);
                res['end']();
                return [3 /*break*/, 3];
            case 2:
                res['end']('URL expired.');
                _c.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                res['writeHead'](302, {
                    Location: 'https://nasarachat.eu'
                });
                res['end']();
                _c.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); };
var httpserver = https_1.default.createServer({
    cert: fs_1.readFileSync('/etc/letsencrypt/live/nasarachat.eu/fullchain.pem'),
    key: fs_1.readFileSync('/etc/letsencrypt/live/nasarachat.eu/privkey.pem')
}, requestHandler);
var port = 20123;
httpserver.listen(port);
var io = require('socket.io')(httpserver, {
    cors: {
        origin: "https://nasarachat.eu",
        methods: ["GET", "POST"]
    }
});
var _a = (function () {
    var state = {
        users: {},
        keys: {},
        emails: {},
    };
    try {
        state = require('./state.json');
    }
    catch (e) { }
    return state;
})(), users = _a.users, keys = _a.keys, emails = _a.emails;
function normalizeUsername(u) {
    u = ('' + u).toLowerCase();
    u = u.replace(/[^a-z]/g, '');
    return u;
}
var userSockets = {};
io.on('connection', function (socket) {
    socket.on('check_username_availability', function (u) {
        u = normalizeUsername(u);
        socket.emit('username_available', u, ((users[u] && 'Username taken') ||
            (u.length < 4 && 'Username too short') ||
            (u.length > 16 && 'Username too long')));
    });
    socket.on('register', function (username, hash, _a, email) {
        var priv = _a.priv, pub = _a.pub;
        if (typeof username !== 'string')
            return;
        if (typeof hash !== 'string')
            return;
        if (typeof priv !== 'string')
            return;
        if (typeof pub !== 'string')
            return;
        if (typeof email !== 'string')
            return;
        username = normalizeUsername(username);
        if (username.length < 4) {
            return socket.emit('register_response', username, false, 'Username too short');
        }
        if (username.length > 16) {
            return socket.emit('register_response', username, false, 'Username too long');
        }
        if (!hash.match(/^[a-f0-9]{54}$/))
            return;
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
        keys[hash] = { priv: priv, pub: pub };
        socket.emit('register_response', username, true);
        fs_1.writeFileSync('state.json', JSON.stringify({ users: users, emails: emails, keys: keys }));
    });
    socket.on('login', function (username, hash) {
        if (typeof username !== 'string')
            return;
        if (typeof hash !== 'string')
            return;
        username = normalizeUsername(username);
        if (keys[hash]) {
            socket.emit('login_response', username, true, null, keys[hash]);
            userSockets[username] = socket;
        }
        else {
            socket.emit('login_response', username, false, 'Incorrent username or password.');
        }
    });
    socket.on('get_username_from_email', function (email) {
        socket.emit('username_from_email', email, emails[email]);
    });
    socket.on('forgot_password', function (username, hash, _a, email) {
        var priv = _a.priv, pub = _a.pub;
        return __awaiter(void 0, void 0, void 0, function () {
            var coughtError, dothis;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (typeof username !== 'string')
                            return [2 /*return*/];
                        if (typeof hash !== 'string')
                            return [2 /*return*/];
                        if (typeof priv !== 'string')
                            return [2 /*return*/];
                        if (typeof pub !== 'string')
                            return [2 /*return*/];
                        if (typeof email !== 'string')
                            return [2 /*return*/];
                        username = normalizeUsername(username);
                        if (username.length < 4) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'Username too short')];
                        }
                        if (username.length > 16) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'Username too long')];
                        }
                        if (!hash.match(/^[a-f0-9]{54}$/))
                            return [2 /*return*/];
                        if (priv.length !== 1448) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'ERR_OPENPGP')];
                        }
                        if (pub.length !== 1120) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'ERR_OPENPGP')];
                        }
                        if (!email.length || !emails[email]) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'Email not registered.')];
                        }
                        if (!users[username]) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'User not found.')];
                        }
                        if (emails[email] !== username) {
                            return [2 /*return*/, socket.emit('register_response', username, false, 'Incorrect Username/E-mail combination.')];
                        }
                        socket.emit('forgot_password_await_email');
                        return [4 /*yield*/, new Promise(function (accept, reject) {
                                tryRestorePassword(username, email, hash, accept, reject);
                            })
                                .catch(function (e) { return coughtError = e; })];
                    case 1:
                        dothis = _b.sent();
                        if (dothis === 'ACCEPT') {
                            users[username] = pub;
                            emails[email] = username;
                            keys[hash] = { priv: priv, pub: pub };
                            socket.emit('forgot_password_response', username, true);
                            fs_1.writeFileSync('state.json', JSON.stringify({ users: users, emails: emails, keys: keys }));
                        }
                        else {
                            socket.emit('forgot_password_response', username, false, dothis.toString() || coughtError.toString() || 'E-mail verification failed.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    });
    socket.on('message', function (recipient, message) {
        if (typeof recipient !== 'string')
            return;
        if (typeof message !== 'string')
            return;
        var username = normalizeUsername(recipient);
        if (userSockets[username]) {
            userSockets[username].emit('message', message);
        }
    });
    socket.on('query_public_key', function (username) {
        if (typeof username !== 'string')
            return;
        username = normalizeUsername(username);
        if (users[username]) {
            socket.emit('public_key', username, users[username]);
        }
        else {
            socket.emit('public_key', username, false);
        }
    });
    socket.on('message-forward', function (recipient, sender, data) {
        recipient = normalizeUsername(recipient);
        sender = normalizeUsername(sender);
        if (userSockets[recipient]) {
            userSockets[recipient].emit('message-forward', sender, data);
        }
    });
    socket.on('users-suggest', function (name) {
        var users = Object.keys(userSockets);
        var user = normalizeUsername(name);
        if (!user)
            return;
        socket.emit('users-suggest', users.filter(function (a) { return a.includes(user); }).slice(0, 7));
    });
    socket.on('request-external-resource', function (uri) {
        try {
            if (typeof uri !== 'string') {
                return socket.emit('type-error');
            }
            var wr_1 = https_1.default.request('https://nasarachat.eu/user-content/external/upload', {
                method: 'PUT',
            }, function (res) {
                var b = '';
                res.on('data', function (d) { return b += d; });
                res.on('end', function () {
                    if (b.length === 64) {
                        socket.emit('declare-external-resource', uri, b);
                    }
                    else {
                        socket.emit('declare-external-resource', uri, false);
                    }
                });
            });
            var rr = https_1.default.request(uri, (function (res) {
                switch (res.headers['content-encoding']) {
                    case 'br':
                        stream_1.pipeline(res, zlib_1.default.createBrotliDecompress(), wr_1, console.log);
                        break;
                    case 'gzip':
                        stream_1.pipeline(res, zlib_1.default.createGunzip(), wr_1, console.log);
                        break;
                    case 'deflate':
                        stream_1.pipeline(res, zlib_1.default.createInflate(), wr_1, console.log);
                        break;
                    default:
                        stream_1.pipeline(res, wr_1, console.log);
                        break;
                }
            }));
            rr.end();
        }
        catch (e) { }
    });
});
var nodemailer = require('nodemailer');
var mailer;
var send_mail = function (mailopts) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (mailer) {
            return [2 /*return*/, mailer.sendMail(mailopts)];
        }
        else {
            return [2 /*return*/, Promise.resolve(process.env.CRED.split('_')).then(function (_a) {
                    var user = _a[0], pass = _a[1];
                    return mailer = nodemailer.createTransport({
                        host: 'smtp.seznam.cz',
                        port: 465,
                        secure: true,
                        auth: {
                            user: user, pass: pass,
                        }
                    });
                }).then(function (newmailer) { return newmailer.sendMail(mailopts); })];
        }
        return [2 /*return*/];
    });
}); };
send_mail({
    'from': 'nasarachat@seznam.cz',
    'to': 'nasarachat@seznam.cz',
    'subject': 'Starting NasaraChat.eu',
    'html': 'The server process has started.',
}).catch(console.log);
var awaiters = {};
function tryRestorePassword(username, email, newhash, accept, reject) {
    if (!username)
        return reject('Bad Username');
    if (!email)
        return reject('Bad Email');
    if (!email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/))
        return reject('Invalid E-Mail address');
    var ids = {
        change: hash(username, email, newhash, 'change'),
        deny: hash(username, email, newhash, 'deny'),
        delete: hash(username, email, newhash, 'delete'),
        timeout: hash(username, email, newhash, 'timeout'),
    };
    var clearAwaiters = function () {
        for (var a in ids) {
            delete awaiters[ids[a]];
        }
    };
    awaiters[ids.change] = function () {
        clearAwaiters();
        accept('ACCEPT');
        return 'Password changed successfully.';
    };
    awaiters[ids.deny] = function () {
        clearAwaiters();
        reject('The link saying "Deny password change" was clicked.');
        return 'Password NOT changed.';
    };
    awaiters[ids.delete] = function () {
        clearAwaiters();
        reject('Account deleted by link in e-mail.');
        if (users[emails[email]])
            delete users[emails[email]];
        if (emails[email])
            delete emails[email];
        return 'Account deleted.';
    };
    awaiters[ids.timeout] = function () {
        clearAwaiters();
        reject('You took over 4 minutes, request timed out.');
        return 'Request timed out.';
    };
    setTimeout(function () {
        if (awaiters[ids.timeout]) {
            awaiters[ids.timeout]();
        }
    }, 300000);
    mailer['sendMail']({
        'from': 'nasarachat@seznam.cz',
        'to': email,
        'subject': 'NasaraChat.eu Password Reset',
        'html': "<h1>Someone is trying to change your password on <a href=\"nasarachat.eu\">NasaraChat.eu</a></h1>"
            + "<br>"
            + ("<br>If this was you, and you requested this password change, click <a href=\"https://nasarachat.eu:" + port + "/change_password/" + ids.change + "\">here</a>.")
            + ("<br>If you wish to DENY this request, click <a href=\"https://nasarachat.eu:" + port + "/change_password/" + ids.deny + "\">here</a>.")
            + ("<br>You can also delete your account by clicking <a href=\"https://nasarachat.eu:" + port + "/change_password/" + ids.delete + "\">here</a>.")
            + "<br>"
            + ("<br>The above links are available until " + new Date(Date.now() + 290000))
            + "<br>"
            + "<br>Beware of phishing scams! Never enter any information on webpages you are sent via E-mail."
            + "<br>We will not ask you for your password."
            + "<br>"
            + "<br>Thank you for using NasaraChat."
    })
        .catch(function (e) {
        reject('Sending e-mail failed!');
        clearAwaiters();
    });
}
