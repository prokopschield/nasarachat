"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = require("socket.io-client");
var localforage = require('localforage');
var _a = require("blakejs"), blake2sInit = _a.blake2sInit, blake2sUpdate = _a.blake2sUpdate, blake2sFinal = _a.blake2sFinal;
var constants = {
    profile_pic: {
        width: 360,
        height: 480
    }
};
Uint8Array.prototype['toHex'] = function () {
    var a = '0123456789abcdef';
    var o = '';
    for (var c = 0; c < this.length; ++c) {
        o += a[this[c] >> 4] + a[this[c] & 15];
    }
    return o;
};
var openpgp = window['openpgp'];
var defaultPageContext = 'page';
var Context;
(function (Context) {
    Context["signin"] = "signin.html";
    Context["signup"] = "signup.html";
    Context["forpwd"] = "forgotpassword.html";
    Context["header"] = "header.html";
    Context["footer"] = "footer.html";
    // main screen
    Context["main"] = "main.html";
    Context["search"] = "search.html";
    Context["notifications"] = "notifications.html";
    Context["settings"] = "settings.html";
    Context["chats"] = "chats.html";
    Context["chatscreen"] = "chatscreen.html";
    Context["newchat"] = "newchat.html";
    Context["group"] = "newgroup.html";
    Context["people"] = "contacts.html";
    Context["qrcode"] = "qrcode.html";
    Context["takephoto"] = "takephoto.html";
    Context["profilepic"] = "profilepic.html";
})(Context || (Context = {}));
function hash() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var c = blake2sInit(27);
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
        blake2sUpdate(c, b);
    }
    return blake2sFinal(c)['toHex']();
}
var socket = socket_io_client_1.io('wss://nasarachat.eu:20123');
var instance = {
    username: null,
    password: null,
    authenticated: false,
    keys: {
        priv: null,
        pub: null
    }
};
var assets = {};
function getAsset(asset) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!asset.includes('.')) {
                asset += '.html';
            }
            if (assets[asset]) {
                return [2 /*return*/, assets[asset]];
            }
            return [2 /*return*/, fetch('assets/' + asset)
                    .then(function (response) { return response.text(); })
                    .then(function (html) { return assets[asset] = html; })];
        });
    });
}
var loadedScreen = {};
function loadAsset(asset, cid) {
    if (cid === void 0) { cid = defaultPageContext; }
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!asset.includes('.')) {
                        asset += '.html';
                    }
                    _a = document.querySelector('#' + cid);
                    return [4 /*yield*/, getAsset(asset)];
                case 1:
                    _a.innerHTML = _b.sent();
                    loadedScreen[cid] = asset;
                    return [2 /*return*/];
            }
        });
    });
}
var screenCache = {};
var screenHistory = [];
function loadScreen(screen, cid, detail, back) {
    if (cid === void 0) { cid = defaultPageContext; }
    if (detail === void 0) { detail = 'null'; }
    if (back === void 0) { back = true; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, screenLast, detailLast, ctxElem;
        return __generator(this, function (_b) {
            _a = screenHistory.length ? screenHistory[screenHistory.length - 1] : [, ,], screenLast = _a[1], detailLast = _a[2];
            if (!screenCache[cid])
                screenCache[cid] = {};
            if (!screenCache[cid][screenLast])
                screenCache[cid][screenLast] = {};
            ctxElem = document.querySelector("#" + cid);
            screenCache[cid][screenLast][detailLast] = __spreadArrays(ctxElem.childNodes);
            screenCache[cid][screenLast][detailLast].forEach(function (e) { return ctxElem.removeChild(e); });
            if (!screenCache[cid][screen])
                screenCache[cid][screen] = {};
            if (screenCache[cid][screen][detail])
                screenCache[cid][screen][detail].forEach(function (e) { return ctxElem.appendChild(e); });
            else
                loadAsset(screen, cid);
            if (back)
                screenHistory.push([cid, screen, detail]);
            loadedScreen[cid] = screen;
            return [2 /*return*/];
        });
    });
}
function goBack() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, cid, screen_1, detail;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!instance.authenticated) return [3 /*break*/, 5];
                    if (!(screenHistory.length > 1)) return [3 /*break*/, 2];
                    _a = screenHistory[screenHistory.length - 2], cid = _a[0], screen_1 = _a[1], detail = _a[2];
                    return [4 /*yield*/, loadScreen(screen_1, cid, detail, false)];
                case 1:
                    _b.sent();
                    screenHistory.pop();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, loadScreen(Context.main, 'page', 'goBack')];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    if (!(screenHistory.length && (screenHistory[screenHistory.length - 1][2] !== 'goBack'))) return [3 /*break*/, 7];
                    return [4 /*yield*/, loadScreen(Context.signin, 'page', 'goBack', false)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
var keyfn = {
    generateKeypair: function (username, password) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, key, privateKeyArmored, publicKeyArmored, keypair;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, openpgp.generateKey({
                        userIds: [{ username: username }],
                        curve: 'p521',
                        passphrase: password
                    })];
                case 1:
                    _a = _b.sent(), key = _a.key, privateKeyArmored = _a.privateKeyArmored, publicKeyArmored = _a.publicKeyArmored;
                    keypair = {
                        priv: privateKeyArmored,
                        pub: publicKeyArmored,
                        key: key,
                    };
                    return [2 /*return*/, {
                            key: key,
                            keypair: keypair
                        }];
            }
        });
    }); }
};
var clickListeners = {
    'username': function (ce) {
        setKeyboardListener(function (ke) {
            setTimeout(function () {
                if (loadedScreen[defaultPageContext] == Context.signup) {
                    var u = ce.target['value'];
                    socket.emit('check_username_availability', u);
                    socket.once('username_available', function (u, a) {
                        if (u == ce.target['value'].toLowerCase().replace(/[^a-z]/g, '')) {
                            if (a) {
                                ce.target['style'].backgroundColor = "#ff0000";
                                var el = document.querySelector('#usernameBadReason');
                                if (!el) {
                                    el = document.createElement('span');
                                    el.id = 'usernameBadReason';
                                    ce.target['after'](el);
                                }
                                el.innerHTML = a;
                            }
                            else {
                                ce.target['style'].backgroundColor = "#ddffdd";
                                var el = document.querySelector('#usernameBadReason');
                                if (el) {
                                    el.innerHTML = 'Username available.';
                                }
                            }
                        }
                    });
                }
            }, 1);
        });
    },
    'sign_up': function (ce) { return __awaiter(void 0, void 0, void 0, function () {
        var username, password, email, _a, key, keypair;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    username = document.querySelector('#username')['value'];
                    password = document.querySelector('#password')['value'];
                    username = username.toLowerCase().replace(/[^a-z]/g, '');
                    password = hash(username, password);
                    email = document.querySelector('#email')['value'];
                    return [4 /*yield*/, keyfn.generateKeypair(username, password)];
                case 1:
                    _a = _b.sent(), key = _a.key, keypair = _a.keypair;
                    socket.emit('register', username, hash(username, password), keypair, email || '');
                    socket.once('register_response', function (username, success, failreason) {
                        if (failreason === 'ERR_OPENPGP') {
                            return clickListeners['sign_up'](ce);
                        }
                        if (success) {
                            instance.username = username;
                            instance.password = password;
                            instance.authenticated = true;
                            instance.keys = keypair;
                            loadScreen(Context.main);
                        }
                        else {
                            alert(failreason);
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); },
    'sign_in': function (ce) { return __awaiter(void 0, void 0, void 0, function () {
        var username, password;
        return __generator(this, function (_a) {
            username = document.querySelector('#username')['value'];
            password = document.querySelector('#password')['value'];
            username = username.toLowerCase().replace(/[^a-z]/g, '');
            password = hash(username, password);
            socket.emit('login', username, hash(username, password));
            socket.once('login_response', function (username, success, failreason, keypair) {
                if (success) {
                    instance.username = username;
                    instance.password = password;
                    instance.authenticated = true;
                    instance.keys = keypair;
                    loadScreen(Context.main);
                    openpgp.key.readArmored(keypair.priv)
                        .then(function (_a) {
                        var key = _a.keys[0];
                        key.decrypt(password)
                            .then(function () { return instance.keys.key = key; });
                    });
                }
                else {
                    alert(failreason);
                }
            });
            return [2 /*return*/];
        });
    }); },
    'new_account': function (ce) {
        loadScreen(Context.signup);
    },
    'existing_account': function (ce) {
        loadScreen(Context.signin);
    },
    'logout': function (ce) {
        loadScreen(Context.signin);
        instance.authenticated = false;
        instance.keys.priv = instance.keys.key = null;
    },
    'signup_create_new_account': function (ce) {
        loadScreen(Context.signup);
    },
    // forgotten password
    'forgot_password': function (ce) {
        loadScreen(Context.forpwd);
    },
    'ar': function (ce) {
        loadScreen(Context.signin);
    },
    'new_password': function (ce) { return __awaiter(void 0, void 0, void 0, function () {
        var email, password, fetched_username, email_not_registered, email_1, username, _a, key, keypair, email_not_registered;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    email = document.querySelector('#email')['value'];
                    password = document.querySelector('#create_new_password')['value'];
                    socket.emit('get_username_from_email', email);
                    return [4 /*yield*/, new Promise(function (accept, reject) {
                            socket.on('username_from_email', function (rec_email, username) {
                                if ((rec_email === email) && username) {
                                    accept(username);
                                }
                                else {
                                    reject('This e-mail is not registered!');
                                }
                            });
                        })
                            .catch(console.log)];
                case 1:
                    fetched_username = _b.sent();
                    if (!fetched_username) {
                        email_not_registered = document.querySelector('#email_not_registered');
                        if (!email_not_registered) {
                            email_not_registered = document.createElement('span');
                            email_not_registered.id = 'email_not_registered';
                            email_not_registered['style'] = 'color: red';
                            email_1 = document.querySelector('#email');
                            email_1.after(email_not_registered);
                        }
                        email_not_registered.innerHTML = 'E-mail not registered!';
                        return [2 /*return*/];
                    }
                    username = fetched_username.toString().toLowerCase().replace(/[^a-z]/g, '');
                    password = hash(username, password);
                    return [4 /*yield*/, keyfn.generateKeypair(username, password)];
                case 2:
                    _a = _b.sent(), key = _a.key, keypair = _a.keypair;
                    document.querySelector('#fill').children[1].innerHTML = 'Sending email...';
                    socket.emit('forgot_password', username, hash(username, password), keypair, email || '');
                    socket.once('forgot_password_await_email', function () {
                        document.querySelector('#fill').children[1].innerHTML = 'Check your e-mail!';
                        ;
                    });
                    {
                        email_not_registered = document.querySelector('#email_not_registered');
                        if (email_not_registered)
                            email_not_registered.innerHTML = '';
                    }
                    socket.once('forgot_password_response', function (username, success, failreason) {
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
                        }
                        else {
                            document.querySelector('#fill').children[1].innerHTML = (failreason);
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); },
    'profile_pic': function (ce) {
        return __awaiter(this, void 0, void 0, function () {
            var image_select_element, file, image, canvas, ctx, ratio, width, height, ocanvas, octx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image_select_element = document.createElement('input');
                        image_select_element.type = 'file';
                        image_select_element.click();
                        return [4 /*yield*/, new Promise(function (accept) {
                                image_select_element.onchange = function (e) {
                                    accept(file = e.target['files'][0]);
                                };
                            }).catch(console.log)];
                    case 1:
                        _a.sent();
                        if (!file)
                            return [2 /*return*/];
                        image = new Image();
                        image.crossOrigin = 'Anonymous';
                        return [4 /*yield*/, new Promise(function (accept) {
                                var reader = new FileReader();
                                reader.onload = function (readerEvent) {
                                    accept(image.src = readerEvent.target.result.toString());
                                };
                                reader.readAsDataURL(file);
                            }).catch(console.log)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, new Promise(function (accept) { return image.onload = accept; })];
                    case 3:
                        _a.sent();
                        canvas = document.createElement('canvas');
                        ctx = canvas.getContext('2d');
                        ratio = image.height / image.width;
                        if (ratio > 1.5) {
                            height = Math.min(image.height, constants.profile_pic.height);
                            width = height / ratio;
                        }
                        else {
                            width = Math.min(image.width, constants.profile_pic.width);
                            height = width * ratio;
                        }
                        canvas.height = height;
                        canvas.width = width;
                        ocanvas = document.createElement('canvas');
                        octx = ocanvas.getContext('2d');
                        ocanvas.width = image.width;
                        ocanvas.height = image.height;
                        octx.drawImage(image, 0, 0, ocanvas.width, ocanvas.height);
                        ctx.drawImage(ocanvas, 0, 0, ocanvas.width, ocanvas.height, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob(function (blob) {
                            fetch("/user-content/" + instance.username + "/profile.jpeg", {
                                method: 'PUT',
                                body: blob
                            })
                                .then(function (response) { return response.text(); })
                                .then(function (new_profile_picture) {
                                socket.emit('update_profile_pic', instance.username, new_profile_picture);
                                console.log("Uploaded new profile picture " + new_profile_picture);
                                socket.once('confirm_profile_pic', console.log);
                            });
                        }, 'image/jpeg');
                        return [2 /*return*/];
                }
            });
        });
    },
    back: goBack,
    page: function () { },
};
var bindings = __assign({ 
    // main screen
    mainscreen: Context.main, find_people: Context.search, notification: Context.notifications, settings: Context.settings, chatelement: Context.chats, addchatelement: Context.newchat, groupelement: Context.people, qrcodeelement: Context.qrcode, takephoto: Context.takephoto, profilepic: Context.profilepic }, Context);
var boundClickListener = function (ce) {
    loadScreen(bindings[ce['target']['id']]);
};
for (var e in bindings) {
    if (!clickListeners[e]) {
        clickListeners[e] = boundClickListener;
    }
}
var keyboardListener = function () { };
var setKeyboardListener = function (listener) {
    keyboardListener = listener;
};
((function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (instance.authenticated) {
            loadScreen(Context.main);
        }
        else {
            loadScreen(Context.signin);
        }
        loadScreen(Context.header, 'header');
        loadScreen(Context.footer, 'footer');
        return [2 /*return*/];
    });
}); })());
function clickListener(e) {
    e.preventDefault();
    if (clickListeners[e.target['id']]) {
        clickListeners[e.target['id']](e);
    }
    else {
        if (e.target['id']) {
            console.log('Click listener not defined for', e.target['id']);
        }
        if (e.target['parentElement']) {
            setImmediate(function () { return e.target['parentElement'].click(); });
        }
    }
}
document.body.addEventListener('click', clickListener, true);
document.body.addEventListener('keyup', function (e) { return keyboardListener(e); }, true);
window['nasara'] = {
    loadAsset: loadScreen,
    keyfn: keyfn,
    sendMessage: sendMessage,
};
var forageInstances = {};
function storage(name) {
    if (name === void 0) { name = 'global'; }
    if (!forageInstances[name]) {
        forageInstances[name] = localforage.createInstance({
            name: name
        });
    }
    if (storage[name])
        return storage[name];
    return storage[name] = {
        store: function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, forageInstances[name].setItem(key, value)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        },
        fetch: function (key) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, forageInstances[name].getItem(key)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        },
        swap: function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                var ret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, forageInstances[name].getItem(key)];
                        case 1:
                            ret = _a.sent();
                            forageInstances[name].setItem(key, value);
                            return [2 /*return*/, ret];
                    }
                });
            });
        },
    };
}
Object.assign(storage, storage());
function normalizeUsername(u) {
    u = ('' + u).toLowerCase();
    u = u.replace(/[^a-z]/g, '');
    return u;
}
function queryPublicKey(user) {
    return __awaiter(this, void 0, void 0, function () {
        var pubkey, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = normalizeUsername(user);
                    return [4 /*yield*/, storage('pubkey').fetch(user)];
                case 1:
                    pubkey = _a.sent();
                    if (pubkey) {
                        return [2 /*return*/, pubkey];
                    }
                    socket.emit('query_public_key', user);
                    return [4 /*yield*/, new Promise(function (accept) { return socket.once('public_key', function () {
                            var res = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                res[_i] = arguments[_i];
                            }
                            return accept(res);
                        }); })];
                case 2:
                    res = _a.sent();
                    if (res[0] === user) {
                        if (res[1]) {
                            storage('pubkey').store(user, res[1]);
                            return [2 /*return*/, res[1]];
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                    }
                    else {
                        return [2 /*return*/, queryPublicKey(user)];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var pubKeyCache = {};
function getPublicKeyObj(pubkey) {
    return __awaiter(this, void 0, void 0, function () {
        var key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (pubKeyCache[pubkey]) {
                        return [2 /*return*/, pubKeyCache[pubkey]];
                    }
                    return [4 /*yield*/, openpgp.key.readArmored(pubkey)];
                case 1:
                    key = (_a.sent()).keys[0];
                    if (key) {
                        return [2 /*return*/, pubKeyCache[pubkey] = key];
                    }
                    else
                        return [2 /*return*/, false];
                    return [2 /*return*/];
            }
        });
    });
}
function sendMessage(to, message) {
    return __awaiter(this, void 0, void 0, function () {
        var pubkey, encryptedMessage, _a, _b, transportedObject, transportMessage, _c, _d;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, queryPublicKey(to)];
                case 1:
                    pubkey = _g.sent();
                    if (!pubkey)
                        return [2 /*return*/];
                    _b = (_a = openpgp).encrypt;
                    _e = {
                        message: openpgp.message.fromText(JSON.stringify(message))
                    };
                    return [4 /*yield*/, getPublicKeyObj(pubkey)];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_e.publicKeys = [_g.sent()],
                            _e.privateKeys = [instance.keys.key],
                            _e)])];
                case 3:
                    encryptedMessage = (_g.sent()).data;
                    transportedObject = ({
                        sender: instance.username,
                        recipient: to,
                        message: encryptedMessage,
                    });
                    _d = (_c = openpgp).encrypt;
                    _f = {
                        message: openpgp.message.fromText(JSON.stringify(transportedObject))
                    };
                    return [4 /*yield*/, getPublicKeyObj(pubkey)];
                case 4: return [4 /*yield*/, _d.apply(_c, [(_f.publicKeys = [_g.sent()],
                            _f.privateKeys = [instance.keys.key],
                            _f)])];
                case 5:
                    transportMessage = (_g.sent()).data;
                    socket.emit('message', to, transportMessage);
                    return [2 /*return*/, true];
            }
        });
    });
}
socket.on('public_key', function (username, pubkey) {
    if (pubkey) {
        storage('pubkey').store(username, pubkey);
    }
});
socket.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var decrypted, _a, _b, error_1;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _b = (_a = openpgp).decrypt;
                _c = {};
                return [4 /*yield*/, openpgp.message.readArmored(message)];
            case 1: return [4 /*yield*/, _b.apply(_a, [(_c.message = _d.sent(),
                        _c.privateKeys = [instance.keys.key],
                        _c)])];
            case 2:
                decrypted = (_d.sent()).data;
                messageVerifier(JSON.parse(decrypted));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.log({
                    message: message, error: error_1
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
function messageVerifier(msgObject) {
    return __awaiter(this, void 0, void 0, function () {
        var message, recipient, sender, pubkey, decrypted, _a, _b, error_2;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (typeof msgObject !== 'object') {
                        return [2 /*return*/, console.log('Anonymous debug message:', msgObject)];
                    }
                    message = msgObject.message, recipient = msgObject.recipient, sender = msgObject.sender;
                    if (!message || !recipient || !sender) {
                        return [2 /*return*/, console.log('Received invalid message', msgObject)];
                    }
                    return [4 /*yield*/, queryPublicKey(normalizeUsername(sender))];
                case 1:
                    pubkey = _d.sent();
                    if (!pubkey || (typeof message !== 'string') || (recipient !== instance.username)) {
                        return [2 /*return*/, console.log('Received invalid message', msgObject)];
                    }
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 6, , 7]);
                    _b = (_a = openpgp).decrypt;
                    _c = {};
                    return [4 /*yield*/, openpgp.message.readArmored(message)];
                case 3:
                    _c.message = _d.sent();
                    return [4 /*yield*/, getPublicKeyObj(pubkey)];
                case 4: return [4 /*yield*/, _b.apply(_a, [(_c.publicKeys = [_d.sent()],
                            _c.privateKeys = [instance.keys.key],
                            _c)])];
                case 5:
                    decrypted = (_d.sent()).data;
                    messageHandler(sender, JSON.parse(decrypted));
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _d.sent();
                    console.log({
                        msgObject: msgObject, message: message, recipient: recipient, sender: sender, error: error_2
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function messageHandler(sender, message) {
    console.log('Message received!', { sender: sender, message: message });
    if (typeof message === 'string') {
        // Add message receiver here!
    }
    else if (typeof message !== 'object') {
        console.log('Error: Invalid message received!', { sender: sender, message: message });
    }
    else {
        // Anything besides plaintext
    }
}
