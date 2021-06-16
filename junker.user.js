// ==UserScript==
// @name           Krunker Junker
// @author         The Gaming Gurus
// @description    Junk in Your Krunk Guaranteed
// @version        1.1
// @license        gpl-3.0
// @namespace      https://greasyfork.org/users/704479
// @icon           https://y9x.github.io/webpack/junker/junker.png
// @grant          none
// @source         https://github.com/y9x/webpack/
// @supportURL     https://y9x.github.io/discord/
// @extracted      Wed, 16 Jun 2021 23:01:09 GMT
// @match          *://krunker.io/*
// @match          *://*.browserfps.com/*
// @match          *://linkvertise.com/*
// @run-at         document-start
// @noframes
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
 

var { api, meta, utils } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js"),
	vars = __webpack_require__(/*! ../libs/vars */ "../libs/vars.js"),
	Input = __webpack_require__(/*! ../libs/input */ "../libs/input.js"),
	Player = __webpack_require__(/*! ../libs/player */ "../libs/player.js"),
	Visual = __webpack_require__(/*! ./visual */ "./visual.js");

vars.load(__webpack_require__(/*! ./vars */ "./vars.js"));

class Main {
	constructor(){
		this.hooked = Symbol();
		
		this.utils = utils;
		
		this.eventHandlers();
		
		this.menu = __webpack_require__(/*! ./settings.js */ "./settings.js");
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
	async load(){
		utils.add_ele('style', document.documentElement, { textContent: __webpack_require__(/*! ./index.css */ "./index.css") });
		
		var self = this;
		
		this.input = new Input(this);
		
		this.visual = new Visual(this);
		
		this.y_offset_types = ['head', 'torso', 'legs'];
		
		this.y_offset_rand = 'head';
		
		setInterval(() => this.y_offset_rand = this.y_offset_types[~~(Math.random() * this.y_offset_types.length)], 2000);
		
		var token_promise = api.token(),
			config_promise = this.menu.load_config(),
			game_arg = {
				game: game => {
					this.game = utils.game = game;
					Object.defineProperty(game, 'controls', {
						configurable: true,
						set: controls => {
							// delete definition
							delete game.controls;
							
							var timer = 0;
							
							Object.defineProperty(controls, 'idleTimer', {
								get: _ => this.config.game.inactivity ? 0 : timer,
								set: value => timer = value,
							});
							
							return this.controls = utils.controls = game.controls = controls;
						},
					});
				},
				three(three){
					utils.three = three;
					
					self.mesh = new Proxy({}, {
						get(target, prop){
							if(!target[prop]) {
								target[prop] = new three.MeshBasicMaterial({
									transparent: true,
									fog: false,
									depthTest: false,
									color: prop,
								});
							}
							return target[prop] ;
						},
					});
				},
				set socket(socket){
					self.socket = socket;
					
					socket.send = new Proxy(socket.send, {
						apply(target, that, [type, ...msg]){
							if (type=="ah2") return;
							if (type=="en") {
								let data = msg[0];
								if (data) {
									main.skinData = Object.assign({}, {
										main: data[2][0],
										secondary: data[2][1],
										hat: data[3],
										body: data[4],
										knife: data[9],
										dye: data[14],
										waist: data[17],
									});
								}
							}

							return target.apply(that, [type, ...msg]);
						}
					})

					socket._dispatchEvent = new Proxy(socket._dispatchEvent, {
						apply(target, that, [type, ...msg]){
							if (type =="init") {
								let pInfo = msg[0];
								if(pInfo[10] && pInfo[10].bill && main.settings && main.settings.customBillboard.val.length > 1) {
									pInfo[10].bill.txt = main.settings.customBillboard.val;
								}
							}

							if (type=="0") {
								let pData = msg[0][0];
								let pSize = 39;
								while (pData.length % pSize !== 0) pSize++;
								for(let i = 0; i < pData.length; i += pSize) {
									if (pData[i] === socket.socketId||0) {
										pData[i + 12] = [main.skinData.main, main.skinData.secondary];
										pData[i + 13] = main.skinData.hat;
										pData[i + 14] = main.skinData.body;
										pData[i + 19] = main.skinData.knife;
										pData[i + 24] = main.skinData.dye;
										pData[i + 33] = main.skinData.waist;
									}
								}
							}
							
							return target.apply(that, [type, ...msg]);
						}
					});
				},
				world: world => utils.world = this.world = world,
				can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
				skins: ent => this.config.game.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
				timer: (object, property, timer) => Object.defineProperty(object, property, {
					get: _ => this.config.game.inactivity ? 0 : timer,
					set: value => this.config.game.inactivity ? Infinity : timer,
				}),
				input: this.input.push.bind(this.input),
				render(orig, overlay){
					self.overlay = overlay;
					
					self.visual.canvas = utils.canvas = document.querySelector('#game-overlay');
					
					self.visual.ctx = self.ctx = utils.canvas.getContext('2d');
					
					orig = orig.bind(overlay);
					
					overlay.render = function(...args){
						orig(...args);
						self.overlayRender(...args);
					};
				}
			};
		
		await config_promise;
		
		new Function('WP_fetchMMToken', vars.key, vars.patch(await api.source()))(token_promise, game_arg);
	}
	get config(){
		return this.menu.config;
	}
	overlayRender(scale){
		let width = utils.canvas.width / scale;
		let height = utils.canvas.height / scale;
		
		this.scale = scale;
		
		// this.ctx.scale(scale, scale);
		// this.ctx.clearRect(0, 0, width, height);
		this.visual.tick();
		
		if(this.config.aim.fov_box)this.visual.fov(this.config.aim.fov);
	
		if(this.game && this.world)for(let ent of this.game.players.list){
			let player = this.add(ent);
			
			if(player.is_you)this.player = player;
			
			if(!player.active)continue;
			
			player.tick();
			
			if(!player.frustum || player.is_you)continue;
			
			if(this.config.esp.tracers)this.visual.tracer(player);
			
			if(['box', 'box_chams', 'full'].includes(this.config.esp.status))this.visual.box(player);
			
			if(this.config.esp.status == 'full'){
				this.visual.health(player);
				this.visual.text(player);
			}
			
			this.visual.cham(player);
		}
		
		if(this.config.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send("k", 0);
	}
	dist2d(p1, p2){
		return utils.dist_center(p1.rect) - utils.dist_center(p2.rect);
	}
	pick_target(){
		return this.game.players.list.map(ent => this.add(ent)).filter(player => player.can_target).sort((p1, p2) => this.dist2d(p1, p2) * (p1.frustum ? 1 : 0.5))[0]
	}
	eventHandlers(){
		api.on_instruct = () => {	
			if(this.config.game.auto_lobby && api.has_instruct('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && api.has_instruct('to play') && (!this.player || !this.player.active)){
				this.controls.locklessChange(true);
				this.controls.locklessChange(false);
			}
		};
	}
};

var main = module.exports = new Main();

main.load();

/***/ }),

/***/ "./meta.js":
/*!*****************!*\
  !*** ./meta.js ***!
  \*****************/
/***/ ((module) => {

"use strict";


module.exports = {
	name: 'Krunker Junker',
	author: 'The Gaming Gurus',
	description: 'Junk in Your Krunk Guaranteed',
	version: '1.1',
	license: 'gpl-3.0',
	namespace: 'https://greasyfork.org/users/704479',
	icon: 'https://y9x.github.io/webpack/junker/junker.png',
	grant: 'none',
};

/***/ }),

/***/ "./settings.js":
/*!*********************!*\
  !*** ./settings.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var meta = __webpack_require__(/*! ./meta */ "./meta.js"),
	UIMenu = __webpack_require__(/*! ../libs/uimenu */ "../libs/uimenu/index.js"),
	DiscordAddon = __webpack_require__(/*! ../libs/uimenu/addons/discord */ "../libs/uimenu/addons/discord.js"),
	SettingsAddon = __webpack_require__(/*! ../libs/uimenu/addons/settings */ "../libs/uimenu/addons/settings.js"),
	menu = new UIMenu('Junk', meta.icon),
	{ api, utils, meta } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js"),
	doc_body = utils.wait_for(() => document.body);

UIMenu.keybinds.add({
	code: 'F1',
	interact(){
		document.exitPointerLock();
		menu.window.show();
	},
});

menu.load_addon(DiscordAddon, fetch(new URL('code.txt', meta.discord), { cache: 'no-store' }).then(res => res.text()));
menu.load_addon(SettingsAddon);

menu.add_preset('Default', {
	esp: {
		status: 'off',
		tracers: false,
		wireframe: false,
		rainbow: false,
	},
	color: {
		risk: '#FF7700',
		hostile: '#FF0000',
		friendly: '#00FF00',
	},
	aim: {
		status: 'off',
		auto_reload: false,
		fov: 60,
		hitchance: 100,
		offset: 'random',
		smooth: 0,
		wallbangs: false,
	},
	player: {
		bhop: 'off',
		skins: false,
	},
	ui: {
		show_adverts: false,
		show_streams: true,
		show_merch: true,
		show_news: true,
		show_cookie: true,
		show_button: true,
		css: '',
	},
	game: {
		custom_billboard: '',
		auto_nuke: false,
		auto_lobby: false,
		auto_start: false,
		inactivity: true,
	},
	radio: {
		stream: 'off',
		volume: 0.5,
	},
});

menu.add_preset('Assist', {
	aim: {
		status: 'assist',
		fov: 70,
		offset: 'random',
		smooth: 0.6,
	},
	player: {
		bhop: 'keyslide',
	},
});

menu.add_preset('Rage', {
	esp: {
		status: 'full',
		tracers: true,
	},
	aim: {
		status: 'auto',
		fov: 0,
		smooth: 0,
		auto_reload: true,
		wallbangs: true,
		offset: 'head',
	},
	player: {
		bhop: 'autoslide',
	},
});

var render = menu.window.add_tab('Render');

render.add_control({
	name: 'Draw FOV box',
	type: 'boolean',
	walk: 'aim.fov_box',
});

var esp = render.add_category('ESP');

esp.add_control({
	name: 'Mode',
	type: 'rotate',
	walk: 'esp.status',
	vals: [
		[ 'off', 'Off' ],
		[ 'box', 'Box' ],
		[ 'chams', 'Chams' ],
		[ 'box_chams', 'Box & chams' ],
		[ 'full', 'Full' ],
	],
});

esp.add_control({
	name: 'Hostile Color',
	type: 'color',
	walk: 'color.hostile',
});

esp.add_control({
	name: 'Risk Color',
	type: 'color',
	walk: 'color.risk',
});

esp.add_control({
	name: 'Friendly Color',
	type: 'color',
	walk: 'color.friendly',
});

esp.add_control({
	name: 'Tracers',
	type: 'boolean',
	walk: 'esp.tracers',
});

esp.add_control({
	name: 'Wireframe',
	type: 'boolean',
	walk: 'esp.wireframe',
});

esp.add_control({
	name: 'Rainbow Color',
	type: 'boolean',
	walk: 'esp.rainbow',
});

var ui = render.add_category('UI');

var css = utils.add_ele('link', document.documentElement, {
	rel: 'stylesheet',
});

ui.add_control({
	name: 'Custom CSS',
	type: 'textbox',
	walk: 'ui.css',
	placeholder: 'CSS Url',
}).on('change', value => {
	if(value != '')css.href = value;
});

ui.add_control({
	name: 'Show Menu Button ( [F1] to show )',
	type: 'boolean',
	walk: 'ui.show_button',
}).on('change', value => {
	if(value)menu.button.show();
	else menu.button.hide();
});

