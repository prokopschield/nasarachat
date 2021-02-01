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
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = require("socket.io-client");
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
var contexts = {
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
    chatscreen: 'chatscreen.html',
    newchat: 'newchat.html',
    group: 'newgroup.html',
    people: 'contacts.html',
    qrcode: 'qrcode.html',
    takephoto: 'takephoto.html',
    profilepic: 'profilepic.html',
};
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
var loadedAsset = {};
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
                    loadedAsset[cid] = asset;
                    return [2 /*return*/];
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
                        pub: publicKeyArmored
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
                if (loadedAsset[defaultPageContext] == contexts.signup) {
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
                            loadAsset('main');
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
                    loadAsset('main');
                }
                else {
                    alert(failreason);
                }
            });
            return [2 /*return*/];
        });
    }); },
    'new_account': function (ce) {
        loadAsset('signup');
    },
    'existing_account': function (ce) {
        loadAsset('signin');
    },
    'logout': function (ce) {
        loadAsset('signin');
        instance.authenticated = false;
        instance.keys.priv = null;
    },
    'signup_create_new_account': function (ce) {
        loadAsset('signup');
    },
    // forgotten password
    'forgot_password': function (ce) {
        loadAsset('forgotpassword');
    },
    'ar': function (ce) {
        loadAsset('signin');
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
                            loadAsset('main');
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
};
var bindings = __assign({ 
    // main screen
    mainscreen: contexts.main, find_people: contexts.search, notification: contexts.notifications, settings: contexts.settings, chatelement: contexts.chats, addchatelement: contexts.newchat, groupelement: contexts.people, qrcodeelement: contexts.qrcode, takephoto: contexts.takephoto, profilepic: contexts.profilepic }, contexts);
var boundClickListener = function (ce) {
    loadAsset(bindings[ce['target']['id']]);
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
            loadAsset(contexts.main);
        }
        else {
            loadAsset(contexts.signin);
        }
        loadAsset(contexts.header, 'header');
        loadAsset(contexts.footer, 'footer');
        return [2 /*return*/];
    });
}); })());
function clickListener(e) {
    if (clickListeners[e.target['id']]) {
        clickListeners[e.target['id']](e);
    }
    else {
        console.log('Click listener not defined for', e.target['id']);
    }
}
/*
document.querySelector('#signup_create_new_account').addEventListener('click', (e: Event) => {
    e.preventDefault();
    loadAsset(contexts.signin);
}, true);*/
document.body.addEventListener('click', clickListener, true);
document.body.addEventListener('keyup', function (e) { return keyboardListener(e); }, true);
window['nasara'] = {
    loadAsset: loadAsset,
    keyfn: keyfn,
};