ui.add_control({
	name: 'Show Advertisments',
	type: 'boolean',
	walk: 'ui.show_adverts',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-adverts'));

ui.add_control({
	name: 'Show Streams',
	type: 'boolean',
	walk: 'ui.show_streams',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-streams'));

ui.add_control({
	name: 'Show Merch',
	type: 'boolean',
	walk: 'ui.show_merch',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-merch'));

ui.add_control({
	name: 'Show News Console',
	type: 'boolean',
	walk: 'ui.show_news',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-news'));

ui.add_control({
	name: 'Show Security Button',
	type: 'boolean',
	walk: 'ui.show_cookie',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-security'));

var weapon = menu.window.add_tab('Weapon');

weapon.add_control({
	name: 'Auto Reload',
	type: 'boolean',
	walk: 'aim.auto_reload',
});

var aimbot = weapon.add_category('Aimbot');

aimbot.add_control({
	name: 'Mode',
	type: 'rotate',
	walk: 'aim.status',
	vals: [
		[ 'off', 'Off' ],
		[ 'trigger', 'Triggerbot' ],
		[ 'correction', 'Correction' ],
		[ 'assist', 'Assist' ],
		[ 'auto', 'Automatic' ],
	],
});

aimbot.add_control({
	name: 'Offset',
	type: 'rotate',
	walk: 'aim.offset',
	vals: [
		[ 'head', 'Head' ],
		[ 'torso', 'Torso' ],
		[ 'legs', 'Legs' ],
		[ 'random', 'Random' ],
	],
});

aimbot.add_control({
	name: 'Smoothness',
	type: 'slider',
	walk: 'aim.smooth',
	range: [ 0, 1, 0.2 ],
});

aimbot.add_control({
	name: 'Hitchance',
	type: 'slider',
	walk: 'aim.hitchance',
	range: [ 10, 100, 5 ],
});

aimbot.add_control({
	name: 'FOV',
	type: 'slider',
	walk: 'aim.fov',
	range: [ 10, 110, 10 ],
	labels: { 110: 'Inf' },
});

aimbot.add_control({
	name: 'Wallbangs',
	type: 'boolean',
	walk: 'aim.wallbangs',
});

var player = menu.window.add_tab('Player');

player.add_control({
	name: 'Auto Bhop Mode',
	type: 'rotate',
	walk: 'player.bhop',
	vals: [
		[ 'off', 'Off' ],
		[ 'keyjump', 'Key jump' ],
		[ 'keyslide', 'Key slide' ],
		[ 'autoslide', 'Auto slide' ],
		[ 'autojump', 'Auto jump' ],
	],
});

player.add_control({
	name: 'Unlock Skins',
	type: 'boolean',
	walk: 'player.skins',
});

var game = menu.window.add_tab('Game');

game.add_control({
	name: 'Auto Activate Nuke',
	type: 'boolean',
	walk: 'game.auto_nuke',
});

game.add_control({
	name: 'Auto Start Match',
	type: 'boolean',
	walk: 'game.auto_start',
});

game.add_control({
	name: 'New Lobby Finder',
	type: 'boolean',
	walk: 'game.auto_lobby',
});

game.add_control({
	name: 'No Inactivity kick',
	type: 'boolean',
	walk: 'game.inactivity',
});

var radio = menu.window.add_tab('Radio');

radio.add_control({
	name: 'Stream',
	type: 'rotate',
	walk: 'radio.stream',
	vals: [
		[ 'off', 'Off' ],
		[ 'http://0n-2000s.radionetz.de/0n-2000s.aac', 'General German/English' ],
		[ 'https://stream-mixtape-geo.ntslive.net/mixtape2', 'Hip Hop / RNB' ],
		[ 'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2', 'Country' ],
		[ 'http://streaming.radionomy.com/A-RADIO-TOP-40', 'Dance' ],
		[ 'http://bigrradio.cdnstream1.com/5106_128', 'Pop' ],
		[ 'http://strm112.1.fm/ajazz_mobile_mp3', 'Jazz' ],
		[ 'http://strm112.1.fm/60s_70s_mobile_mp3', 'Golden Oldies' ],
		[ 'http://strm112.1.fm/club_mobile_mp3', 'Club' ],
		[ 'https://freshgrass.streamguys1.com/irish-128mp3', 'Folk' ],
		[ 'http://1a-classicrock.radionetz.de/1a-classicrock.mp3', 'Classic Rock' ],
		[ 'http://streams.radiobob.de/metalcore/mp3-192', 'Heavy Metal' ],
		[ 'http://stream.laut.fm/beatdownx', 'Death Metal' ],
		[ 'http://live-radio01.mediahubaustralia.com/FM2W/aac/', 'Classical' ],
		[ 'http://bigrradio.cdnstream1.com/5187_128', 'Alternative' ],
		[ 'http://streaming.radionomy.com/R1Dubstep?lang=en', 'DubStep' ],
		[ 'http://streams.fluxfm.de/Chillhop/mp3-256', 'LoFi HipHop' ],
		[ 'http://streams.90s90s.de/hiphop/mp3-128/', 'Hip Hop Oldskool' ],
	],
}).on('change', function(value){
	if(value == 'off'){
		if(this.audio){
			this.audio.pause();
			this.audio.currentTime = 0;
			delete this.audio;
		}
		
		return;
	}
	
	if(!this.audio){
		this.audio = new Audio(value);
		console.log(menu.config);
		this.audio.volume = menu.config.radio.volume;
	}else{
		this.audio.src = value;
	}
	
	this.audio.load();
	this.audio.play();
});

radio.add_control({
	name: 'Radio Volume',
	type: 'slider',
	walk: 'radio.volume',
	range: [ 0, 1, 0.05 ],
});

var dev = menu.window.add_tab('Dev');

dev.add_control({
	name: 'Save Game Script',
	type: 'function',
	value(){
		var link = utils.add_ele('a', document.documentElement, { href: api.resolve({
			target: api.api_v2,
			endpoint: 'source',
			query: { download: true },
		}) });

		link.click();

		link.remove();
	},
});

/*Render: {
	ESP: {
		name: 'Player ESP Type',
		value: [ 'off', 'walls', '2d', 'Full' ],
		default: 'off',
		type: 'select',
		set: (value) => {
			// move to main class
			this.nameTags = value != 'off';
			this.noNameTags = value == 'full';
		},
	},
	Tracers: {
		name: "Player Tracers",
		val: false,
		html: () => this.generateSetting("checkbox", "renderTracers"),
	},
	espHostileCol: {
		name: "Hostile Color",
		val: "#ff0000",
		html: () => this.generateSetting("color", "espHostileCol"),
	},
	espFriendlyCol: {
		name: "Friendly Color",
		val: "#00ff00",
		html: () => this.generateSetting("color", "espFriendlyCol"),
	},
	Chams: {
		pre: "<div class='separator'>Color Chams</div>",
		name: "Player Chams",
		val: false,
		html: () => this.generateSetting("checkbox", "renderChams") //+
	},
	WireFrame: {
		name: "Player Wireframe",
		val: false,
		html: () => this.generateSetting("checkbox", "renderWireFrame"),
	},
	rainbowColor: {
		name: "Rainbow Color",
		val: false,
		html: () => this.generateSetting("checkbox", "rainbowColor"),
	},
	chamHostileCol: {
		name: "Hostile Color",
		val: "#ff0000",
		html: () => this.generateSetting("color", "chamHostileCol"),
	},
	chamFriendlyCol: {
		name: "Friendly Color",
		val: "#00ff00",
		html: () => this.generateSetting("color", "chamFriendlyCol"),
	},
	hideAdverts: {
		pre: "<div class='separator'>Krunker UI</div>",
		name: "Hide Advertisments",
		val: true,
		html: () => this.generateSetting("checkbox", "hideAdverts"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-adverts'),
	},
	hideStreams: {
		name: "Hide Streams",
		val: false,
		html: () => this.generateSetting("checkbox", "hideStreams"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-streams'),
	},
	hideMerch: {
		name: "Hide Merch",
		val: false,
		html: () => this.generateSetting("checkbox", "hideMerch"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-merch'),
	},
	hideNewsConsole: {
		name: "Hide News Console",
		val: false,
		html: () => this.generateSetting("checkbox", "hideNewsConsole"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-news'),
	},
	hideCookieButton: {
		name: "Hide Security Manage Button",
		val: false,
		html: () => this.generateSetting("checkbox", "hideCookieButton"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-security'),
	},
	showSkidBtn: {
		pre: "<hr>",
		name: "Show Menu Button",
		val: true,
		html: () => this.generateSetting("checkbox", "showSkidBtn"),
		set: (value, init) => {
			let button = document.getElementById("mainButton");
			if (!utils.isDefined(button)) utils.create_button("Junk", "https://i.imgur.com/pA5e8hy.png", this.toggleMenu, value)
			utils.wait_for(() => document.getElementById("mainButton")).then(button => { button.style.display = value ? "inherit" : "none" })
		}
	},
	customCSS: {
		pre: "<hr>",
		name: "Custom CSS",
		val: "",
		html: () => this.generateSetting("url", "customCSS", "URL to CSS file"),
		css: document.createElement("link"),
		set: (value, init) => {
			if (value && value.startsWith("http")&&value.endsWith(".css")) {
				this.settings.customCSS.css.href = value
			} else this.settings.customCSS.css.href = null
			if (init && this.settings.customCSS.css) {
				this.settings.customCSS.css.rel = "stylesheet"
				try {
					document.getElementsByTagName('head')[0].appendChild(this.settings.customCSS.css)
				} catch(e) {
					console.error(e)
					this.settings.customCSS.css = null
				}
			}
		}
	},
	customBillboard: {
		name: "Custom Billboard Text",
		val: "",
		html: () =>
		this.generateSetting(
			"text",
			"customBillboard",
			"Custom Billboard Text"
		),
	},
},
Weapon: {
	autoReload: {
		//pre: "<br><div class='setHed'>Weapon</div>",
		name: "Auto Reload",
		val: false,
		html: () => this.generateSetting("checkbox", "autoReload"),
	},
	weaponZoom: {
		name: "Weapon Zoom",
		val: 1.0,
		min: 0,
		max: 50.0,
		step: 0.01,
		html: () => this.generateSetting("slider", "weaponZoom"),
		set: (value) => utils.wait_for(() => this.renderer).then(renderer => renderer.adsFovMlt.fill(value))
	},
	weaponTrails: {
		name: "Weapon Trails",
		val: false,
		html: () => this.generateSetting("checkbox", "weaponTrails"),
		set: (value) => utils.wait_for(() => this.me).then(me => { me.weapon.trail = value })
	},
	autoAim: {
		pre: "<div class='separator'>Auto Aim</div>",
		name: "Auto Aim Type",
		val: "off",
		html: () =>
		this.generateSetting("select", "autoAim", {
			off: "Off",
			correction: "Aim Correction",
			assist: "Legit Aim Assist",
			easyassist: "Easy Aim Assist",
			silent: "Silent Aim",
			trigger: "Trigger Bot",
			quickScope: "Quick Scope"
		}),
	},
	fovBoxSize: {
		name: "FOV Box Type",
		val: "off",
		html: () =>
		this.generateSetting("select", "fovBoxSize", {
			off: "Off",
			small: "Small",
			medium: "Medium",
			large: "Large"
		})
	},
	aimOffset: {
		name: "Aim Offset",
		val: 0,
		min: -4,
		max: 1,
		step: 0.01,
		html: () => this.generateSetting("slider", "aimOffset"),
		set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
	},
	frustrumCheck: {
		name: "Player Visible Check",
		val: false,
		html: () => this.generateSetting("checkbox", "frustrumCheck"),
	},
	wallPenetrate: {
		name: "Aim through Penetratables",
		val: false,
		html: () => this.generateSetting("checkbox", "wallPenetrate"),
	},
},
Player: {
	autoBhop: {
		name: "Auto Bhop Type",
		val: "off",
		html: () => this.generateSetting("select", "autoBhop", {
			off: "Off",
			autoJump: "Auto Jump",
			keyJump: "Key Jump",
			autoSlide: "Auto Slide",
			keySlide: "Key Slide"
		}),
	},
	skinUnlock: {
		name: "Unlock Skins",
		val: false,
		html: () => this.generateSetting("checkbox", "skinUnlock"),
	},
},
GamePlay: {
	autoActivateNuke: {
		tab: "GamePlay",
		name: "Auto Activate Nuke",
		val: false,
		html: () => this.generateSetting("checkbox", "autoActivateNuke"),
	},
	autoFindNew: {
		tab: "GamePlay",
		name: "New Lobby Finder",
		val: false,
		html: () => this.generateSetting("checkbox", "autoFindNew"),
	},
	autoClick: {
		tab: "GamePlay",
		name: "Auto Start Game",
		val: false,
		html: () => this.generateSetting("checkbox", "autoClick"),
	},
	noInActivity: {
		tab: "GamePlay",
		name: "No InActivity Kick",
		val: true,
		html: () => this.generateSetting("checkbox", "noInActivity"),
	},
},
Radio: {
	playStream: {
		tab: "",
		//pre: "<br><div class='setHed'>Radio Stream Player</div>",
		name: "Stream Select",
		val: "off",
		html: () => this.generateSetting("select", "playStream", {
			off: 'Off',
			_2000s: 'General German/English',
			_HipHopRNB: 'Hip Hop / RNB',
			_Oldskool: 'Hip Hop Oldskool',
			_Country: 'Country',
			_Pop: 'Pop',
			_Dance: 'Dance',
			_Dubstep: 'DubStep',
			_Lowfi: 'LoFi HipHop',
			_Jazz: 'Jazz',
			_Oldies: 'Golden Oldies',
			_Club: 'Club',
			_Folk: 'Folk',
			_ClassicRock: 'Classic Rock',
			_Metal: 'Heavy Metal',
			_DeathMetal: 'Death Metal',
			_Classical: 'Classical',
			_Alternative: 'Alternative',
		}),
		set: (value) => {
			if (value == "off") {
				if ( this.settings.playStream.audio ) {
					this.settings.playStream.audio.pause();
					this.settings.playStream.audio.currentTime = 0;
					this.settings.playStream.audio = null;
				}
				return;
			}
			let url = this.settings.playStream.urls[value];
			if (!this.settings.playStream.audio) {
				this.settings.playStream.audio = new Audio(url);
				this.settings.playStream.audio.volume = this.settings.audioVolume.val||0.5
			} else {
				this.settings.playStream.audio.src = url;
			}
			this.settings.playStream.audio.load();
			this.settings.playStream.audio.play();
		},
		urls: {
			_2000s: 'http://0n-2000s.radionetz.de/0n-2000s.aac',
			_HipHopRNB: 'https://stream-mixtape-geo.ntslive.net/mixtape2',
			_Country: 'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2',
			_Dance: 'http://streaming.radionomy.com/A-RADIO-TOP-40',
			_Pop: 'http://bigrradio.cdnstream1.com/5106_128',
			_Jazz: 'http://strm112.1.fm/ajazz_mobile_mp3',
			_Oldies: 'http://strm112.1.fm/60s_70s_mobile_mp3',
			_Club: 'http://strm112.1.fm/club_mobile_mp3',
			_Folk: 'https://freshgrass.streamguys1.com/irish-128mp3',
			_ClassicRock: 'http://1a-classicrock.radionetz.de/1a-classicrock.mp3',
			_Metal: 'http://streams.radiobob.de/metalcore/mp3-192',
			_DeathMetal: 'http://stream.laut.fm/beatdownx',
			_Classical: 'http://live-radio01.mediahubaustralia.com/FM2W/aac/',
			_Alternative: 'http://bigrradio.cdnstream1.com/5187_128',
			_Dubstep: 'http://streaming.radionomy.com/R1Dubstep?lang=en',
			_Lowfi: 'http://streams.fluxfm.de/Chillhop/mp3-256',
			_Oldskool: 'http://streams.90s90s.de/hiphop/mp3-128/',
		},
		audio: null,
	},
	audioVolume: {
		tab: "Radio",
		name: "Radio Volume",
		val: 0.5,
		min: 0,
		max: 1,
		step: 0.01,
		html: () => this.generateSetting("slider", "audioVolume"),
		set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
	},
},*/

module.exports = menu;

/***/ }),

/***/ "./vars.js":
/*!*****************!*\
  !*** ./vars.js ***!
  \*****************/
/***/ ((module) => {

"use strict";


module.exports = (add_var, add_patch, key) => {
	// set render(orender){
	// return hooked function
	add_patch('Render', /}},(\w+)\.render=/, (set, overlay) => `${set}0;({set _(_){${key}.render(_,${overlay})}})._=`);
	
	add_patch('Socket', /(\w+\.exports={ahNum:)/, (match, set) => `${key}.socket=${set}`);
	
	add_patch('isHacker', /(window\.\w+=)!0\)/, `$1!1)`);
	
	add_patch('respawnT', /\w+:1e3\*/g, `respawnT:0*`);
	
	add_patch('anticheat1', /&&\w+\(\),window\.utilities&&\(\w+\(null,null,null,!0\),\w+\(\)\)/, '');
	
	add_patch('anticheat3', /windows\.length>\d+.*?37/, `37`);
	
	add_patch('commandline', /Object\.defineProperty\(console.*?\),/, '');
};

/***/ }),

/***/ "./visual.js":
/*!*******************!*\
  !*** ./visual.js ***!
  \*******************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var OVisual = __webpack_require__(/*! ../libs/visual */ "../libs/visual.js");

class Visual extends OVisual {
	tick(){}
	text(player){
		this.ctx.save();
		this.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale);
		
		this.ctx.font = 'Bold 17px Tahoma';
		this.ctx.fillStyle = 'white';
		this.ctx.strokeStyle = 'black';
		this.ctx.lineWidth = 1;
		
		let x = rect.right + 7,
			y = rect.top,
			name = player.name || player.alias;
		
		this.ctx.fillText(name, x, y);
		this.ctx.strokeText(name, x, y);
		
		y += 16;
		
		this.ctx.font = `Bold 15px Tahoma`;
		this.ctx.fillStyle = "#cccccc";
		
		this.ctx.fillText(player.weapon.name, x, y);
		this.ctx.strokeText(player.weapon.name, x, y);
		
		y += 16;
		
		this.ctx.fillStyle = player.hp_color;
		this.ctx.fillText(player.health + ' HP', x, y);
		this.ctx.strokeText(player.health + ' HP', x, y);
		
		this.ctx.restore();
	}
};

module.exports = Visual;

/***/ }),

/***/ "../libs/api.js":
/*!**********************!*\
  !*** ../libs/api.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var DataStore = __webpack_require__(/*! ./datastore */ "../libs/datastore.js"),
	store = new DataStore();

class API {
	constructor(matchmaker_url, api_url){
		this.matchmaker = matchmaker_url,
		this.api = /*CHANGE*/ false ? 0 : api_url,
		
		this.stacks = new Set();
		
		this.api_v2 = new URL('v2/', this.api);
		
		this.meta = new Promise((resolve, reject) => {
			this.meta_resolve = resolve;
			this.meta_reject = reject;
		});
	}
	observe(){
		this.load = new Promise(resolve => new MutationObserver((muts, observer) => muts.forEach(mut => [...mut.addedNodes].forEach(node => {
			if(node.tagName == 'DIV' && node.id == 'instructionHolder'){
				this.instruction_holder = node;
				
				new MutationObserver(() => this.on_instruct && setTimeout(this.on_instruct, 200)).observe(this.instruction_holder, {
					attributes: true,
					attributeFilter: [ 'style' ],
				});
				
				// observer.disconnect();
			}
			
			if(node.tagName == 'SCRIPT' && node.textContent.includes('Yendis Entertainment')){
				node.textContent = '';
				resolve();
			}
		}))).observe(document, { childList: true, subtree: true }));
	}
	has_instruct(...ors){
		var instruction = this.instruction_holder ? this.instruction_holder.textContent.trim().toLowerCase() : '';
		
		return ors.some(check => instruction.includes(check));
	}
	async report_error(where, err){
		if(typeof err != 'object')return;
		
		var body = {
			name: err.name,
			message: err.message,
			stack: err.stack,
			where: where,
		};
		
		if(this.stacks.has(err.stack))return;
		
		console.error('Where:', where, '\nUncaught', err);
		
		this.stacks.add(err.stack);
		
		await this.fetch({
			target: this.api_v2,
			endpoint: 'error',
			data: body,
		});
	}
	async fetch(input){
		if(typeof input != 'object' || input == null)throw new TypeError('Input must be a valid object');
		
		var opts = {
			cache: 'no-store',
			headers: {},
		};
		
		if(input.hasOwnProperty('headers'))Object.assign(opts.headers, input.headers);
		
		if(input.hasOwnProperty('data')){
			opts.method = 'POST';
			opts.body = JSON.stringify(input.data);
			opts.headers['content-type'] = 'application/json';
		}
		
		var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text';
		
		return await(await fetch(this.resolve(input), opts))[result]();
	}
	resolve(input){
		if(!input.hasOwnProperty('target'))throw new TypeError('Target must be specified');
		
		var url = new URL(input.target);
		
		if(input.hasOwnProperty('endpoint'))url = new URL(input.endpoint, url);
		
		if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
		
		return url;
	}
	async source(){
		await this.meta;
		
		return await this.fetch({
			target: this.api_v2,
			endpoint: 'source',
			result: 'text',
		});
	}
	async show_error(title, message){
		await this.load;
		
		var holder = document.querySelector('#instructionHolder'),
			instructions = document.querySelector('#instructions');
		
		holder.style.display = 'block';
		holder.style.pointerEvents = 'all';
		
		instructions.innerHTML = `<div style='color:#FFF9'>${title}</div><div style='margin-top:10px;font-size:20px;color:#FFF6'>${message}</div>`;
	}
	async token(){
		await this.meta;
		
		return await this.fetch({
			target: this.api_v2,
			endpoint: 'token',
			data: await this.fetch({
				target: this.matchmaker,
				endpoint: 'generate-token',
				headers: {
					'client-key': this.meta.key,
				},
				result: 'json',
			}),
			result: 'json',
		});
	}
	is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
	async license(input_meta, input_key){
		if(!this.is_host(location, 'krunker.io', 'browserfps.com') || location.pathname != '/')return;
		
		var entries = [...new URLSearchParams(location.search).entries()];
		
		if(entries.length == 1 && !entries[0][1]){
			history.replaceState(null, null, '/');
			store.set('tgg', entries[0][0]);
		}
		
		var key = input_key || await store.get('tgg');
		
		var meta = await this.fetch({
			target: this.api_v2,
			endpoint: 'meta',
			data: {
				...input_meta,
				needs_key: true,
				license: key || null,
			},
			result: 'json',
		});
		
		if(meta.error){
			this.show_error(meta.error.title, meta.error.message);
			this.meta_reject();
		}
		
		if(!meta.license)return this.meta_resolve(this.meta = meta);
		
		return location.replace(meta.license);
	}
}

module.exports = API;

/***/ }),

/***/ "../libs/consts.js":
/*!*************************!*\
  !*** ../libs/consts.js ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var DataStore = __webpack_require__(/*! ./datastore */ "../libs/datastore.js"),
	API = __webpack_require__(/*! ./api */ "../libs/api.js"),
	Updater = __webpack_require__(/*! ./updater */ "../libs/updater.js"),
	Utils = __webpack_require__(/*! ./utils */ "../libs/utils.js"),
	utils = new Utils();

exports.store = new DataStore();

exports.meta = {
	github: 'https://github.com/e9x/kru/',
	discord: 'https://y9x.github.io/discord/',
	forum: 'https://forum.sys32.dev/',
};

exports.api_url = 'https://api.sys32.dev/';
exports.mm_url = 'https://matchmaker.krunker.io/';

exports.is_frame = window != window.top;
exports.extracted = 1623884469040;

// .htaccess for ui testing
exports.krunker = utils.is_host(location, 'krunker.io', 'browserfps.com') && ['/.htaccess', '/'].includes(location.pathname);

exports.proxy_addons = [
	{
		name: 'Browser VPN',
		chrome: 'https://chrome.google.com/webstore/detail/ppajinakbfocjfnijggfndbdmjggcmde',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/mybrowser-vpn/',
	},
	{
		name: 'Hola VPN',
		chrome: 'https://chrome.google.com/webstore/detail/gkojfkhlekighikafcpjkiklfbnlmeio',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/hola-unblocker/',
	},
	{
		name: 'Windscribe',
		chrome: 'https://chrome.google.com/webstore/detail/hnmpcagpplmpfojmgmnngilcnanddlhb',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/windscribe/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search',
	},
	{
		name: 'UltraSurf',
		chrome: 'https://chrome.google.com/webstore/detail/mjnbclmflcpookeapghfhapeffmpodij',
	},
];

exports.firefox = navigator.userAgent.includes('Firefox');

exports.supported_store = exports.firefox ? 'firefox' : 'chrome';

exports.addon_url = query => exports.firefox ? 'https://addons.mozilla.org/en-US/firefox/search/?q=' + encodeURIComponent(query) : 'https://chrome.google.com/webstore/search/' + encodeURI(query);

var api = new API(exports.mm_url, exports.api_url);

if(!exports.is_frame){
	if(exports.krunker)api.observe();
	
	api.license(exports.meta, typeof LICENSE_KEY == 'string' && LICENSE_KEY);
}

exports.utils = utils;
exports.api = api;

/***/ }),

/***/ "../libs/datastore.js":
/*!****************************!*\
  !*** ../libs/datastore.js ***!
  \****************************/
/***/ ((module) => {

"use strict";


var GM = {
	get_value: typeof GM_getValue == 'function' && GM_getValue,
	set_value: typeof GM_setValue == 'function' && GM_setValue,
};

class DataStore {
	ls_prefix = 'ss';
	async get(key, expect){
		var data = await this.get_raw(key);
		
		if(typeof data == 'string')try{
			return JSON.parse(data);
		}catch(err){
			console.error('DATASTORE ERROR', err, data);
			
			// might be earlier data
			return data;
		}
		
		switch(expect){
			case'object':
				
				return {};
				
				break;
			case'array':
				
				return [];
				
				break;
		}
	}
	set(key, value){
		if(value instanceof Set)value = [...value];
		
		return this.set_raw(key, JSON.stringify(value));
	}
	async get_raw(key){
		return await(GM.get_value ? GM.get_value(key) : localStorage.getItem(this.ls_prefix + key));
	}
	async set_raw(key, value){
		return await(GM.set_value ? GM.set_value(key, value) : localStorage.setItem(this.ls_prefix + key, value));
	}
};

module.exports = DataStore;

/***/ }),

/***/ "../libs/file.js":
/*!***********************!*\
  !*** ../libs/file.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Utils = __webpack_require__(/*! ./utils */ "../libs/utils.js"),
	utils = new Utils();

class File {
	utf8_dec = new TextDecoder('utf8');
	constructor(data){
		this.data = data;
		this.name = data.name || '';
		this.size = data.size || 0;
	}
	read(result){
		var reader = new FileReader();
		
		return new Promise((resolve, reject) => {
			reader.addEventListener('load', () => {
				switch(result){
					case'text':
					default:
						
						resolve(this.utf8_dec.decode(reader.result));
						
						break;
					case'buffer':
						
						resolve(reader.result);
						
						break;
				}
			}, { once: true });
			
			reader.readAsArrayBuffer(this.data);
		});
	}
	static pick(options = {}){
		var picker = utils.add_ele('input', document.documentElement, {
			type: 'file',
			style: { display: 'none' },
		});
		
		if(Array.isArray(options.accept))picker.setAttribute('accept', options.accept.join(', '));
		if(options.multipe)picker.setAttribute('multiple', '');
		
		return new Promise((resolve, reject) => {
			picker.addEventListener('change', () => {
				var files = [];
				
				for(let file of picker.files)files.push(new File(file));
				
				resolve(options.multiple ? files : files[0]);
			}, { once: true });
			
			picker.click();
		});
	}
	static save(options = {}){
		var link = utils.add_ele('a', document.documentElement, {
			href: URL.createObjectURL(new Blob([ options.data ])),
			download: options.name || '',
			type: 'file',
		});
		
		link.click();
		
		link.remove();
	}
};

module.exports = File;

/***/ }),

/***/ "../libs/input.js":
/*!************************!*\
  !*** ../libs/input.js ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ./vars */ "../libs/vars.js"),
	InputData = __webpack_require__(/*! ./inputdata */ "../libs/inputdata.js"),
	{ Vector3 } = __webpack_require__(/*! ./space */ "../libs/space.js"),
	{ api, utils } = __webpack_require__(/*! ./consts */ "../libs/consts.js");

class Input {
	constructor(cheat){
		this.cheat = cheat;
	}
	push(array){
		if(this.cheat.player && this.cheat.controls)try{
			var data = new InputData(array);
			
			this.modify(data);
			
			InputData.previous = data;
		}catch(err){
			api.report_error('input', err);
		}
		
		return array;
	}
	aim_input(rot, data){
		data.xdir = rot.x * 1000;
		data.ydir = rot.y * 1000;
	}
	aim_camera(rot, data){
		// updating camera will make a difference next tick, update current tick with aim_input
		this.cheat.controls[vars.pchObjc].rotation.x = rot.x;
		this.cheat.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !this.cheat.player.shot;
		
		if(!data.reload && this.cheat.player.has_ammo && data.shoot && !this.cheat.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(this.cheat.player.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, this.cheat.world.camera);
		
		if(this.cheat.player.aimed && raycaster.intersectObjects(this.cheat.game.players.list.map(ent => this.cheat.add(ent)).filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	calc_rot(player){
		var camera = utils.camera_world(),
			target = player.aim_point;
		
		// target.add(player.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.cheat.player.jump_bob_y
			, target.z)
			- this.cheat.player.land_bob_y * 0.1
			- this.cheat.player.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	smooth(target, setup){
		var x_ang = utils.getAngleDst(this.cheat.controls[vars.pchObjc].rotation.x, target.x),
			y_ang = utils.getAngleDst(this.cheat.controls.object.rotation.y, target.y);
		
		// camChaseSpd used on .object
		
		return {
			y: this.cheat.controls.object.rotation.y + y_ang * setup.speed,
			x: this.cheat.controls[vars.pchObjc].rotation.x + x_ang * setup.turn,
		};
	}
	bhop(data){
		var status = this.cheat.config.player.bhop,
			auto = status.startsWith('auto'),
			key = status.startsWith('key'),
			slide = status.endsWith('slide'),
			jump = slide || status.endsWith('jump');
		
		if(!data.focused)return;
		
		if(jump && (auto || data.keys.Space)){
			this.cheat.controls.keys[this.cheat.controls.binds.jump.val] ^= 1;
			if(this.cheat.controls.keys[this.cheat.controls.binds.jump.val])this.cheat.controls.didPressed[this.cheat.controls.binds.jump.val] = 1;
		}
		
		if(slide && (auto || data.keys.Space) && this.cheat.player.velocity.y < -0.02 && this.cheat.player.can_slide)setTimeout(() => this.cheat.controls.keys[this.cheat.controls.binds.crouch.val] = 0, 325), this.cheat.controls.keys[this.cheat.controls.binds.crouch.val] = 1;
	}
	modify(data){
		// bhop
		this.bhop(data);
		
		// auto reload
		if(!this.cheat.player.has_ammo && (this.cheat.config.aim.status == 'auto' || this.cheat.config.aim.auto_reload))data.reload = true;
		
		// TODO: target once on aim
		
		data.could_shoot = this.cheat.player.can_shoot;
		
		var nauto = this.cheat.player.weapon_auto || this.cheat.player.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < this.cheat.config.aim.hitchance,
			can_target = this.cheat.config.aim.status == 'auto' || data.scope || data.shoot;
		
		if(this.cheat.player.weapon.burst)this.cheat.player.shot = this.cheat.player.did_shoot;
		
		if(can_target)this.cheat.target = this.cheat.pick_target();
		
		if(this.cheat.player.can_shoot)if(this.cheat.config.aim.status == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(this.cheat.config.aim.status != 'off' && this.cheat.target && this.cheat.player.health){
			var rot = this.calc_rot(this.cheat.target);
			
			if(hitchance)if(this.cheat.config.aim.status == 'correction' && nauto)this.correct_aim(rot, data);
			else if(this.cheat.config.aim.status == 'auto'){
				if(this.cheat.player.can_aim)data.scope = 1;
				
				if(this.cheat.player.aimed)data.shoot = !this.cheat.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(this.cheat.config.aim.status == 'assist' && this.cheat.player.aim_press){
				var smooth_map = {
					// step: 2
					// min: 0
					// max: 1
					0: 1, // off
					0.2: 0.1, // instant
					0.4: 0.07, // faster
					0.6: 0.05, // fast
					0.8: 0.03, // light
					1: 0.01, // light
				};
				
				let spd = smooth_map[this.cheat.config.aim.smooth] || (console.warn(this.cheat.config.aim.smooth, 'not registered'), 1);
				
				/*
				50 => 0.005
				
				DEFAULT:
				turn: 0.0022,
				speed: 0.0012,
				*/
				
				rot = this.smooth(rot, {
					turn: spd,
					speed: spd,
				});
				
				this.aim_camera(rot, data);
				
				// offset aim rather than revert to any previous camera rotation
				if(data.shoot && !this.cheat.player.shot && !hitchance)data.ydir = 0;
			}
		}
		
		if(this.cheat.player.can_shoot && data.shoot && !this.cheat.player.shot){
			this.cheat.player.shot = true;
			setTimeout(() => this.cheat.player.shot = false, this.cheat.player.weapon.rate + 2);
		}
	}
};

module.exports = Input;

/***/ }),

/***/ "../libs/inputdata.js":
/*!****************************!*\
  !*** ../libs/inputdata.js ***!
  \****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ./vars */ "../libs/vars.js"),
	keys = {};

class InputData {
	constructor(array){
		this.array = array;
	}
	get keys(){
		return keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
};

document.addEventListener('keydown', event => keys[event.code] = true);

document.addEventListener('keyup', event => delete keys[event.code]);

window.addEventListener('blur', () => keys = {});

InputData.previous = {};

for(let prop in vars.keys){
	let key = vars.keys[prop];
	
	Object.defineProperty(InputData.prototype, prop, {
		get(){
			return this.array[key];
		},
		set(value){
			return this.array[key] = typeof value == 'boolean' ? +value : value;
		},
	});
}

module.exports = InputData;

window.InputData = InputData;

/***/ }),

/***/ "../libs/player.js":
/*!*************************!*\
  !*** ../libs/player.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ../libs/vars */ "../libs/vars.js"),
	{ utils } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js"),
	{ Vector3, Hex } = __webpack_require__(/*! ../libs/space */ "../libs/space.js"),
	random_target = 0;

setInterval(() => random_target = Math.random(), 2000);

class Player {
	constructor(cheat, entity){
		this.cheat = cheat;
		this.entity = typeof entity == 'object' && entity != null ? entity : {};
		this.velocity = new Vector3();
		this.position = new Vector3();
		this.esp_hex = new Hex();
		this.hp_hex = new Hex();
		
		this.parts = {
			hitbox_head: new Vector3(),
			head: new Vector3(),
			torso: new Vector3(),
			legs: new Vector3(),
		};
	}
	get distance_scale(){
		var world_pos = utils.camera_world();
		
		return Math.max(.3, 1 - utils.getD3D(world_pos.x, world_pos.y, world_pos.z, this.x, this.y, this.z) / 600);
	}
	calc_rect(){
		let playerScale = (2 * vars.consts.armScale + vars.consts.chestWidth + vars.consts.armInset) / 2;
		let xmin = Infinity;
		let xmax = -Infinity;
		let ymin = Infinity;
		let ymax = -Infinity;
		let position = null;
		let broken = false;
		
		for(let var1 = -1; !broken && var1 < 2; var1+=2){
			for(let var2 = -1; !broken && var2 < 2; var2+=2){
				for(let var3 = 0; !broken && var3 < 2; var3++){
					if (position = this.obj.position.clone()) {
						position.x += var1 * playerScale;
						position.z += var2 * playerScale;
						position.y += var3 * (this.height - this.crouch * vars.consts.crouchDst);
						if(!utils.contains_point(position)){
							broken = true;
							break;
						}
						position.project(this.cheat.world.camera);
						xmin = Math.min(xmin, position.x);
						xmax = Math.max(xmax, position.x);
						ymin = Math.min(ymin, position.y);
						ymax = Math.max(ymax, position.y);
					}
				}
			}
		}

		// if(broken)continue;
		
		xmin = (xmin + 1) / 2;
		xmax = (xmax + 1) / 2;
		
		ymin = (ymin + 1) / 2;
		ymax = (ymax + 1) / 2;
		
		ymin = -(ymin - 0.5) + 0.5;
		ymax = -(ymax - 0.5) + 0.5;
		
		xmin *= utils.canvas.width;
		xmax *= utils.canvas.width;
		ymin *= utils.canvas.height;
		ymax *= utils.canvas.height;
		
		var obj = {
			left: xmin,
			top: ymax,
			right: xmax,
			bottom: ymin,
			width: xmax - xmin,
			height: ymin - ymax,
		};
		
		obj.x = obj.left + obj.width / 2;
		obj.y = obj.top + obj.height / 2;
		
		return obj;
	}
	scale_rect(sx, sy){
		var out = {},
			horiz = [ 'y', 'height', 'top', 'bottom' ];
		
		for(var key in this.rect)out[key] = this.rect[key] / (horiz.includes(key) ? sy : sx);
		
		return out;
	}
	calc_in_fov(){
		if(!this.active)return false;
		if(this.cheat.config.aim.fov == 110)return true;
		if(!this.frustum)return false;
		
		var fov_bak = utils.world.camera.fov;
		
		// config fov is percentage of current fov
		utils.world.camera.fov = this.cheat.config.aim.fov / fov_bak * 100;
		utils.world.camera.updateProjectionMatrix();
		
		utils.update_frustum();
		var ret = utils.contains_point(this.aim_point);
		
		utils.world.camera.fov = fov_bak;
		utils.world.camera.updateProjectionMatrix();
		utils.update_frustum();
		
		return ret;
	}
	get can_target(){
		return this.active && this.can_see && this.enemy && this.in_fov;
	}
	get ping(){ return this.entity.ping }
	get jump_bob_y(){ return this.entity.jumpBobY }
	get clan(){ return this.entity.clan }
	get alias(){ return this.entity.alias }
	get weapon(){ return this.entity.weapon }
	get weapon_auto(){ return !this.weapon.nAuto }
	get can_slide(){ return this.entity.canSlide }
	get risk(){ return this.entity.level >= 30 || this.entity.account && (this.entity.account.featured || this.entity.account.premiumT) }
	get is_you(){ return this.entity[vars.isYou] }
	get target(){
		return this.cheat.target && this.entity == this.cheat.target.entity;
	}
	get can_melee(){
		return this.weapon.melee && this.cheat.target && this.cheat.target.active && this.position.distance_to(this.cheat.target) <= 18 || false;
	}
	get reloading(){
		// reloadTimer in var randomization array
		return this.entity.reloadTimer != 0;
	}
	get can_aim(){
		return !this.can_melee;
	}
	get can_throw(){
		return this.entity.canThrow && this.weapon.canThrow;
	}
	get aimed(){
		var aim_val = this.can_throw
			? 1 - this.entity.chargeTime / this.entity.throwCharge
			: this.weapon.melee ? 1 : this.entity[vars.aimVal];
		
		return this.weapon.noAim || aim_val == 0 || this.can_melee || false;
	}
	get can_shoot(){
		return !this.reloading && this.has_ammo && (this.can_throw || !this.weapon.melee || this.can_melee);
	}
	get aim_press(){ return this.cheat.controls[vars.mouseDownR] || this.cheat.controls.keys[this.cheat.controls.binds.aim.val] }
	get crouch(){ return this.entity[vars.crouchVal] || 0 }
	get box_scale(){
		var view = utils.camera_world(),	
			a = side => Math.min(1, (this.rect[side] / utils.canvas[side]) * 10);
		
		return [ a('width'), a('height') ];
	}
	get dist_scale(){
		var view = utils.camera_world(),	
			scale = Math.max(0.65, 1 - utils.getD3D(view.x, view.y, view.z, this.position.x, this.position.y, this.position.z) / 600);
		
		return [ scale, scale ];
	}
	get distance_camera(){
		return utils.camera_world().distanceTo(this.position);
	}
	get obj(){ return this.is_ai ? this.enity.dat : this.entity[vars.objInstances] }
	get land_bob_y(){ return this.entity.landBobY || 0 }
	get recoil_y(){ return this.entity[vars.recoilAnimY] || 0 }
	get has_ammo(){ return this.ammo || this.ammo == this.max_ammo }
	get ammo(){ return this.entity[vars.ammos][this.entity[vars.weaponIndex]] || 0 }
	get max_ammo(){ return this.weapon.ammo || 0 }
	get height(){ return this.entity.height || 0 } // (this.entity.height || 0) - this.crouch * 3 }
	get health(){ return this.entity.health || 0 }
	get scale(){ return this.entity.scale }
	get max_health(){ return this.entity[vars.maxHealth] || 100 }
	//  && (this.is_you ? true : this.chest && this.leg)
	get active(){ return this.entity.active && this.entity.x != null && this.health > 0 && (this.is_you ? true : this.chest && this.leg) && true }
	get teammate(){ return this.is_you || this.cheat.player && this.team && this.team == this.cheat.player.team }
	get enemy(){ return !this.teammate }
	get team(){ return this.entity.team }
	get streaks(){ return Object.keys(this.entity.streaks || {}) }
	get did_shoot(){ return this.entity[vars.didShoot] }
	get chest(){
		return this.entity.lowerBody ? this.entity.lowerBody.children[0] : null;
	}
	get leg(){
		for(var mesh of this.entity.legMeshes)if(mesh.visible)return mesh;
		return this.chest;
	}
	tick(){
		this.position.set(this.entity.x, this.entity.y, this.entity.z);
		this.velocity.set(this.entity.xVel, this.entity.yVel, this.entity.zVel);
		
		this.parts.hitbox_head.copy(this.position).set_y(this.position.y + this.height - (this.crouch * vars.consts.crouchDst));
		
		if(this.is_you)return;
		
		var head_size = 1.5,
			chest_box = new utils.three.Box3().setFromObject(this.chest),
			chest_size = chest_box.getSize(),
			chest_pos = chest_box.getCenter();
		
		// parts centered
		this.parts.torso.copy(chest_pos).translate_quaternion(this.chest.getWorldQuaternion(), new Vector3().copy({
			x: 0,
			y: -head_size / 2,
			z: 0,
		}));
		
		this.parts.torso_height = chest_size.y - head_size;
		
		this.parts.head.copy(chest_pos).translate_quaternion(this.chest.getWorldQuaternion(), new Vector3().copy({
			x: 0,
			y: this.parts.torso_height / 2,
			z: 0,
		}));
		
		var leg_pos = this.leg[vars.getWorldPosition](),
			leg_scale = this.leg.getWorldScale();
		
		this.parts.legs = new Vector3().copy(leg_pos).translate_quaternion(this.leg.getWorldQuaternion(), new Vector3().copy({
			x: -leg_scale.x / 2,
			y: -leg_scale.y / 2,
			z: 0,
		}));
		
		var keys = [ 'head', 'torso', 'legs' ];
		
		var part = this.cheat.config.aim.offset == 'random' ? keys[~~(random_target * keys.length)] : this.cheat.config.aim.offset;
		
		this.aim_point = part == 'head' ? this.parts.hitbox_head : (this.parts[part] || (console.error(part, 'not registered'), Vector3.Blank));
		
		this.frustum = utils.contains_point(this.aim_point);
		this.in_fov = this.calc_in_fov();
		
		this.rect = this.calc_rect();
		
		this.world_pos = this.active ? this.obj[vars.getWorldPosition]() : { x: 0, y: 0, z: 0 };
		
		var camera_world = utils.camera_world();
		
		this.can_see = this.cheat.player &&
			utils.obstructing(camera_world, this.aim_point, (!this.cheat.player || this.cheat.player.weapon && this.cheat.player.weapon.pierce) && this.cheat.config.aim.wallbangs)
		== null ? true : false;
		
		this.esp_hex.set_style(this.cheat.config.esp.rainbow ? this.cheat.overlay.rainbow.col : this.cheat.config.color[this.enemy ? this.risk ? 'risk' : 'hostile' : 'friendly']);
		
		if(!this.can_see)this.esp_hex.sub_scalar(0x77);
		
		
		this.esp_color = this.esp_hex.toString();
		
		var hp_perc = (this.health / this.max_health) * 100,
			hp_red = hp_perc < 50 ? 255 : Math.round(510 - 5.10 * hp_perc),
			hp_green = hp_perc < 50 ? Math.round(5.1 * hp_perc) : 255,
			hp_blue = 0;

		this.hp_hex.set(hp_red, hp_green, hp_blue);
		
		this.hp_color = this.hp_hex.toString();
	}
};

module.exports = Player;

/***/ }),

/***/ "../libs/space.js":
/*!************************!*\
  !*** ../libs/space.js ***!
  \************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


class Vector3 {
	constructor(x = 0, y = 0, z = 0){
		this.x = x;
		this.y = y;
		this.z = z;
	}
	clone(){
		return new Vector3(this.x, this.y, this.z);
	}
	set(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
		
		return this;
	}
	set_x(x){
		this.x = x;
		return this;
	}
	set_y(y){
		this.y = y;
		return this;
	}
	set_z(z){
		this.z = z;
		return this;
	}
	copy(vector){
		this.x = vector.x;
		this.y = vector.y;
		this.z = vector.z;
		
		return this;
	}
	add(vector){
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		
		return this;
	}
	add_vectors(x = 0, y = 0, z = 0){
		this.x += x;
		this.y += y;
		this.z += z;
		
		return this;
	}
	add_scalar(scalar){
		this.x += scalar;
		this.y += scalar;
		this.z += scalar;
		
		return this;
	}
	sub(vector){
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		
		return this;
	}
	sub_vectors(x = 0, y = 0, z = 0){
		this.x -= x;
		this.y -= y;
		this.z -= z;
		
		return this;
	}
	sub_scalar(scalar){
		this.x -= scalar;
		this.y -= scalar;
		this.z -= scalar;
		
		return this;
	}
	multiply(vector){
		this.x *= vector.x;
		this.y *= vector.y;
		this.z *= vector.z;
		
		return this;
	}
	multiply_vectors(x = 0, y = 0, z = 0){
		this.x *= x;
		this.y *= y;
		this.z *= z;
		
		return this;
	}
	multiply_scalar(scalar){
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		
		return this;
	}
	divide(vector){
		this.x /= vector.x;
		this.y /= vector.y;
		this.z /= vector.z;
		
		return this;
	}
	divide_vectors(x = 0, y = 0, z = 0){
		this.x /= x;
		this.y /= y;
		this.z /= z;
		
		return this;
	}
	divide_scalar(scalar){
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
		
		return this;
	}
	apply_quaternion(q) {
		const x = this.x, y = this.y, z = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = -qx * x - qy * y - qz * z;
		this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		return this;
	}
	translate_quaternion(quaternion, vector){
		for(var axis in vector){
			var vec = new Vector3();
			
			vec[axis] = 1;
			
			var pos = vec.apply_quaternion(quaternion).multiply_scalar(vector[axis]);
			
			this.add(pos);
		}
		
		return this;
	}
	distance_to(point){
		return Math.hypot(this.x - point.x, this.y - point.y, this.z - point.z)
	}
};

Vector3.Blank = new Vector3();

class Hex {
	constructor(string = '#000'){
		this.hex = [ 0, 0, 0 ];
		this.set_style(string);
	}
	add_scalar(scalar){
		for(let ind in this.hex)this.hex[ind] += scalar;
		return this.normalize();
	}
	sub_scalar(scalar){
		for(let ind in this.hex)this.hex[ind] -= scalar;
		return this.normalize();
	}
	normalize(){
		for(let ind in this.hex)this.hex[ind] = Math.max(Math.min(this.hex[ind], 255), 0);
		return this;
	}
	set(r, g, b){
		this.hex[0] = r;
		this.hex[1] = g;
		this.hex[2] = b;
		
		return this;
	}
	set_style(string){
		let hex_index = 0,
			offset = string[0] == '#' ? 1 : 0,
			chunk = string.length - offset < 5 ? 1 : 2;
		
		for(let index = offset; index < string.length; index += chunk){
			let part = string.substr(index, chunk);
			
			if(chunk == 1)part += part;	
			
			this.hex[hex_index++] = parseInt(part, 16);
		}
		
		return this;
	}
	toString(){
		var string = '#';
		
		for(let color of this.hex)string += color.toString(16).padStart(2, 0);
		
		return string;
	}
};

exports.Hex = Hex;
exports.Vector3 = Vector3;

/***/ }),

/***/ "../libs/uimenu/MenuButton.js":
/*!************************************!*\
  !*** ../libs/uimenu/MenuButton.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, tick } = __webpack_require__(/*! ./consts */ "../libs/uimenu/consts.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class MenuButton {
	constructor(label, icon){
		this.node = utils.crt_ele('div', {
			className: 'menuItem',
		});
		
		this.icon = utils.add_ele('div', this.node, {
			className: 'menuItemIcon',
			style: {
				'background-image': 'url(' + JSON.stringify(icon) + ')',
			},
		});
		
		this.label = utils.add_ele('div', this.node, {
			className: 'menuItemTitle',
			textContent: label,
		});
		
		this.node.addEventListener('click', () => this.emit('click'));
		
		tick(this.node);
		
		this.hide();
	}
	attach(bar){
		bar.append(this.node);
	}
	show(){
		this.node.style.display = 'flex';
	}
	hide(){
		this.node.style.display = 'none';
	}
};

EventLite.mixin(MenuButton.prototype);

module.exports = MenuButton;

/***/ }),

/***/ "../libs/uimenu/addons/addon.js":
/*!**************************************!*\
  !*** ../libs/uimenu/addons/addon.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class Addon {
	constructor(menu, args){
		this.menu = menu;
		this.window = menu.window;
		
		this.create(...args);
	}
	ready(){
		console.info(this.name, 'loaded');
		this.emit('ready');
	}
	create(){}
};

EventLite.mixin(Addon.prototype);

module.exports = Addon;

/***/ }),

/***/ "../libs/uimenu/addons/discord.js":
/*!****************************************!*\
  !*** ../libs/uimenu/addons/discord.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Addon = __webpack_require__(/*! ./addon */ "../libs/uimenu/addons/addon.js"),
	{ utils, consts } = __webpack_require__(/*! ../consts */ "../libs/uimenu/consts.js");

class DiscordAddon extends Addon {
	invite = /([a-z0-9-]{3,25})\s*?$/i;
	async create(input){
		this.name = 'Discord Invite';
		
		input = await input + '';
		
		var match = input.match(this.invite);
		
		if(!match || !match[1])throw new Error('Invalid invite code: ' + input);
		
		var code = match[1];
		
		console.log('Discord code:', code);
		
		this.data = await(await fetch(`https://discord.com/api/v8/invites/${code}?with_counts=true`)).json();
		
		this.content = utils.crt_ele('div', {
			style: {
				'margin-bottom': '15px',
			},
		});
		
		this.shadow = this.content.attachShadow({ mode: 'closed' });
		
		this.load(this.data, this.shadow);
		
		this.ready();
		
		this.menu.window.header.prepend(this.content);
	}
	load(data, node){
		node.innerHTML = `
<div class='content'>
	<div class='icon'></div>
	<div class='name'></div>
	<div class='online status'></div>
	<div class='total status'></div>
	<a draggable='false' class='join'>Join</a>
</div>`;
		
		utils.add_ele('style', node, { textContent: __webpack_require__(/*! ./discord.css */ "../libs/uimenu/addons/discord.css") });
		
		var nodes = utils.node_tree({
			container: '^ > .content',
			icon: '$ > .icon',
			name: '$ > .name',
			online: '$ > .online',
			total: '$ > .total',
			join: '$ > .join',
		}, node);
		
		if(data.code == 10006){
			nodes.container.classList.add('invalid');
			
			nodes.name.textContent = 'Invalid Invite';
		}else{
			if(data.guild.icon)nodes.icon.style['background-image'] = 'url(' + JSON.stringify('https://cdn.discordapp.com/icons/' + data.guild.id + '/' + data.guild.icon + '?size=64') + ')';
			else nodes.icon.textContent = data.guild.name.split(' ').map(word => word[0]).join('');
			
			nodes.container.classList.add('valid');
			
			nodes.name.textContent = data.guild.name;
			
			nodes.online.textContent = data.approximate_presence_count;
			nodes.total.textContent = data.approximate_member_count;
			
			nodes.join.href = 'https://discord.com/invite/' + data.code;
		}
	}
};

module.exports = DiscordAddon;

/***/ }),

/***/ "../libs/uimenu/addons/settings.js":
/*!*****************************************!*\
  !*** ../libs/uimenu/addons/settings.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// Implements the settings bar (search, presets, export, import, reset) found in the settings menu


var Addon = __webpack_require__(/*! ./addon */ "../libs/uimenu/addons/addon.js"),
	File = __webpack_require__(/*! ../../file */ "../libs/file.js"),
	{ utils, consts } = __webpack_require__(/*! ../consts */ "../libs/uimenu/consts.js");

class SettingsAddon extends Addon {
	async create(input){
		this.name = 'Krunker Settings';
		
		
		this.config = utils.crt_ele('div', { style: {
			'text-align': 'right',
			display: 'inline-block',
			float: 'right',
		} });
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Reset',
		}).addEventListener('click', () => this.menu.load_preset('Default'));
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Export',
		}).addEventListener('click', () => File.save({
			name: 'junker.json',
			data: JSON.stringify(this.menu.config),
		}));
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Import',
		}).addEventListener('click', () => File.pick({
			accept: 'junker.json',
		}).then(async file => {
			var data = await file.read();
			
			try{
				await this.menu.insert_config(JSON.parse(data), true);
			}catch(err){
				console.error(err);
				alert('Invalid config');
			}
		}));
		
		this.preset = utils.add_ele('select', this.config, {
			id: 'settingsPreset',
			className: 'inputGrey2',
			style: {
				'margin-left': '0px',
				'font-size': '14px',
			},
		});
		
		this.preset.addEventListener('change', () => {
			if(this.preset.value == 'Custom')return;
			
			this.menu.load_preset(this.preset.value);
		});
		
		utils.add_ele('option', this.preset, {
			value: 'Custom',
			textContent: 'Custom',
		});
		
		this.search = utils.crt_ele('input', {
			id: 'settSearch',
			type: 'text',
			placeholder: 'Search',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.search.addEventListener('input', () => {
			if(!this.search.value)return [...this.menu.window.tabs][0].show();
				
			for(let tab of this.menu.window.tabs){
				tab.hide();
				
				for(let category of tab.categories){
					category.hide();
					
					for(let control of category.controls){
						control.hide_content();
						
						if(control.name.toLowerCase().includes(this.search.value.toLowerCase())){
							control.show_content();
							tab.show_content();
							category.show();
						}
					}
				}
			}
		});
		
		this.menu.on('preset', label => utils.add_ele('option', this.preset, {
			value: label,
			textContent: label,
		}));
		
		this.menu.on('config', () => this.handle_config());
		
		this.menu.on('control', control => control.on('change', (value, init) => {
			if(!init)this.handle_config();
		}));
		
		this.menu.on('tab-shown', () => this.search.value = '');
		
		this.menu.window.header.prepend(this.config);
		this.menu.window.header.prepend(this.search);
		
		this.ready();
	}
	handle_config(){
		var string = JSON.stringify(this.menu.config);
		
		for(let preset in this.menu.presets)if(JSON.stringify(utils.assign_deep(utils.clone_obj(this.menu.presets.Default), this.menu.presets[preset])) == string)return this.preset.value = preset;
		
		this.preset.value = 'Custom';
	}
};

module.exports = SettingsAddon;

/***/ }),

/***/ "../libs/uimenu/consts.js":
/*!********************************!*\
  !*** ../libs/uimenu/consts.js ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var DataStore = __webpack_require__(/*! ../datastore */ "../libs/datastore.js"),
	Utils = __webpack_require__(/*! ../utils */ "../libs/utils.js"),
	utils = new Utils();

exports.utils = utils;

exports.store = new DataStore();

exports.tick = node => node.addEventListener('mouseenter', () => {
	try{
		playTick();
	}catch(err){}
});

/***/ }),

/***/ "../libs/uimenu/control.js":
/*!*********************************!*\
  !*** ../libs/uimenu/control.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, tick } = __webpack_require__(/*! ./consts */ "../libs/uimenu/consts.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class Control {
	constructor(data, category){
		this.data = data;
		this.name = this.data.name;
		this.category = category;
		this.menu = this.category.tab.window.menu;
		
		this.content = utils.add_ele('div', this.category.content, { className: 'settName' });
		this.label = utils.add_ele('text', this.content);
		
		this.create();
		
		this.menu.emit('control', this);
	}
	label_text(text){
		this.label.nodeValue = text;
	}
	remove(){
		this.container.remove();
	}
	walk(data){
		var state = this.menu.config,
			last_state,
			last_key;
		
		data.split('.').forEach(key => state = ((last_state = state)[last_key = key] || {}));
		
		return [ last_state, last_key ];
	}
	get value(){
		if(this.data.hasOwnProperty('value'))return this.data.value;
		
		var walked = this.walk(this.data.walk);
		
		return walked[0][walked[1]];
	}
	set value(value){
		var walked = this.walk(this.data.walk);
		
		walked[0][walked[1]] = value;
		
		this.menu.save_config();
		
		this.emit('change', value);
		
		return value;
	}
	create(){}
	interact(){
		console.warn('No defined interaction for', this);
	}
	update(init){
		if(init)this.emit('change', this.value, true);
		this.label_text(this.name);
	}
	show_content(){
		this.content.style.display = 'block';
	}
	hide_content(){
		this.content.style.display = 'none';
	}
};

EventLite.mixin(Control.prototype);

class TextElement {
	static id = 'text';
	constructor(data, section){
		this.data = data;
		this.panel = section.ui;
		this.container = utils.add_ele('div', section.node, { className: 'control' });
		this.node = utils.add_ele('div', this.container, { className: 'text' });
	}
	update(){
		this.node.textContent = this.data.name;
		
		this.node.innerHTML = this.node.innerHTML
		.replace(/\[([^\[]+)\]\(([^\)]+)\)/g, (match, text, link) => `<a href=${JSON.stringify(link)}>${text}</a>`)
		.replace(/(\*\*|__)(.*?)\1/g, (match, part, text) => `<strong>${text}</strong>`)
		.replace(/(\*|_)(.*?)\1/g, (match, part, text) => `<em>${text}</em>`)
		.replace(/\~\~(.*?)\~\~/g, (match, part, text) => `<del>${text}</del>`)
		;
	}
}

class BooleanControl extends Control {
	static id = 'boolean';
	create(){
		this.switch = utils.add_ele('label', this.content, {
			className: 'switch',
			textContent: 'Run',
			style: {
				'margin-left': '10px',
			},
		});
		
		this.checkbox = utils.add_ele('input', this.switch, { type: 'checkbox' });
		
		this.checkbox.addEventListener('change', () => this.value = this.checkbox.checked);
		
		utils.add_ele('span', this.switch, { className: 'slider' });
	}
	update(init){
		super.update(init);
		if(init)this.checkbox.checked = this.value;
	}
}

class RotateControl extends Control {
	static id = 'rotate';
	create(){
		this.select = utils.add_ele('select', this.content, { className: 'inputGrey2' });
		
		this.select.addEventListener('change', () => this.value = this.select.value);
		
		for(let [ value, label ] of this.data.vals)utils.add_ele('option', this.select, {
			value: value,
			textContent: label,
		});
	}
	update(init){
		super.update(init);
		
		if(init)this.select.value = this.value;
	}
};

class LinkControl extends Control {
	static id = 'link';
	interact(){
		window.open(this.value, '_blank');
	}
};

class FunctionControl extends Control {
	static id = 'function';
	create(){
		utils.add_ele('div', this.content, {
			className: 'settingsBtn',
			textContent: 'Run',
		}).addEventListener('click', () => this.interact());
	}
	interact(){
		this.value();
	}
};

class KeybindControl extends Control {
	static id = 'keybind';
	constructor(...args){
		super(...args);
		
		this.input = utils.add_ele('input', this.container, { className: 'keybind', placeholder: 'Press a key' });
		
		this.input.addEventListener('focus', () => {
			this.input.value = '';
		});
		
		this.input.addEventListener('blur', () => {
			this.panel.update();
			this.update();
		});
		
		this.input.addEventListener('keydown', event => {
			event.preventDefault();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});
	}
	update(){
		super.update();
		this.button.style.display = 'none';
		this.label_text(this.name + ':');
		this.input.value = this.value ? utils.string_key(this.value) : 'Unset';
	}
};

class TextBoxControl extends Control {
	static id = 'textbox';
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'inputGrey2',
			placeholder: this.data.placeholder || '',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.input.addEventListener('change', () => this.value = this.input.value);
	}
	update(init){
		super.update(init);
		
		if(init)this.input.value = this.value;
	}
};

class SliderControl extends Control {
	static id = 'slider';
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'sliderVal',
			type: 'number',
			min: this.data.range[0],
			max: this.data.range[1],
		});
		
		this.slider = utils.add_ele('input', utils.add_ele('div', this.content, {
			className: 'slidecontainer',
			style: {
				'margin-top': '-8px',
			},
		}), {
			className: 'sliderM',
			type: 'range',
			min: this.data.range[0],
			max: this.data.range[1],
			step: this.data.range[2],
		});
		
		this.input.addEventListener('focus', () => (this.input_focused = true, this.interact()));
		this.input.addEventListener('blur', () => (this.input_focused = false, this.interact()));
		
		this.slider.addEventListener('input', () => this.interact(this.value = this.slider.value));
		this.input.addEventListener('input', () => this.interact(this.value = +this.input.value));
	}
	interact(){
		var label = !this.input_focused && this.data.labels && this.data.labels[this.value] || this.value;
		
		this.input.type = typeof label == 'string' ? 'text' : 'number';
		
		this.input.value = label;
		
		this.slider.value = this.value;
	}
	update(init){
		super.update(init);
		
		this.interact();
	}
};

class ColorControl extends Control {
	static id = 'color';
	create(){
		this.input = utils.add_ele('input', this.content, {
			name: 'color',
			type: 'color',
			style: {
				float: 'right',
			},
		});
		
		this.input.addEventListener('change', () => this.value = this.input.value);
	}
	update(init){
		super.update(init);
		
		if(init)this.input.value = this.value;
	}
};

Control.Types = [
	KeybindControl,
	RotateControl,
	BooleanControl,
	FunctionControl,
	LinkControl,
	TextBoxControl,
	SliderControl,
	TextElement,
	ColorControl,
];

module.exports = Control;

/***/ }),

/***/ "../libs/uimenu/index.js":
/*!*******************************!*\
  !*** ../libs/uimenu/index.js ***!
  \*******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, store } = __webpack_require__(/*! ./consts */ "../libs/uimenu/consts.js"),
	Window = __webpack_require__(/*! ./window/ */ "../libs/uimenu/window/index.js"),
	MenuButton = __webpack_require__(/*! ./MenuButton */ "../libs/uimenu/MenuButton.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class UIMenu {
	constructor(label, icon){
		new MutationObserver((mutations, observer) => {
			for(let mutation of mutations)for(let node of mutation.addedNodes){
				if(node.id == 'menuItemContainer')this.attach(node);
				else if(node.id == 'uiBase')this.window.attach(node);
			}
		}).observe(document, { childList: true, subtree: true });
		
		this.presets = {
			Default: {},
		};
		
		this.config = {};
		
		this.addons = new Set();
		
		this.window = new Window(this);
		
		this.button = new MenuButton(label, icon);
		
		this.button.on('click', () => {
			this.window.show();
		});
		
		this.button.hide();
	}
	load_style(css){
		utils.add_ele('style', this.window.node, { textContent: css });
	}
	load_addon(addon, ...args){
		try{
			var result = new addon(this, args);
			
			this.addons.add(result);
		}catch(err){
			console.error('Error loading addon:', addon, '\n', err);
		}
	}
	attach(bar){
		this.button.attach(bar);
	}
	add_preset(label, value){
		this.presets[label] = value;
		
		this.emit('preset', label, value);
	}
	async insert_config(data, save = false){
		this.config = utils.assign_deep(utils.clone_obj(this.presets.Default), data);
		
		if(save)await this.save_config();
		
		this.window.update(true);
		
		this.emit('config');
	}
	async load_preset(preset){
		if(!this.presets.hasOwnProperty(preset))throw new Error('Invalid preset:', preset);
		
		this.insert_config(this.presets[preset], true);
	}
	async save_config(){
		await store.set('junkconfig', this.config);
	}
	async load_config(){
		this.insert_config(await store.get('junkconfig', 'object'));
	}
	static keybinds = new Set();
};

EventLite.mixin(UIMenu.prototype);

window.addEventListener('keydown', event => {
	if(event.repeat || ['TEXTAREA', 'INPUT'].includes((document.activeElement || {}).tagName))return;
	
	// some(keycode => typeof keycode == 'string' && [ keycode, keycode.replace('Digit', 'Numpad') ]
	for(let keybind of UIMenu.keybinds)if(keybind.code.includes(event.code)){
		event.preventDefault();
		keybind.interact();
	}
});

module.exports = UIMenu;

/***/ }),

/***/ "../libs/uimenu/window/index.js":
/*!**************************************!*\
  !*** ../libs/uimenu/window/index.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils } = __webpack_require__(/*! ../consts */ "../libs/uimenu/consts.js"),
	Tab = __webpack_require__(/*! ./tab */ "../libs/uimenu/window/tab.js");

class Window {
	constructor(menu){
		this.menu = menu;
		
		this.content = utils.crt_ele('div', {
			style: {
				position: 'absolute',
				width: '100%',
				height: '100%',
				left: 0,
				top: 0,
				'z-index': 1e9,
			},
		});
		
		this.node = this.content.attachShadow({ mode: 'closed' });
		
		this.styles = new Set();
		
		new MutationObserver((mutations, observer) => {
			for(let mutation of mutations)for(let node of mutation.addedNodes)if(['LINK', 'STYLE'].includes(node.tagName))this.update_styles();
		}).observe(document, { childList: true, subtree: true });
		
		this.holder = utils.add_ele('div', this.node, {
			id: 'windowHolder',
			className: 'popupWin',
			style: {
				'pointer-events': 'all',
			},
		});
		
		this.container = utils.add_ele('div', this.holder, {
			id: 'menuWindow',
			className: 'stickyHeader dark',
			style: {
				'overflow-y': 'auto',
				width: '1200px',
				'max-height': 'calc(100% - 250px)',
				top: '50%',
				transform: 'translate(-50%, -50%)',
			},
		});
		
		this.header = utils.add_ele('div', this.container, { className: 'settingsHeader' });
		
		this.holder.addEventListener('click', event => {
			if(event.target == this.holder)this.hide();
		});
		
		this.tabs = new Set();
		
		this.tab_layout = utils.add_ele('div', this.header, { id: 'settingsTabLayout' });
		
		this.hide();
	}
	update_styles(){
		for(let style of this.styles)style.remove(), this.styles.delete(style);
		
		for(let sheet of document.styleSheets){
			let style = utils.add_ele('style', this.node);
			
			this.styles.add(style);
			
			if(sheet.href)style.textContent += '@import url(' + JSON.stringify(sheet.href) + ');\n';
			else try{
				for(let rule of sheet.cssRules)style.textContent += rule.cssText + '\n';
			}catch(err){
				console.error(err);
			}
		}
	}
	add_tab(label){
		var tab = new Tab(this, label);
		
		this.tabs.add(tab);
		
		return tab;
	}
	attach(ui_base){
		ui_base.appendChild(this.content);
	}
	show(){
		this.content.style.display = 'block';
	}
	hide(){
		this.content.style.display = 'none';
	}
	get tab(){
		var first;
		
		for(let tab of this.tabs){
			first = first || tab;
			if(tab.visible)return tab;
		}
		
		return first;
	}
	update(init){
		for(let tab of this.tabs){
			tab.update(init);
			if(tab != this.tab)tab.hide();
		}
		
		this.tab.show();
	}
};

module.exports = Window;

/***/ }),

/***/ "../libs/uimenu/window/tab.js":
/*!************************************!*\
  !*** ../libs/uimenu/window/tab.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, tick } = __webpack_require__(/*! ../consts */ "../libs/uimenu/consts.js"),
	Control = __webpack_require__(/*! ../control */ "../libs/uimenu/control.js");

class Category {
	constructor(tab, label){
		this.tab = tab;
		
		this.controls = new Set();
		
		if(label){
			this.header = utils.add_ele('div', this.tab.content, {
				className: 'setHed',
			});
			
			this.header_status = utils.add_ele('span', this.header, { className: 'material-icons plusOrMinus' });
			
			utils.add_ele('text', this.header, { nodeValue: label });
			
			this.header.addEventListener('click', () => this.toggle());
		}
		
		this.content = utils.add_ele('div', this.tab.content, {
			className: 'setBodH',
		});
		
		if(label)this.expand();
	}
	update(init = false){
		for(let control of this.controls)control.update(init);
	}
	toggle(){
		if(this.collapsed)this.expand();
		else this.collapse();
	}
	collapse(){
		this.collapsed = true;
		this.update();
	}
	expand(){
		this.collapsed = false;
		this.update();
	}
	update(init){
		this.content.style.display = this.collapsed ? 'none' : 'block';
		
		if(this.header){
			this.header.style.display = 'block';
			this.header_status.textContent = 'keyboard_arrow_' + (this.collapsed ? 'right' : 'down');
		}
		
		for(let control of this.controls)control.update(init);
	}
	show(){
		this.expand();
		if(this.header)this.header.style.display = 'block';
	}
	hide(){
		this.content.style.display = 'none';
		if(this.header)this.header.style.display = 'none';
	}
	fix(){
		this.update();
		for(let control of this.controls)control.show_content();
	}
	add_control(data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(data, this);
			
			this.controls.add(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
}

class Tab {
	constructor(window, label){
		this.window = window;
		
		this.button = utils.add_ele('div', this.window.tab_layout, {
			className: 'settingTab',
			textContent: label,
		});
		
		tick(this.button);
		
		this.categories = new Set();
		
		this.content = utils.add_ele('div', window.container, { id: 'settHolder' });
		
		this.hide();
		
		this.button.addEventListener('click', () => this.show());
	}
	add_category(label){
		var category = this.last_category = new Category(this, label);
		
		this.categories.add(category);
		
		return category;
	}
	add_control(data){
		var category = this.last_category;
		
		if(!category || !category.is_default){
			category = this.add_category();
			category.is_default = true;
		}
		
		return category.add_control(data);
	}
	update(init){
		for(let category of this.categories)category.update(init);
	}
	show(){
		this.visible = true;
		for(let tab of this.window.tabs)if(tab != this)tab.hide();
		this.button.classList.add('tabANew');
		this.show_content();
		this.window.menu.emit('tab-shown');
		
		for(let category of this.categories)category.fix();
	}
	hide(){
		this.visible = false;
		this.button.classList.remove('tabANew');
		this.hide_content();
	}
	show_content(){
		this.content.style.display = 'block';
	}
	hide_content(){
		this.content.style.display = 'none';
	}
};

module.exports = Tab;

/***/ }),

/***/ "../libs/updater.js":
/*!**************************!*\
  !*** ../libs/updater.js ***!
  \**************************/
/***/ ((module) => {

"use strict";


class Updater {
	constructor(script, extracted, show_logs = false){
		this.script = script;
		this.extracted = extracted;
		this.show_logs = show_logs;
		
		this.log('Initialized');
	}
	log(...args){
		if(this.show_logs)console.info('[UPDATER]', ...args);
	}
	warn(...args){
		if(this.show_logs)console.warn('[UPDATER]', ...args);
	}
	parse_headers(script){
		var out = {},
			close = '==/UserScript==',
			header = script.slice(0, script.indexOf(close));
		
		header.replace(/@(\S+)(?: +(.*))?$/gm, (match, label, value) => {
			out[label] = label in out ? [].concat(out[label], value) : value;
		});
		
		return out;
	}
	async update(){
		location.assign(this.script);
	}
	async check(){
		var script = await(await fetch(this.script)).text();
		
		this.log('Latest script fetched from', this.script);
		
		var parsed = this.parse_headers(script),
			latest = new Date(parsed.extracted).getTime();
		
		this.log(parsed);
		
		this.log('Parsed headers:', parsed, '\nCurrent script:', this.extracted, '\nLatest script:', latest);
		
		var will_update = this.extracted < latest;
		
		if(will_update)this.log('Script will update, current script is', latest - this.extracted, ' MS behind latest');
		else this.warn('Script will NOT update');
		
		// if updated, wait 3 minutes
		return will_update;
	}
	watch(callback, interval = 60e3 * 3){
		this.log('Polling at an interval of', interval, 'MS');
		
		var run = async () => {
			if(await this.check())callback();
			else setTimeout(run, interval);
		};
		
		run();
	}
}

module.exports = Updater;

/***/ }),

/***/ "../libs/utils.js":
/*!************************!*\
  !*** ../libs/utils.js ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ./vars */ "../libs/vars.js");

class Utils {
	constructor(canvas, three, game, world){
		this.canvas = canvas;
		this.three = three;
		this.game = game;
		this.world = world;
		
		this.pi2 = Math.PI * 2;
		this.halfpi = Math.PI / 2;
		// planned mobile client
		this.mobile = [ 'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini' ].some(ua => navigator.userAgent.includes(ua));
	}
	dist_center(pos){
		return Math.hypot((window.innerWidth / 2) - pos.x, (window.innerHeight / 2) - pos.y);
	}
	is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
	normal_radian(radian){
		radian = radian % this.pi2;
		
		if(radian < 0)radian += this.pi2;
					
		return radian;
	}
	distanceTo(vec1, vec2){
		return Math.hypot(vec1.x - vec2.x, vec1.y - vec2.y, vec1.z - vec2.z);
	}
	applyMatrix4(pos, t){var e=pos.x,n=pos.y,r=pos.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return pos.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,pos.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,pos.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,pos}
	project3d(pos, camera){
		return this.applyMatrix4(this.applyMatrix4(pos, camera.matrixWorldInverse), camera.projectionMatrix);
	}
	update_frustum(){
		this.world.frustum.setFromProjectionMatrix(new this.three.Matrix4().multiplyMatrices(this.world.camera.projectionMatrix, this.world.camera.matrixWorldInverse));
	}
	update_camera(){
		this.world.camera.updateMatrix();
		this.world.camera.updateMatrixWorld();
	}
	pos2d(pos, offset_y = 0){
		if(isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z))return { x: 0, y: 0 };
		
		pos = { x: pos.x, y: pos.y, z: pos.z };
		
		pos.y += offset_y;
		
		this.update_camera();
		
		this.project3d(pos, this.world.camera);
		
		return {
			x: (pos.x + 1) / 2 * this.canvas.width,
			y: (-pos.y + 1) / 2 * this.canvas.height,
		}
	}
	obstructing(player, target, wallbangs, offset = 0){
		var d3d = this.getD3D(player.x, player.y, player.z, target.x, target.y, target.z),
			dir = this.getDir(player.z, player.x, target.z, target.x),
			dist_dir = this.getDir(this.getDistance(player.x, player.z, target.x, target.z), target.y, 0, player.y),
			ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
			ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
			af = 1 / (d3d * Math.sin(dist_dir)),
			view_y = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
		
		// iterate through game objects
		for(var ind in this.game.map.manager.objects){
			var obj = this.game.map.manager.objects[ind];
			
			if(!obj.noShoot && obj.active && (wallbangs ? !obj.penetrable : true)){
				var in_rect = this.lineInRect(player.x, player.z, view_y, ad, ae, af, obj.x - Math.max(0, obj.width - offset), obj.z - Math.max(0, obj.length - offset), obj.y - Math.max(0, obj.height - offset), obj.x + Math.max(0, obj.width - offset), obj.z + Math.max(0, obj.length - offset), obj.y + Math.max(0, obj.height - offset));
				
				if(in_rect && 1 > in_rect)return in_rect;
			}
		}
		
		// iterate through game terrain
		if(this.game.map.terrain){
			var al = this.game.map.terrain.raycast(player.x, -player.z, view_y, 1 / ad, -1 / ae, 1 / af);
			if(al)return this.getD3D(player.x, player.y, player.z, al.x, al.z, -al.y);
		}
	}
	getDistance(x1, y1, x2, y2){
		return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
	}
	getD3D(x1, y1, z1, x2, y2, z2){
		var dx = x1 - x2,
			dy = y1 - y2,
			dz = z1 - z2;
		
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}
	getXDire(x1, y1, z1, x2, y2, z2){
		return Math.asin(Math.abs(y1 - y2) / this.getD3D(x1, y1, z1, x2, y2, z2)) * ((y1 > y2) ? -1 : 1);
	}
	getDir(x1, y1, x2, y2){
		return Math.atan2(y1 - y2, x1 - x2)
	}
	lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2){
		var t1 = (x1 - lx1) * dx,
			t2 = (x2 - lx1) * dx,
			t3 = (y1 - ly1) * dy,
			t4 = (y2 - ly1) * dy,
			t5 = (z1 - lz1) * dz,
			t6 = (z2 - lz1) * dz,
			tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
			tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
		
		return (tmax < 0 || tmin > tmax) ? false : tmin;
	}
	getAngleDst(a1, a2){
		return Math.atan2(Math.sin(a2 - a1), Math.cos(a1 - a2));
	}
	// box = Box3
	box_size(obj, box){
		var vFOV = this.world.camera.fov * Math.PI / 180;
		var h = 2 * Math.tan( vFOV / 2 ) * this.world.camera.position.z;
		var aspect = this.canvas.width / this.canvas.height;
		var w = h * aspect;
		
		return { width: width, height: height};
	}
	contains_point(point){
		for(var ind = 0; ind < 6; ind++)if(this.world.frustum.planes[ind].distanceToPoint(point) < 0)return false;
		return true;
	}
	camera_world(){
		var matrix_copy = this.world.camera.matrixWorld.clone(),
			pos = this.world.camera[vars.getWorldPosition]();
		
		this.world.camera.matrixWorld.copy(matrix_copy);
		this.world.camera.matrixWorldInverse.copy(matrix_copy).invert();
		
		return pos.clone();
	}
	request_frame(callback){
		requestAnimationFrame(callback);
	}
	round(n, r){
		return Math.round(n * Math.pow(10, r)) / Math.pow(10, r);
	}
	wait_for(check, time){
		return new Promise(resolve => {
			var interval,
				run = () => {
					try{
						var result = check();
						
						if(result){
							if(interval)clearInterval(interval);
							resolve(result);
							
							return true;
						}
					}catch(err){console.log(err)}
				};
			
			interval = run() || setInterval(run, time || 50);
		});
	}
	css(obj){
		var string = [];
		
		for(var name in obj)string.push(name + ':' + obj[name] + ';');
		
		return string.join('\n');
	}
	sanitize(string){
		var node = document.createElement('div');
		
		node.textContent = string;
		
		return node.innerHTML;
	}
	unsanitize(string){
		var node = document.createElement('div');
		
		node.innerHTML = string;
		
		return node.textContent;
	}
	node_tree(nodes, parent = document){
		var output = {
				parent: parent,
			},
			match_container = /^\$\s+>?/g,
			match_parent = /^\^\s+>?/g;
		
		for(var label in nodes){
			var value = nodes[label];
			
			if(value instanceof Node)output[label] = value;
			else if(typeof value == 'object')output[label] = this.node_tree(value, output.container);
			else if(match_container.test(nodes[label])){
				if(!output.container){
					console.warn('No container is available, could not access', value);
					continue;
				}
				
				output[label] = output.container.querySelector(nodes[label].replace(match_container, ''));
			}else if(match_parent.test(nodes[label])){
				if(!output.parent){
					console.warn('No parent is available, could not access', value);
					continue;
				}
				
				output[label] = output.parent.querySelector(nodes[label].replace(match_parent, ''));
			}else output[label] = parent.querySelector(nodes[label]);
			
			if(!output[label])console.warn('No node found, could not access', value);
		}
		
		return output;
	}
	add_ele(node_name, parent, attributes = {}){
		if(node_name == 'text')return parent.appendChild(Object.assign(document.createTextNode(''), attributes));
		
		if(attributes.style != null && typeof attributes.style == 'object')attributes.style = this.css(attributes.style);
		
		return Object.assign(parent.appendChild(document.createElement(node_name)), attributes);
	}
	crt_ele(node_name, attributes = {}){
		if(attributes.style != null && typeof attributes.style == 'object')attributes.style = this.css(attributes.style);
		
		return Object.assign(document.createElement(node_name), attributes);
	}
	string_key(key){
		return key.replace(/^(Key|Digit|Numpad)/, '');
	}
	// Junker
	
	isType(item, type){
		return typeof item === type;
	}
	isDefined(object){
		return !this.isType(object, "undefined") && object !== null;
	}
	isURL(str){
		return /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str);
	}
	objectHas(obj, arr){
		return arr.some(prop => obj.hasOwnProperty(prop));
	}
	createObserver(elm, check, callback, onshow = true){
		return new MutationObserver((mutationsList, observer) => {
			if (check == 'src' || onshow && mutationsList[0].target.style.display == 'block' || !onshow) {
				callback(mutationsList[0].target);
			}
		}).observe(elm, check == 'childList' ? {childList: true} : {attributes: true, attributeFilter: [check]});
	}
	createElement(element, attribute, inner){
		if (!this.isDefined(element)) {
			return null;
		}
		if (!this.isDefined(inner)) {
			inner = "";
		}
		let el = document.createElement(element);
		if (this.isType(attribute, 'object')) {
			for (let key in attribute) {
				el.setAttribute(key, attribute[key]);
			}
		}
		if (!Array.isArray(inner)) {
			inner = [inner];
		}
		for (let i = 0; i < inner.length; i++) {
			if (inner[i].tagName) {
				el.appendChild(inner[i]);
			} else {
				el.appendChild(document.createTextNode(inner[i]));
			}
		}
		return el;
	}
	clone_obj(obj){
		return JSON.parse(JSON.stringify(obj));
	}
	assign_deep(target, ...objects){
		for(let ind in objects)for(let key in objects[ind]){
			if(typeof objects[ind][key] == 'object' && objects[ind][key] != null && key in target)this.assign_deep(target[key], objects[ind][key]);
			else if(typeof target == 'object' && target != null)Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(objects[ind], key))
		}
		
		return target;
	}
}

module.exports = Utils;

/***/ }),

/***/ "../libs/vars.js":
/*!***********************!*\
  !*** ../libs/vars.js ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/*
Source: https://api.sys32.dev/v2/source

Notes:
	- Versions past 3.9.2 don't have variable randomization
	- Keep regexes updated
*/

var vars = new Map(),
	patches = new Map(),
	add_var = (label, regex, index) => vars.set(label, [ regex, index ]),
	add_patch = (label, regex, replacement) => patches.set(label, [ regex, replacement ]),
	key = '_' + Math.random().toString().substr(2);

add_var('build', /\.exports='(\w{5})'/, 1);

add_var('inView', /&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/, 1);

add_var('spectating', /team:window\.(\w+)/, 1);

add_var('nAuto', /'Single Fire',varN:'(\w+)'/, 1);

add_var('xDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/, 1);

add_var('yDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/, 1);

add_var('procInputs', /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, 1);

add_var('isYou', /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, 1);

add_var('pchObjc', /0,this\.(\w+)=new \w+\.Object3D,this/, 1);

add_var('aimVal', /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, 1),

add_var('crouchVal', /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, 1),

add_var('didShoot', /--,\w+\.(\w+)=!0/, 1);

add_var('ammos', /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, 1);

add_var('weaponIndex', /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, 1);

add_var('maxHealth', /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, 1),

add_var('yVel', /\w+\.(\w+)&&\(\w+\.y\+=\w+\.\1\*/, 1);

add_var('mouseDownR', /this\.(\w+)=0,this\.keys=/, 1);

add_var('recoilAnimY', /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, 1),

add_var('objInstances', /lowerBody\),\w+\|\|\w+\.(\w+)\./, 1),

add_var('getWorldPosition', /var \w+=\w+\.camera\.(\w+)\(\);/, 1);

add_patch('Skins', /((?:[a-zA-Z]+(?:\.|(?=\.skins)))+)\.skins(?!=)/g, (match, player) => `${key}.skins(${player})`);

add_patch('Nametags', /(&&)((\w+)\.cnBSeen)(?=\){if\(\(\w+=\3\.objInstances)/, (match, start, can_see) => `${start}${key}.can_see(${can_see})`);

add_patch('Game', /(\w+)\.moveObj=func/, (match, game) => `${key}.game(${game}),${match}`);

add_patch('World', /(\w+)\.backgroundScene=/, (match, world) => `${key}.world(${world}),${match}`);

add_patch('Input', /((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/, (match, func, array, input, end) => `${func}${key}.input(${input})${end}`);

add_patch('Timer', /(\w+\.exports)\.(kickTimer)=([\dex]+)/, (match, object, property, value) => `${key}.timer(${object},"${property}",${value})`);

add_patch('ThreeJS', /\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${key}.three(${three});`);

exports.patch = source => {
	var found = {},
		missing = {};
	
	for(var [ label, [ regex, index ] ] of vars){
		var value = (source.match(regex) || 0)[index];
		
		if(value)exports[label] = found[label] = value;
		else missing[label] = [ regex, index ];
	}
	
	console.log('Found:');
	console.table(found);
	
	console.log('Missing:');
	console.table(missing);
	
	for(var [ label, [ input, replacement ] ] of patches){
		if(!source.match(input))console.error('Could not patch', label);
		
		source = source.replace(input, replacement);
	}
	
	return source;
};

exports.key = key;

// Input keys
/*
[
	controls.getISN(),
	Math.round(delta * game.config.deltaMlt),
	Math.round(1000 * controls.yDr.round(3)),
	Math.round(1000 * xDr.round(3)),
	game.moveLock ? -1 : config.movDirs.indexOf(controls.moveDir),
	controls.mouseDownL || controls.keys[controls.binds.shoot.val] ? 1 : 0,
	controls.mouseDownR || controls.keys[controls.binds.aim.val] ? 1 : 0,
	!Q.moveLock && controls.keys[controls.binds.jump.val] ? 1 : 0,
	controls.keys[controls.binds.reload.val] ? 1 : 0,
	controls.keys[controls.binds.crouch.val] ? 1 : 0,
	controls.scrollToSwap ? controls.scrollDelta * ue.tmp.scrollDir : 0,
	controls.wSwap,
	1 - controls.speedLmt.round(1),
	controls.keys[controls.binds.reset.val] ? 1 : 0,
	controls.keys[controls.binds.interact.val] ? 1 : 0
];
*/

exports.keys = { frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12, speed_limit: 13, reset: 14, interact: 15 };

exports.consts = {
	twoPI: Math.PI * 2,
	halfPI: Math.PI / 2,
	playerHeight: 11,
	cameraHeight: 1.5,
	headScale: 2,
	armScale: 1.3,
	armInset: 0.1,
	chestWidth: 2.6,
	hitBoxPad: 1,
	crouchDst: 3,
	recoilMlt: 0.3,
	nameOffset: 0.6,
	nameOffsetHat: 0.8,
};

exports.load = loader => {
	loader(add_var, add_patch, exports.key);
};

/***/ }),

/***/ "../libs/visual.js":
/*!*************************!*\
  !*** ../libs/visual.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ../libs/vars */ "../libs/vars.js"),
	{ utils } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js");

class Visual {
	constructor(cheat){
		this.cheat = cheat;
		this.materials = {};
	}
	tick(UI){
		this.canvas = UI.canvas;
		this.ctx = UI.ctx;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	draw_text(text_x, text_y, font_size, lines){
		for(var text_index = 0; text_index < lines.length; text_index++){
			var line = lines[text_index], xoffset = 0;
			
			for(var sub_ind = 0; sub_ind < line.length; sub_ind++){
				var color = line[sub_ind][0],
					text = line[sub_ind][1],
					text_args = [ text, text_x + xoffset, text_y + text_index * (font_size + 2) ];
				
				this.ctx.fillStyle = color;
				this.ctx.strokeText(...text_args);
				this.ctx.fillText(...text_args);
				
				xoffset += this.ctx.measureText(text).width + 2;
			}
		}
	}
	fov(fov){
		var width = (this.canvas.width * fov) / 100,
			height = (this.canvas.height * fov) / 100;
		
		this.ctx.fillStyle = '#F00';
		this.ctx.globalAlpha = 0.4;
		this.ctx.fillRect((this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
		this.ctx.globalAlpha = 1;
	}
	walls(){
		this.cheat.world.scene.children.forEach(obj => {
			if(obj.type != 'Mesh' || !obj.dSrc || obj.material[Visual.hooked])return;
			
			obj.material[Visual.hooked] = true;
			
			var otra = obj.material.transparent,
				opac = obj.material.opacity;
			
			Object.defineProperties(obj.material, {
				opacity: {
					get: _ => opac * this.cheat.config.esp.walls / 100,
					set: _ => opac = _,
				},
				transparent: {
					get: _ => this.cheat.config.esp.walls != 100 ? true : otra,
					set: _ => otra = _,
				},
			});
		});
	}
	axis_join(player){
		return player ? ['x', 'y', 'z'].map(axis => axis + ': ' + player[axis].toFixed(2)).join(', ') : null;
	}
	overlay(){
		this.ctx.strokeStyle = '#000'
		this.ctx.font = 'bold 14px inconsolata, monospace';
		this.ctx.textAlign = 'start';
		this.ctx.lineWidth = 2.6;
		
		var data = {
			Player: this.cheat.player ? this.axis_join(this.cheat.player.position) : null,
			PlayerV: this.cheat.player ? this.axis_join(this.cheat.player.velocity) : null,
			Target: this.cheat.target ? this.axis_join(this.cheat.target.position) : null,
		};
		
		var lines = [];
		
		for(var key in data){
			var color = '#FFF',
				value = data[key];
			
			switch(typeof value){
				case'boolean':
					
					color = value ? '#0F0' : '#F00';
					value = value ? 'Yes' : 'No';
					
					break;
				case'number':
					
					color = '#00F';
					value = value.toFixed(2);
					
					break;
				case'object':
					
					value = 'N/A';
					
					break;
			}
			
			lines.push([ [ '#BBB', key + ': ' ], [ color, value ] ]);
		}
		
		this.draw_text(15, ((this.canvas.height / 2) - (lines.length * 14)  / 2), 14, lines);
	}
	box(player){
		this.ctx.strokeStyle = player.esp_color;
		this.ctx.lineWidth = 1.5;
		this.ctx.strokeRect(player.rect.left, player.rect.top, player.rect.width, player.rect.height);
	}
	tracer(player){
		this.ctx.strokeStyle = player.esp_color;
		this.ctx.lineWidth = 1.75;
		this.ctx.lineCap = 'round';
		
		this.ctx.beginPath();
		// bottom center
		this.ctx.moveTo(this.canvas.width / 2, this.canvas.height);
		// target center
		this.ctx.lineTo(player.rect.x, player.rect.bottom);
		this.ctx.stroke();
	}
	get can_draw_chams(){
		return this.cheat.config.esp.status == 'chams' || this.cheat.config.esp.status == 'box_chams' || this.cheat.config.esp.status == 'full';
	}
	cham(player){
		if(!player.obj[Visual.hooked]){
			player.obj[Visual.hooked] = true;
			
			let visible = true;
			
			Object.defineProperty(player.obj, 'visible', {
				get: _ => this.can_draw_chams || visible,
				set: _ => visible = _,
			});
		}
		
		player.obj.traverse(obj => {
			if(obj.type != 'Mesh' || obj[Visual.hooked])return;
			
			obj[Visual.hooked] = true;
			
			var orig_mat = obj.material;
			
			Object.defineProperty(obj, 'material', {
				get: _ => {
					var material = this.can_draw_chams ? (this.materials[player.esp_color] || (this.materials[player.esp_color] = new utils.three.MeshBasicMaterial({
						transparent: true,
						fog: false,
						depthTest: false,
						color: player.esp_color,
					}))) : orig_mat;
					
					material.wireframe = !!this.cheat.config.game.wireframe;
					
					return material;
				},
				set: _ => orig_mat = _,
			});
		});
	}
	label(player){
		for(var part in player.parts){
			var srcp = utils.pos2d(player.parts[part]);
			this.ctx.fillStyle = '#FFF';
			this.ctx.font = '13px monospace thin';
			this.ctx.fillRect(srcp.x - 2, srcp.y - 2, 4, 4);
			this.ctx.fillText(part, srcp.x, srcp.y - 6);
		}
	}
	health(player){
		this.ctx.save();
		this.ctx.scale(...player.box_scale);
		
		var rect = player.scale_rect(...player.box_scale);
		
		this.ctx.fillStyle = player.hp_color;
		this.ctx.fillRect(rect.left - 30, rect.top, 25, rect.height);
		
		this.ctx.restore();
	}
	text(player){
		this.ctx.save();
		this.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale),
			font_size = 13;
		
		this.ctx.font = 'Bold ' + font_size + 'px Tahoma';
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 2.5;
		this.ctx.textBaseline = 'top';
		
		var text = [
			[
				[ '#FB8', player.alias ],
				[ '#FFF', player.clan ? ' [' + player.clan + ']' : '' ],
			],
			[
				[ player.hp_color, player.health + '/' + player.max_health + ' HP' ],
			],
			[
				[ '#FFF', player.weapon.name ],
				[ '#BBB', '[' ],
				[ '#FFF', player.ammo ],
				[ '#BBB', '/' ],
				[ '#FFF', player.max_ammo ],
				[ '#BBB', ']' ],
			],
		]
		
		if(player.target)text.push([ [ '#00F', 'Target' ] ]);
		
		this.draw_text(rect.right + 4, rect.top, font_size, text);
		
		this.ctx.restore();
	}
};

Visual.hooked = Symbol();

module.exports = Visual;

/***/ }),

/***/ "./index.css":
/*!*******************!*\
  !*** ./index.css ***!
  \*******************/
/***/ ((module) => {

module.exports="body.hide-news #newsHolder,body.hide-security #onetrust-consent-sdk,body.hide-merch #merchHolder,body.hide-streams #streamContainer,body.hide-adverts #aContainer,body.hide-adverts #aHolder,body.hide-adverts #endAContainer,body.hide-adverts #aMerger{display:none!important}"

/***/ }),

/***/ "../libs/uimenu/addons/discord.css":
/*!*****************************************!*\
  !*** ../libs/uimenu/addons/discord.css ***!
  \*****************************************/
/***/ ((module) => {

module.exports="*{outline:none}.content.invalid .name{color:#f04747}.content.invalid .icon{background:var(--image-fail) 50% / 50px 26px no-repeat}.content{display:flex;--size-big: 24px;--size-small: 16px;--image-fail: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22104%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cdefs%3E%3Cpath%20id%3D%22a%22%20d%3D%22M0%2086V.34h186.092V86z%22%2F%3E%3Cpath%20id%3D%22c%22%20d%3D%22M.8.998h47.02v48.524H.8V.998z%22%2F%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20fill%3D%22%234F545C%22%20d%3D%22M92.824%2075.14c4.414-3.337%2010.597-3.36%2015.037-.06.45.33.58.983.25%201.425-.33.445-.91.566-1.36.24l-.07-.056c-3.73-2.78-8.93-2.76-12.64.04-.18.13-.39.2-.6.2-.3%200-.6-.14-.8-.4-.33-.44-.24-1.07.2-1.4M77.17%2057.4c2.882%200%205.218%202.335%205.218%205.217%200%202.88-2.336%205.215-5.217%205.215-2.88%200-5.21-2.336-5.21-5.216%200-2.883%202.34-5.22%205.22-5.22m46.96%200c2.88%200%205.22%202.337%205.22%205.22%200%202.88-2.33%205.215-5.21%205.215s-5.21-2.33-5.21-5.21%202.34-5.22%205.22-5.22m8.06%2017.53c.49-.06.98-.16%201.46-.28.54-.14%201.09.17%201.23.71.15.53-.17%201.08-.7%201.23-.56.15-1.15.27-1.73.34-.04.01-.08.01-.12.01-.49%200-.93-.37-.99-.87-.07-.54.32-1.04.87-1.11M83.06%2019.32c-2.836.682-4.57%201.29-4.963%201.43l-.063.03c-3.54%201.43-5.83%204.822-5.83%208.636%200%202.096.72%204.1%202.08%205.797.01.01.014.023.02.03.004.007.01.01.014.014.028.038%202.78%203.767%207.73%204.16.55.042.96.524.917%201.075-.04.523-.477.92-.994.92-.02%200-.05%200-.08-.002-4.65-.37-7.59-3.135-8.7-4.382l-1.13.423c-.04.02-.08.04-.12.05-6.31%202.36-10.39%207.92-10.39%2014.17%200%202.61.74%205.2%202.13%207.48.15.25.19.55.11.82-.08.28-.28.5-.54.62-7.74%203.47-12.74%2011-12.74%2019.2%200%2011.71%209.83%2021.23%2021.9%2021.23%207.97%200%2016.76-1.53%2026.13-4.56.74-.32%209.7-4.12%2022.44-3.55.55.03.98.49.96%201.05-.02.56-.47%201.01-1.04.96-8.77-.39-15.78%201.41-19.24%202.55%206.46%202.37%2015.69%203.58%2027.5%203.58%2010.68%200%2019.37-8.68%2019.37-19.37%200-4.99-1.97-9.78-5.43-13.38-.79%201.86-2.52%204.96-5.73%206.95-.16.1-.34.15-.52.15-.33%200-.66-.17-.85-.47-.29-.47-.14-1.08.33-1.37%203.99-2.46%205.35-7.07%205.42-7.29%201-4.35.59-8.76-1.22-13.11-1.02-2.46-2.5-4.68-4.37-6.6-.37-.39-.37-1%200-1.382-.91-.85-1.89-1.62-2.92-2.31-.43%201.16-2.4%205.34-8.68%206.71-.07.013-.14.02-.21.02-.46%200-.87-.32-.97-.786-.12-.54.228-1.077.768-1.19%205.89-1.28%207.2-5.34%207.28-5.59.856-3.22.57-6.5-.854-9.755-2.04-4.65-6.38-8.04-11.68-9.17-.86%201.27-3.14%203.95-7.79%205.02-.07.02-.15.025-.22.025-.457%200-.87-.318-.976-.78-.126-.54.21-1.07.75-1.2%204.96-1.14%206.693-4.335%206.832-4.61.68-1.58.702-3.36.06-5.28-1.156-3.47-3.94-4.165-7.8-5.12-4.15-1.03-9.27-2.3-13.7-7.75-3.86%202.694-7.59%208.2-7.137%2012.49.25%202.43%201.83%204.155%204.68%205.135.52.18.8.74.62%201.27-.18.52-.75.8-1.27.62-3.66-1.26-5.175-3.45-5.75-5.42-1.22.22-2.33.45-3.33.68.123.53-.205%201.07-.74%201.2%22%2F%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M198%2094.104h-6c-.552%200-1%20.447-1%201%200%20.553.448%201%201%201h6c.552%200%201-.447%201-1%200-.553-.448-1-1-1%22%2F%3E%3Cg%20transform%3D%22translate(0%2017.002)%22%3E%3Cmask%20id%3D%22b%22%20fill%3D%22%23fff%22%3E%3Cuse%20xlink%3Ahref%3D%22%23a%22%2F%3E%3C%2Fmask%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M185.092%2077.102h-29.38c-3.894%200-6.745-3.65-5.818-7.433.396-1.62.606-3.31.606-5.04%200-5.14-1.873-10.09-5.212-13.96-.9-1.04-1.33-2.39-1.188-3.75.4-3.87-.202-7.83-1.78-11.61-1.124-2.7-2.736-5.13-4.79-7.23-.386-.4-1.02-.41-1.414-.02-.01.01-.012.02-.02.03-.37.38-.373.99.004%201.38%201.876%201.92%203.348%204.14%204.375%206.6%201.813%204.35%202.224%208.75%201.224%2013.11-.07.21-1.43%204.83-5.42%207.29-.47.29-.62.9-.33%201.37.19.31.51.47.85.47.18%200%20.36-.05.52-.15%201.11-.69%202.05-1.51%202.83-2.37%201.96-2.17%205.48-1.66%206.67%201.02%201.08%202.43%201.66%205.08%201.66%207.79%200%2010.68-8.69%2019.37-19.37%2019.37-3.54%200-6.85-.11-9.92-.33-3.77-.26-3.57-5.91.21-5.84.48.01.96.02%201.45.05.56.05%201.02-.4%201.04-.96.02-.55-.4-1.02-.95-1.05-12.74-.58-21.7%203.23-22.44%203.55-9.34%203.06-18.13%204.6-26.1%204.6-12.08%200-21.9-9.52-21.9-21.23%200-8.2%204.99-15.73%2012.73-19.2.26-.12.46-.34.54-.62.08-.28.04-.58-.11-.82-1.4-2.28-2.13-4.87-2.13-7.48%200-.32.01-.63.03-.93.52-7.99%208.85-12.91%2016.4-10.24%201.27.45%202.61.8%203.91.9h.08c.52%200%20.95-.4%201-.92.05-.55-.36-1.04-.91-1.08-4.95-.39-7.7-4.12-7.73-4.16%200-.01-.01-.01-.01-.01%200-.01-.01-.02-.02-.03-1.36-1.7-2.08-3.7-2.08-5.8%200-3.82%202.29-7.21%205.83-8.64l.07-.03c.39-.15%202.13-.75%204.96-1.44.54-.13.87-.67.74-1.2-.13-.53-.67-.86-1.2-.73-3.36.81-5.21%201.51-5.29%201.54-.04.01-.07.03-.11.05-4.24%201.77-6.98%205.86-6.98%2010.46%200%202.11.6%204.14%201.73%205.94l-.7.26c-.04.01-.08.03-.12.05-7.03%202.68-11.57%208.95-11.57%2016%200%201.48.21%202.95.62%204.38.54%201.89-.21%203.89-1.81%205.03-6.09%204.32-9.84%2011.26-9.84%2018.7%200%202.32.35%204.55%201%206.66%201.18%203.82-1.8%207.66-5.8%207.66H1c-.552%200-1%20.45-1%201%200%20.552.448%201%201%201h52.866c.95%200%201.873.33%202.588.96C60.687%2083.75%2066.278%2086%2072.4%2086c8.084%200%2016.968-1.532%2026.413-4.554C105.65%2084.51%20115.573%2086%20129.13%2086c5.654%200%2010.786-2.22%2014.61-5.818.737-.694%201.71-1.08%202.724-1.08h38.628c.552%200%201-.447%201-1%200-.553-.448-1-1-1%22%20mask%3D%22url(%23b)%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86%20.002)%22%3E%3Cmask%20id%3D%22d%22%20fill%3D%22%23fff%22%3E%3Cuse%20xlink%3Ahref%3D%22%23c%22%2F%3E%3C%2Fmask%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M1.123%2017.434c.577%201.977%202.092%204.162%205.748%205.42.53.177%201.1-.1%201.28-.62.18-.524-.1-1.093-.62-1.272-2.85-.98-4.43-2.708-4.68-5.132-.3-2.923%201.32-6.403%203.61-9.177%201.57-1.903%204.4-2.09%206.29-.498%203.71%203.132%207.64%204.107%2010.95%204.93%203.86.956%206.64%201.648%207.8%205.12.64%201.924.62%203.702-.06%205.284-.14.27-1.87%203.46-6.83%204.6-.53.12-.87.66-.75%201.2.11.46.52.77.98.77.08%200%20.15-.01.23-.03%201.41-.33%202.6-.8%203.6-1.34%205.78-3.1%2013.11-.63%2015.81%205.35l.06.14c1.43%203.25%201.71%206.53.85%209.75-.07.25-1.39%204.31-7.27%205.59-.54.12-.88.65-.76%201.19.1.47.52.79.98.79.07%200%20.14-.01.22-.02%206.28-1.37%208.25-5.55%208.68-6.72.06-.17.09-.27.1-.3v-.02c.97-3.62.64-7.45-.95-11.08-2.24-5.12-6.93-8.88-12.68-10.24.48-1.74.39-3.61-.27-5.59-1.51-4.52-5.25-5.45-9.22-6.43-4.23-1.05-9.03-2.24-13.15-7.75-.31-.41-.87-.52-1.31-.26C4.96%203.97.28%2010.64.85%2016.03c.046.446.133.917.275%201.4%22%20mask%3D%22url(%23d)%22%2F%3E%3C%2Fg%3E%3Cpath%20fill%3D%22%23202225%22%20d%3D%22M132.188%2074.923c-.548.07-.936.57-.867%201.117.07.506.5.875%201%20.875.04%200%20.09-.003.13-.008.59-.073%201.17-.188%201.73-.34.54-.145.85-.695.71-1.228-.14-.54-.69-.85-1.22-.71-.47.13-.96.22-1.46.28M77.17%2057.4c-2.88%200-5.217%202.336-5.217%205.218%200%202.88%202.336%205.217%205.217%205.217%202.88%200%205.217-2.336%205.217-5.217%200-2.882-2.336-5.218-5.217-5.218m41.743%205.218c0%202.88%202.336%205.217%205.218%205.217s5.22-2.336%205.22-5.217c0-2.882-2.33-5.218-5.21-5.218s-5.21%202.336-5.21%205.218M92.83%2075.14c-.44.334-.526.962-.193%201.402.195.26.495.397.797.397.21%200%20.42-.07.603-.21%203.71-2.81%208.91-2.83%2012.645-.05l.077.05c.44.32%201.03.2%201.36-.24.33-.44.2-1.1-.25-1.43-4.44-3.3-10.62-3.28-15.04.06m68.33-24.76h.51c.55%200%201%20.44%201%201v.51c0%20.55.45%201%201%201s1-.45%201-1v-.51c0-.56.45-1%201-1h.51c.55%200%201-.45%201-1%200-.56-.45-1-1-1h-.51c-.55%200-1-.45-1-1v-.51c0-.55-.45-1-1-1s-1%20.45-1%201v.51c0%20.55-.45%201-1%201h-.51c-.55%200-1%20.44-1%201%200%20.55.45%201%201%201M21.69%2043.75c.834%200%201.51.676%201.51%201.51%200%20.553.448%201%201%201%20.553%200%201-.447%201-1%200-.834.676-1.51%201.51-1.51.553%200%201-.447%201-1%200-.553-.447-1-1-1-.834%200-1.51-.676-1.51-1.51%200-.552-.447-1-1-1-.552%200-1%20.448-1%201%200%20.834-.676%201.51-1.51%201.51-.552%200-1%20.447-1%201%200%20.553.448%201%201%201M157.3%2018.52c.256%200%20.512-.1.707-.294l1.184-1.184c.39-.39.39-1.023%200-1.414-.39-.39-1.02-.39-1.41%200l-1.18%201.184c-.39.39-.39%201.023%200%201.414.2.195.45.293.71.293m-5.91%205.91c.26%200%20.51-.1.71-.3l1.19-1.19c.39-.39.39-1.03%200-1.42-.39-.39-1.02-.39-1.41%200l-1.18%201.18c-.39.39-.39%201.02%200%201.41.2.19.45.29.71.29m6.39-.3c.2.19.45.29.71.29.26%200%20.51-.1.71-.3.39-.39.39-1.02%200-1.41l-1.18-1.19c-.39-.39-1.02-.39-1.41%200-.39.39-.39%201.03%200%201.42l1.19%201.18zm-5.91-5.92c.2.2.45.29.71.29.26%200%20.51-.1.71-.3.39-.39.39-1.02%200-1.42l-1.18-1.19c-.39-.39-1.02-.39-1.41%200-.39.39-.39%201.023%200%201.413l1.19%201.18zM45.6%2020.84c.83%200%201.51.68%201.51%201.51%200%20.837-.68%201.51-1.51%201.51-.832%200-1.51-.673-1.51-1.51%200-.83.678-1.51%201.51-1.51m0%205.02c1.937%200%203.51-1.57%203.51-3.51%200-1.932-1.573-3.51-3.51-3.51-1.934%200-3.51%201.578-3.51%203.51%200%201.94%201.576%203.51%203.51%203.51%22%2F%3E%3Cpath%20d%3D%22M0%200h200v104H0z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')}.info{flex:1 1 auto;min-width:1px;flex-direction:column;flex-wrap:nowrap;display:flex;align-items:stretch;justify-content:center;text-indent:0}.icon{background:#36393f center / cover;margin-right:16px;width:65px;height:65px;border-radius:16px;text-align:center;color:#dcddde;position:relative}.name{min-width:0px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;align-items:center;display:flex;color:#FFF;margin-bottom:2px;font-size:var(--size-big)}.join{text-decoration:none;margin-left:auto;white-space:nowrap;border-radius:3px;font-size:var(--size-small);padding:0px 20px;user-select:none;color:#FFF;background:#3ba55d;cursor:pointer;align-items:center;display:flex}.status{display:flex;align-items:center;margin-left:16px;color:#b9bbbe;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:var(--size-small);white-space:pre-wrap}.status::before{content:'';display:inline-block;margin-right:4px;width:8px;height:8px;border-radius:50%}.status.online::before{background:#43b581}.status.total::after{content:' Members'}.status.online::after{content:' Online'}.status.total::before{background:#747f8d}.content.invalid .status{display:none}"

/***/ }),

/***/ "../node_modules/event-lite/event-lite.js":
/*!************************************************!*\
  !*** ../node_modules/event-lite/event-lite.js ***!
  \************************************************/
/***/ ((module) => {

/**
 * event-lite.js - Light-weight EventEmitter (less than 1KB when gzipped)
 *
 * @copyright Yusuke Kawasaki
 * @license MIT
 * @constructor
 * @see https://github.com/kawanet/event-lite
 * @see http://kawanet.github.io/event-lite/EventLite.html
 * @example
 * var EventLite = require("event-lite");
 *
 * function MyClass() {...}             // your class
 *
 * EventLite.mixin(MyClass.prototype);  // import event methods
 *
 * var obj = new MyClass();
 * obj.on("foo", function() {...});     // add event listener
 * obj.once("bar", function() {...});   // add one-time event listener
 * obj.emit("foo");                     // dispatch event
 * obj.emit("bar");                     // dispatch another event
 * obj.off("foo");                      // remove event listener
 */

function EventLite() {
  if (!(this instanceof EventLite)) return new EventLite();
}

(function(EventLite) {
  // export the class for node.js
  if (true) module.exports = EventLite;

  // property name to hold listeners
  var LISTENERS = "listeners";

  // methods to export
  var methods = {
    on: on,
    once: once,
    off: off,
    emit: emit
  };

  // mixin to self
  mixin(EventLite.prototype);

  // export mixin function
  EventLite.mixin = mixin;

  /**
   * Import on(), once(), off() and emit() methods into target object.
   *
   * @function EventLite.mixin
   * @param target {Prototype}
   */

  function mixin(target) {
    for (var key in methods) {
      target[key] = methods[key];
    }
    return target;
  }

  /**
   * Add an event listener.
   *
   * @function EventLite.prototype.on
   * @param type {string}
   * @param func {Function}
   * @returns {EventLite} Self for method chaining
   */

  function on(type, func) {
    getListeners(this, type).push(func);
    return this;
  }

  /**
   * Add one-time event listener.
   *
   * @function EventLite.prototype.once
   * @param type {string}
   * @param func {Function}
   * @returns {EventLite} Self for method chaining
   */

  function once(type, func) {
    var that = this;
    wrap.originalListener = func;
    getListeners(that, type).push(wrap);
    return that;

    function wrap() {
      off.call(that, type, wrap);
      func.apply(this, arguments);
    }
  }

  /**
   * Remove an event listener.
   *
   * @function EventLite.prototype.off
   * @param [type] {string}
   * @param [func] {Function}
   * @returns {EventLite} Self for method chaining
   */

  function off(type, func) {
    var that = this;
    var listners;
    if (!arguments.length) {
      delete that[LISTENERS];
    } else if (!func) {
      listners = that[LISTENERS];
      if (listners) {
        delete listners[type];
        if (!Object.keys(listners).length) return off.call(that);
      }
    } else {
      listners = getListeners(that, type, true);
      if (listners) {
        listners = listners.filter(ne);
        if (!listners.length) return off.call(that, type);
        that[LISTENERS][type] = listners;
      }
    }
    return that;

    function ne(test) {
      return test !== func && test.originalListener !== func;
    }
  }

  /**
   * Dispatch (trigger) an event.
   *
   * @function EventLite.prototype.emit
   * @param type {string}
   * @param [value] {*}
   * @returns {boolean} True when a listener received the event
   */

  function emit(type, value) {
    var that = this;
    var listeners = getListeners(that, type, true);
    if (!listeners) return false;
    var arglen = arguments.length;
    if (arglen === 1) {
      listeners.forEach(zeroarg);
    } else if (arglen === 2) {
      listeners.forEach(onearg);
    } else {
      var args = Array.prototype.slice.call(arguments, 1);
      listeners.forEach(moreargs);
    }
    return !!listeners.length;

    function zeroarg(func) {
      func.call(that);
    }

    function onearg(func) {
      func.call(that, value);
    }

    function moreargs(func) {
      func.apply(that, args);
    }
  }

  /**
   * @ignore
   */

  function getListeners(that, type, readonly) {
    if (readonly && !that[LISTENERS]) return;
    var listeners = that[LISTENERS] || (that[LISTENERS] = {});
    return listeners[type] || (listeners[type] = []);
  }

})(EventLite);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!******************!*\
  !*** ./index.js ***!
  \******************/


var { krunker, extracted } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js"),
	Updater = __webpack_require__(/*! ../libs/updater */ "../libs/updater.js"),
	updater = new Updater('https://y9x.github.io/userscripts/junker.user.js', extracted);

if(krunker){
	if(typeof DO_UPDATES != 'boolean' || DO_UPDATES == true)window.addEventListener('load', () => updater.watch(() => {
		if(confirm('A new Junker version is available, do you wish to update?'))updater.update();
	}, 60e3 * 3));
	
	__webpack_require__(/*! ./main */ "./main.js");
}
})();

/******/ })()
;