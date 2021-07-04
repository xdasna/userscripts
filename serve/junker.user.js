// ==UserScript==
// @name           Krunker Junker
// @author         The Gaming Gurus
// @description    This script is served by the auto updater, do not use it outside of development.
// @version        1.1
// @license        gpl-3.0
// @namespace      https://greasyfork.org/users/704479
// @icon           https://y9x.github.io/webpack/junker/junker.png
// @grant          GM.setValue
// @grant          GM_getValue
// @extracted      Sun, 04 Jul 2021 20:36:12 GMT
// @supportURL     https://y9x.github.io/discord/
// @match          *://krunker.io/*
// @match          *://*.browserfps.com/*
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
	Visual = __webpack_require__(/*! ./visual */ "./visual.js"),
	Socket = __webpack_require__(/*! ../libs/socket */ "../libs/socket.js");

vars.load(__webpack_require__(/*! ./vars */ "./vars.js"));

class Main {
	constructor(){
		this.hooked = Symbol();
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
		
		this.menu = __webpack_require__(/*! ./settings.js */ "./settings.js");
		
		var self = this;
		
		this.interface = {
			get game(){
				return self.game;
			},
			get force_auto(){
				return self.config.aim.force_auto;
			},
			get controls(){
				return self.controls;
			},
			get player(){
				return self.player;
			},
			get target(){
				return self.target;
			},
			get players(){
				return self.players;
			},
			get esp(){
				return self.config.esp.status;
			},
			get wireframe(){
				return self.config.player.wireframe;
			},
			get walls(){
				return self.config.esp.walls;
			},
			get bhop(){
				return self.config.player.bhop;
			},
			get aim(){
				return self.config.aim.status;
			},
			get aim_smooth(){
				return self.config.aim.smooth;
			},
			get hitchance(){
				return self.config.aim.hitchance;
			},
			get auto_reload(){
				return self.config.aim.auto_reload;
			},
			get unlock_skins(){
				return self.config.player.skins;
			},
			pick_target(){
				self.target = self.players.filter(player => player.can_target && player.rect).sort((p1, p2) => self.dist2d(p1, p2) * (p1.frustum ? 1 : 0.5))[0];
			},
		};
		
		api.on_instruct = () => {	
			if(this.config.game.auto_lobby && api.has_instruct('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && api.has_instruct('to play') && (!this.player || !this.player.active)){
				this.controls.locklessChange(true);
				this.controls.locklessChange(false);
			}
		};
	}
	get players(){
		return this.game.players.list.map(ent => this.add(ent));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
	async load(){
		utils.add_ele('style', () => document.documentElement, { textContent: __webpack_require__(/*! ./index.css */ "./index.css") });
		
		var self = this,
			socket = Socket(this.interface),
			input = new Input(this.interface);
		
		this.visual = new Visual(this.interface);
		
		var token_promise = api.token(),
			args = {
				[vars.key]: {
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
					},
					world: world => utils.world = this.world = world,
					can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
					skins: ent => this.config.player.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
					timer: (object, property, timer) => Object.defineProperty(object, property, {
						get: _ => this.config.game.inactivity ? 0 : timer,
						set: value => this.config.game.inactivity ? Infinity : timer,
					}),
					input: input.push.bind(input),
					render(orig, overlay){
						self.overlay = overlay;
						
						self.visual.canvas = utils.canvas = document.querySelector('#game-overlay');
						
						self.visual.ctx = self.ctx = utils.canvas.getContext('2d');
						
						orig = orig.bind(overlay);
						
						overlay.render = function(...args){
							orig(...args);
							self.overlayRender(...args);
						};
					},
				},
				WebSocket: socket,
				WP_fetchMMToken: api.token(),
			};
		
		var ls = localStorage.getItem('ssjunkconfig');
		
		if(typeof GM_setValue == 'function' && typeof GM == 'object' && !GM_getValue('config') && ls)await GM.setValue('config', ls);
		
		await this.menu.load_config();
		
		new Function(...Object.keys(args), vars.patch(await api.source()))(...Object.values(args));
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
		
		if(this.config.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send('k', 0);
	}
	dist2d(p1, p2){
		return utils.dist_center(p1.rect) - utils.dist_center(p2.rect);
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
	// GM_getValue is sync, loader needs to run instantly
	grant: [ 'GM.setValue', 'GM_getValue' ],
};

/***/ }),

/***/ "./settings.js":
/*!*********************!*\
  !*** ./settings.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var meta = __webpack_require__(/*! ./meta */ "./meta.js"),
	request = __webpack_require__(/*! ../libs/request */ "../libs/request.js"),
	UIMenu = __webpack_require__(/*! ../libs/uimenu */ "../libs/uimenu/index.js"),
	DiscordAddon = __webpack_require__(/*! ../libs/uimenu/addons/discord */ "../libs/uimenu/addons/discord.js"),
	SettingsAddon = __webpack_require__(/*! ../libs/uimenu/addons/settings */ "../libs/uimenu/addons/settings.js"),
	menu = new UIMenu('Junk', meta.icon, 'config'),
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
		force_auto: false,
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

render.add_control('Draw FOV box', {
	type: 'boolean',
	walk: 'aim.fov_box',
});

var esp = render.add_category('ESP');

esp.add_control('Mode', {
	type: 'rotate',
	walk: 'esp.status',
	value: {
		off: 'Off',
		box: 'Box',
		chams: 'Chams',
		box_chams: 'Box & Chams',
		full: 'Full',
	},
});

esp.add_control('Hostile Color', {
	type: 'color',
	walk: 'color.hostile',
});

esp.add_control('Risk Color', {
	type: 'color',
	walk: 'color.risk',
});

esp.add_control('Friendly Color', {
	type: 'color',
	walk: 'color.friendly',
});

esp.add_control('Tracers', {
	type: 'boolean',
	walk: 'esp.tracers',
});

esp.add_control('Wireframe', {
	type: 'boolean',
	walk: 'esp.wireframe',
});

esp.add_control('Rainbow Color', {
	type: 'boolean',
	walk: 'esp.rainbow',
});

var ui = render.add_category('UI');

var css = utils.add_ele('link', () => document.documentElement, { rel: 'stylesheet' }); 

ui.add_control('Custom CSS', {
	type: 'textbox',
	walk: 'ui.css',
	placeholder: 'CSS Url',
}).on('change', value => {
	if(value != '')css.href = value;
});

ui.add_control('Show Menu Button ( [F1] to show )', {
	type: 'boolean',
	walk: 'ui.show_button',
}).on('change', value => {
	if(value)menu.button.show();
	else menu.button.hide();
});

ui.add_control('Show Advertisments', {
	type: 'boolean',
	walk: 'ui.show_adverts',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-adverts'));

ui.add_control('Show Streams', {
	type: 'boolean',
	walk: 'ui.show_streams',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-streams'));

ui.add_control('Show Merch', {
	type: 'boolean',
	walk: 'ui.show_merch',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-merch'));

ui.add_control('Show News Console', {
	type: 'boolean',
	walk: 'ui.show_news',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-news'));

ui.add_control('Show Security Button', {
	type: 'boolean',
	walk: 'ui.show_cookie',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-security'));

var weapon = menu.window.add_tab('Weapon');

weapon.add_control('Auto Reload', {
	type: 'boolean',
	walk: 'aim.auto_reload',
});

weapon.add_control('Force auto-fire', {
	type: 'boolean',
	walk: 'aim.force_auto',
});

var aimbot = weapon.add_category('Aimbot');

aimbot.add_control('Mode', {
	type: 'rotate',
	walk: 'aim.status',
	value: {
		off: 'Off',
		trigger: 'Triggerbot',
		correction: 'Correction',
		assist: 'Assist',
		auto: 'Automatic',
	},
});

aimbot.add_control('Offset', {
	type: 'rotate',
	walk: 'aim.offset',
	value: {
		head: 'Head',
		torso: 'Torso',
		legs: 'Legs',
		random: 'Random',
	},
});

aimbot.add_control('Smoothness', {
	type: 'slider',
	walk: 'aim.smooth',
	min: 0,
	max: 1,
	step: 0.1,
});

aimbot.add_control('Hitchance', {
	type: 'slider',
	walk: 'aim.hitchance',
	min: 10,
	max: 100,
	step: 10,
});

aimbot.add_control('FOV', {
	type: 'slider',
	walk: 'aim.fov',
	min: 10,
	max: 110,
	step: 10,
	labels: { 110: 'Inf' },
});

aimbot.add_control('Wallbangs', {
	type: 'boolean',
	walk: 'aim.wallbangs',
});

var player = menu.window.add_tab('Player');

player.add_control('Auto Bhop Mode', {
	type: 'rotate',
	walk: 'player.bhop',
	value: {
		off: 'Off',
		keyjump: 'Key Jump',
		keyslide: 'Key Slide',
		autoslide: 'Auto Slide',
		autojump: 'Auto Jump',
	},
});

player.add_control('Unlock Skins', {
	type: 'boolean',
	walk: 'player.skins',
});

var game = menu.window.add_tab('Game');

game.add_control('Auto Activate Nuke', {
	type: 'boolean',
	walk: 'game.auto_nuke',
});

game.add_control('Auto Start Match', {
	type: 'boolean',
	walk: 'game.auto_start',
});

game.add_control('New Lobby Finder', {
	type: 'boolean',
	walk: 'game.auto_lobby',
});

game.add_control('No Inactivity kick', {
	type: 'boolean',
	walk: 'game.inactivity',
});

var radio = menu.window.add_tab('Radio');

radio.add_control('Stream', {
	type: 'rotate',
	walk: 'radio.stream',
	value: {
		'off': 'Off',
		'http://0n-2000s.radionetz.de/0n-2000s.aac': 'General German/English',
		'https://stream-mixtape-geo.ntslive.net/mixtape2': 'Hip Hop / RNB',
		'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2': 'Country',
		'http://streaming.radionomy.com/A-RADIO-TOP-40': 'Dance',
		'http://bigrradio.cdnstream1.com/5106_128': 'Pop',
		'http://strm112.1.fm/ajazz_mobile_mp3': 'Jazz',
		'http://strm112.1.fm/60s_70s_mobile_mp3': 'Golden Oldies',
		'http://strm112.1.fm/club_mobile_mp3': 'Club',
		'https://freshgrass.streamguys1.com/irish-128mp3': 'Folk',
		'http://1a-classicrock.radionetz.de/1a-classicrock.mp3': 'Classic Rock',
		'http://streams.radiobob.de/metalcore/mp3-192': 'Heavy Metal',
		'http://stream.laut.fm/beatdownx': 'Death Metal',
		'http://live-radio01.mediahubaustralia.com/FM2W/aac/': 'Classical',
		'http://bigrradio.cdnstream1.com/5187_128': 'Alternative',
		'http://streaming.radionomy.com/R1Dubstep?lang=en': 'DubStep',
		'http://streams.fluxfm.de/Chillhop/mp3-256': 'LoFi HipHop',
		'http://streams.90s90s.de/hiphop/mp3-128/': 'Hip Hop Oldskool',
	},
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

radio.add_control('Radio Volume', {
	type: 'slider',
	walk: 'radio.volume',
	min: 0,
	max: 1,
	step: 0.05,
});

var dev = menu.window.add_tab('Dev');

dev.add_control('Save Game Script', {
	type: 'function',
	value(){
		var link = utils.add_ele('a', document.documentElement, { href: request.resolve({
			target: api.api_v2,
			endpoint: 'source',
			query: { download: true },
		}) });

		link.click();

		link.remove();
	},
});

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


var Utils = __webpack_require__(/*! ./utils */ "../libs/utils.js"),
	utils = new Utils(),
	DataStore = __webpack_require__(/*! ./datastore */ "../libs/datastore.js"),
	store = new DataStore(),
	request = __webpack_require__(/*! ./request */ "../libs/request.js");

class API {
	constructor(matchmaker_url, api_url){
		this.matchmaker = matchmaker_url,
		this.api = /*CHANGE*/ false ? 0 : api_url,
		
		this.stacks = new Set();
		
		this.api_v2 = new URL('v2/', this.api);
		
		this.meta = utils.promise();
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
		
		await request({
			target: this.api_v2,
			endpoint: 'error',
			data: body,
		});
	}
	async source(){
		await this.meta;
		
		return await request({
			target: this.api_v2,
			endpoint: 'source',
			query: {
				build: this.meta.build,
			},
			result: 'text',
			cache: true,
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
		
		return await request({
			target: this.api_v2,
			endpoint: 'token',
			data: await request({
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
		var meta = await request({
			target: this.api_v2,
			endpoint: 'meta',
			data: {
				...input_meta,
				needs_key: true,
			},
			result: 'json',
		});
		
		if(meta.error){
			this.show_error(meta.error.title, meta.error.message);
			this.meta.reject();
		}else this.meta.resolve(this.meta = meta);
	}
};

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
	Utils = __webpack_require__(/*! ./utils */ "../libs/utils.js"),
	utils = new Utils();

exports.store = new DataStore();

exports.meta = {
	github: 'https://github.com/y9x/',
	discord: 'https://y9x.github.io/discord/',
	forum: 'https://forum.sys32.dev/',
};

exports.api_url = 'https://api.sys32.dev/';
exports.mm_url = 'https://matchmaker.krunker.io/';

exports.is_frame = window != window.top;

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


class DataStore {
	ls_prefix = 'ss';
	gm = typeof GM_getValue == 'function';
	get(key, expect){
		var data = this.get_raw(key);
		
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
	get_raw(key){
		return this.gm ? GM_getValue(key) : localStorage.getItem(this.ls_prefix + key);
	}
	set_raw(key, value){
		return this.gm ? GM.setValue(key, value) : localStorage.setItem(this.ls_prefix + key, value);
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
	constructor(data){
		this.data = data;
	}
	push(array){
		if(this.data.player && this.data.controls)try{
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
		this.data.controls[vars.pchObjc].rotation.x = rot.x;
		this.data.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !this.data.player.shot;
		
		if(!data.reload && this.data.player.has_ammo && data.shoot && !this.data.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(this.data.player.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, utils.world.camera);
		
		if(this.data.player.aimed && raycaster.intersectObjects(this.data.players.filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	smooth(target, setup){
		var x_ang = utils.getAngleDst(this.data.controls[vars.pchObjc].rotation.x, target.x),
			y_ang = utils.getAngleDst(this.data.controls.object.rotation.y, target.y);
		
		// camChaseSpd used on .object
		
		return {
			y: this.data.controls.object.rotation.y + y_ang * setup.speed,
			x: this.data.controls[vars.pchObjc].rotation.x + x_ang * setup.turn,
		};
	}
	bhop(data){
		if(data.move_dir == -1)return
		
		var status = this.data.bhop,
			auto = status.startsWith('auto'),
			key = status.startsWith('key'),
			slide = status.endsWith('slide'),
			jump = slide || status.endsWith('jump');
		
		if(!data.focused)return;
		
		if(jump && (auto || data.keys.has('Space'))){
			this.data.controls.keys[this.data.controls.binds.jump.val] ^= 1;
			if(this.data.controls.keys[this.data.controls.binds.jump.val])this.data.controls.didPressed[this.data.controls.binds.jump.val] = 1;
		}
		
		if(slide && (auto || data.keys.has('Space')) && this.data.player.velocity.y < -0.02 && this.data.player.can_slide)setTimeout(() => this.data.controls.keys[this.data.controls.binds.crouch.val] = 0, 325), this.data.controls.keys[this.data.controls.binds.crouch.val] = 1;
	}
	modify(data){
		// bhop
		this.bhop(data);
		
		// auto reload
		if(!this.data.player.has_ammo && (this.data.aim == 'auto' || this.data.auto_reload))data.reload = true;
		
		// TODO: target once on aim
		
		data.could_shoot = this.data.player.can_shoot;
		
		if(this.data.force_auto && this.data.player.did_shoot)data.shoot = false;
		
		var nauto = this.data.player.weapon_auto || this.data.player.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < this.data.hitchance,
			can_target = this.data.aim == 'auto' || data.scope || data.shoot;
		
		if(this.data.player.weapon.burst)this.data.player.shot = this.data.player.did_shoot;
		
		for(let player of this.data.players)player.calc_parts();
		
		if(can_target)this.data.pick_target();
		
		if(this.data.player.can_shoot)if(this.data.aim == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(this.data.aim != 'off' && this.data.target && this.data.player.health){
			var rot = this.data.target.calc_rot();
			
			if(hitchance)if(this.data.aim == 'correction' && nauto)this.correct_aim(rot, data);
			else if(this.data.aim == 'auto'){
				if(this.data.player.can_aim)data.scope = 1;
				
				if(this.data.player.aimed)data.shoot = !this.data.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(this.data.aim == 'assist' && this.data.player.aim_press){
				var smooth_map = {
					// step: 2
					// min: 0
					// max: 1
					0: 1, // off
					0.1: 0.05,
					0.2: 0.1, // instant
					0.3: 0.08,
					0.4: 0.07, // faster
					0.5: 0.06,
					0.6: 0.05, // fast
					0.7: 0.04,
					0.8: 0.03, // light
					0.9: 0.02,
					1: 0.01, // light
				};
				
				let spd = smooth_map[this.data.aim_smooth] || (console.warn(this.data.aim_smooth, 'not registered'), 1);
				
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
				
				if(data.shoot && !this.data.player.shot && !hitchance)data.xdir = 0;
			}
		}
		
		if(this.data.player.can_shoot && data.shoot && !this.data.player.shot){
			this.data.player.shot = true;
			setTimeout(() => this.data.player.shot = false, this.data.player.weapon.rate + 2);
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
	keys = new Set();

class InputData {
	constructor(array){
		this.array = array;
	}
	get keys(){
		return document.activeElement.tagName == 'INPUT' ? new Set() : keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
};

document.addEventListener('keydown', event => keys.add(event.code));

document.addEventListener('keyup', event => keys.delete(event.code));

window.addEventListener('blur', () => keys = new Set());

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
	// every x ticks calculate heavy pos data
	part_keys = [ 'head', 'torso', 'legs' ];
	calc_ticks = 4;
	constructor(cheat, entity){
		this.data = cheat;
		this.entity = typeof entity == 'object' && entity != null ? entity : {};
		this.velocity = new Vector3();
		this.position = new Vector3();
		this.esp_hex = new Hex();
		this.hp_hex = new Hex();
		this.dont_calc = 0;
		
		this.parts = {
			hitbox_head: new Vector3(),
			head: new Vector3(),
			torso: new Vector3(),
			legs: new Vector3(),
		};
	}
	get distance_scale(){
		var world_pos = utils.camera_world();
		
		return Math.max(.3, 1 - utils.getD3D(world_pos.x, world_pos.y, world_pos.z, this.position.x, this.position.y, this.position.z) / 600);
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
						position.project(this.data.world.camera);
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
		if(this.data.config.aim.fov == 110)return true;
		if(!this.frustum)return false;
		
		var fov_bak = utils.world.camera.fov;
		
		// config fov is percentage of current fov
		utils.world.camera.fov = this.data.config.aim.fov / fov_bak * 100;
		utils.world.camera.updateProjectionMatrix();
		
		utils.update_frustum();
		var ret = utils.contains_point(this.aim_point);
		
		utils.world.camera.fov = fov_bak;
		utils.world.camera.updateProjectionMatrix();
		utils.update_frustum();
		
		return ret;
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
		return this.data.target && this.entity == this.data.target.entity;
	}
	get can_melee(){
		return this.weapon.melee && this.data.target && this.data.target.active && this.position.distance_to(this.data.target) <= 18 || false;
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
	get aim_press(){ return this.data.controls[vars.mouseDownR] || this.data.controls.keys[this.data.controls.binds.aim.val] }
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
	get teammate(){ return this.is_you || this.data.player && this.team && this.team == this.data.player.team }
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
	// Rotation to look at aim_point
	calc_rot(){
		var camera = utils.camera_world(),
			target = this.aim_point;
		
		// target.add(this.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.data.player.jump_bob_y
			, target.z)
			- this.data.player.land_bob_y * 0.1
			- this.data.player.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	calc_parts(){
		if(!this.active || this.is_you)return this.can_target = false;
		
		if(this.aim_point && (this.dont_calc++) % (this.calc_ticks + 1) != 0)return;
		
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
		
		var part = this.data.config.aim.offset == 'random' ? this.part_keys[~~(random_target * this.part_keys.length)] : this.data.config.aim.offset;
		
		this.aim_point = part == 'head' ? this.parts.hitbox_head : (this.parts[part] || (console.error(part, 'not registered'), Vector3.Blank));
		
		this.frustum = utils.contains_point(this.aim_point);
		this.in_fov = this.calc_in_fov();
		
		this.world_pos = this.active ? this.obj[vars.getWorldPosition]() : { x: 0, y: 0, z: 0 };
		
		this.can_see = this.data.player &&
			utils.obstructing(utils.camera_world(), this.aim_point, (!this.data.player || this.data.player.weapon && this.data.player.weapon.pierce) && this.data.config.aim.wallbangs)
		== null ? true : false;
		
		this.can_target = this.active && this.can_see && this.enemy && this.in_fov;
	}
	tick(){
		this.position.set(this.entity.x, this.entity.y, this.entity.z);
		this.velocity.set(this.entity.xVel, this.entity.yVel, this.entity.zVel);
		
		this.parts.hitbox_head.copy(this.position).set_y(this.position.y + this.height - (this.crouch * vars.consts.crouchDst));
		
		if(this.is_you)return;
		
		if(this.frustum)this.rect = this.calc_rect();
		
		this.esp_hex.set_style(this.data.config.esp.rainbow ? this.data.overlay.rainbow.col : this.data.config.color[this.enemy ? this.risk ? 'risk' : 'hostile' : 'friendly']);
		
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

/***/ "../libs/request.js":
/*!**************************!*\
  !*** ../libs/request.js ***!
  \**************************/
/***/ ((module) => {

"use strict";


var is_obj = data => typeof data == 'object' && data != null,
	is_url = data => typeof data == 'string' || data instanceof Location || data instanceof URL,
	headers_obj = headers => {
		if(!is_obj(headers))return {};
		else if(headers instanceof Headers){
			let out = {};
			
			for(let [ key, value ] of headers)out[key] = value;
			
			return out;
		}else return headers;
	};

var request = input => {
	if(!is_obj(input))throw new TypeError('Input must be an object');
	
	var opts = {
			cache: 'no-cache',
			headers: headers_obj(input.headers),
		},
		url = request.resolve(input);
	
	switch(input.cache){
		case true:
			opts.cache = 'force-cache';
			break;
		case'query':	
			url.search += '?' + Date.now();
			break;
	}
	if(input.cache == true)opts.cache = 'force-cache';
	
	if(is_obj(input.data)){
		opts.method = 'POST';
		opts.body = JSON.stringify(input.data);
		opts.headers['content-type'] = 'application/json';
	}
	
	if(typeof input.method == 'string')opts.method = input.method;
	
	if(input.sync){
		opts.xhr = true;
		opts.synchronous = true;
	}
	
	var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text';
	
	return (opts.xhr ? request.fetch_xhr : request.fetch)(url, opts).then(res => res[result]());
};

request.fetch = window.fetch.bind(window);

request.fetch_xhr = (url, opts = {}) => {
	if(!is_url(url))throw new TypeError('url param is not resolvable');
	
	var url = new URL(url, location).href,
		method = typeof opts.method == 'string' ? opts.method : 'GET';
	
	// if(opts.cache == 'no-cache')url += '?' + Date.now();
	
	var req = new XMLHttpRequest();
	
	req.open(method, url, !opts.synchronous);
	
	return new Promise((resolve, reject) => {
		req.addEventListener('load', () => resolve({
			async text(){
				return req.responseText;
			},
			async json(){
				return JSON.parse(req.responseText);
			},
			headers: new Headers(),
		}));
		
		req.addEventListener('error', event => reject(event.error));
		
		req.send(opts.body);
	});
};

request.resolve = input => {
	if(!is_url(input.target))throw new TypeError('Target must be specified');
	
	var url = new URL(input.target);
	
	if(is_url(input.endpoint))url = new URL(input.endpoint, url);
	
	if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
	
	return url;
};

module.exports = request;

/***/ }),

/***/ "../libs/socket.js":
/*!*************************!*\
  !*** ../libs/socket.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var msgpack = __webpack_require__(/*! msgpack-lite */ "../node_modules/msgpack-lite/lib/browser.js"),
	data = Symbol();

module.exports = inter => {
	var socket_id, skin_cache;
	
	class HWebSocket extends WebSocket {
		constructor(url, proto){
			super(url, proto);
			
			this.addEventListener('message', event => {
				var [ label, ...data ] = msgpack.decode(new Uint8Array(event.data)),
					client;
				
				if(label == 'io-init')socket_id = data[0];
				else if(inter.unlock_skins && label == 0 && skin_cache && socket_id && (client = data[0].indexOf(socket_id)) != -1){
					// loadout
					data[0][client + 12] = skin_cache[2];
					
					// hat
					data[0][client + 13] = skin_cache[3];
					
					// body
					data[0][client + 14] = skin_cache[4];
					
					// knife
					data[0][client + 19] = skin_cache[9];
					
					// dye
					data[0][client + 24] = skin_cache[14];
					
					// waist
					data[0][client + 33] = skin_cache[17];
					
					// event.data is non-writable but configurable
					// concat message signature ( 2 bytes )
					var encoded = msgpack.encode([ label, ...data ]),
						final = new Uint8Array(encoded.byteLength + 2);
					
					final.set(encoded, 0);
					final.set(event.data.slice(-2), encoded.byteLength);
					
					Object.defineProperty(event, 'data', { value: final.buffer });
				}
			});
		}
		send(binary){
			var [ label, ...data ] = msgpack.decode(binary.slice(0, -2));
			
			if(label == 'en')skin_cache = data[0];
			
			super.send(binary);
		}
	};
	
	return HWebSocket;
};

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
			events: {
				click: () => this.menu.load_preset('Default'),
			},
		});
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Export',
			events: {
				click: () => File.save({
					name: 'menu.json',
					data: JSON.stringify(this.menu.config),
				}),
			},
		});
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Import',
			events: {
				click: () => File.pick({
					accept: 'menu.json',
				}).then(async file => {
					var data = await file.read();
					
					try{
						await this.menu.insert_config(JSON.parse(data), true);
					}catch(err){
						console.error(err);
						alert('Invalid config');
					}
				}),
			},
		});
		
		this.preset = utils.add_ele('select', this.config, {
			id: 'settingsPreset',
			className: 'inputGrey2',
			style: {
				'margin-left': '0px',
				'font-size': '14px',
			},
			events: {
				change: () => {
					if(this.preset.value == 'Custom')return;
					
					this.menu.load_preset(this.preset.value);
				},
			},
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
			events: {
				input: () => {
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
				},
			},
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
		
		for(let [ preset, value ] of this.menu.presets)if(JSON.stringify(utils.assign_deep(utils.clone_obj(this.menu.presets.get('Default')), value)) == string)return this.preset.value = preset;
		
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


var Utils = __webpack_require__(/*! ../utils */ "../libs/utils.js"),
	utils = new Utils();

exports.utils = utils;

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


var { utils } = __webpack_require__(/*! ./consts */ "../libs/uimenu/consts.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class Control {
	constructor(name, data, category){
		this.data = data;
		this.name = name;
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
		this.content.remove();
	}
	walk(data){
		var state = this.menu.config,
			last_state,
			last_key;
		
		data.split('.').forEach(key => state = ((last_state = state)[last_key = key] || {}));
		
		return [ last_state, last_key ];
	}
	get value(){
		if(typeof this.data.value == 'function')return this.data.value;
		
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
		// MAKE CHANGE EMIT CALLED FROM THE CATEGORY
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
		
		this.input = utils.add_ele('input', this.switch, { type: 'checkbox' });
		
		this.input.addEventListener('change', () => this.value = this.input.checked);
		
		utils.add_ele('span', this.switch, { className: 'slider' });
	}
	update(init){
		super.update(init);
		if(init)this.input.checked = this.value;
	}
}

class RotateControl extends Control {
	static id = 'rotate';
	create(){
		this.select = utils.add_ele('select', this.content, { className: 'inputGrey2' });
		
		this.select.addEventListener('change', () => this.value = this.select.value);
		
		for(let value in this.data.value)utils.add_ele('option', this.select, {
			value: value,
			textContent: this.data.value[value],
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
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'inputGrey2',
			placeholder: 'Press a key',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.input.addEventListener('focus', () => {
			this.input.value = '';
		});
		
		this.input.addEventListener('keydown', event => {
			event.preventDefault();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});

		this.input.addEventListener('blur', () => {
			this.category.update();
			this.update();
		});
	}
	update(init){
		super.update(init);
		
		this.input.value = utils.string_key(this.value);
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
		var slider = {
			min: this.data.min,
			max: this.data.max,
			step: this.data.step,
		};
		
		this.input = utils.add_ele('input', this.content, {
			className: 'sliderVal',
			type: 'number',
			...slider,
		});
		
		this.slider = utils.add_ele('input', utils.add_ele('div', this.content, {
			className: 'slidecontainer',
			style: { 'margin-top': '-8px' },
		}), {
			className: 'sliderM',
			type: 'range',
			...slider,
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
	DataStore = __webpack_require__(/*! ../datastore */ "../libs/datastore.js"),
	Window = __webpack_require__(/*! ./window/ */ "../libs/uimenu/window/index.js"),
	MenuButton = __webpack_require__(/*! ./MenuButton */ "../libs/uimenu/MenuButton.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class UIMenu {
	constructor(label, icon, key, store = new DataStore()){
		this.store = store;
		
		this.config_key = key;
		
		utils.wait_for(() => document.querySelector('#menuItemContainer')).then(node => this.button.attach(node));
		utils.wait_for(() => document.querySelector('#uiBase')).then(node => this.window.attach(node));
		
		this.presets = new Map();
		
		this.presets.set('Default', {});
		
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
	add_preset(label, value){
		this.presets.set(label, value);
		this.emit('preset', label, value);
	}
	async insert_config(data, save = false){
		this.config = utils.assign_deep(utils.clone_obj(this.presets.get('Default')), data);
		
		if(save)await this.save_config();
		
		this.window.update(true);
		
		this.emit('config');
	}
	async load_preset(preset){
		if(!this.presets.has(preset))throw new Error('Invalid preset:', preset);
		
		this.insert_config(this.presets.get(preset), true);
	}
	async save_config(){
		await this.store.set(this.config_key, this.config);
	}
	async load_config(){
		this.insert_config(await this.store.get(this.config_key, 'object'));
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

/***/ "../libs/uimenu/window/category.js":
/*!*****************************************!*\
  !*** ../libs/uimenu/window/category.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils } = __webpack_require__(/*! ../consts */ "../libs/uimenu/consts.js"),
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
	add_control(name, data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(name, data, this);
			
			this.controls.add(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
};

module.exports = Category;

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
	Category = __webpack_require__(/*! ./category */ "../libs/uimenu/window/category.js");

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
	add_control(...args){
		var category = this.last_category;
		
		if(!category || !category.is_default){
			category = this.add_category();
			category.is_default = true;
		}
		
		return category.add_control(...args);
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

/***/ "../libs/utils.js":
/*!************************!*\
  !*** ../libs/utils.js ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var vars = __webpack_require__(/*! ./vars */ "../libs/vars.js");

class FakeNode {
	constructor(){
		this.children = [];
	}
	appendChild(node){
		this.children.push(node);
	}
	append(){}
	append_into(target){
		for(let node of this.children)target.append(node);
	}
};

class Utils {
	constructor(canvas, three, game, world){
		this.FakeNode = FakeNode;
		
		this.canvas = canvas;
		this.three = three;
		this.game = game;
		this.world = world;
		
		this.pi2 = Math.PI * 2;
		this.halfpi = Math.PI / 2;
		
		this.mobile_uas = [ 'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini' ];
	}
	get mobile(){
		if(typeof navigator == 'object' && navigator != null)for(let ua of this.mobile_uas)if(navigator.userAgent.includes(ua))return true;
		return false;
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
		for(let obj of this.game.map.manager.objects)if(!obj.noShoot && obj.active && (wallbangs ? !obj.penetrable : true)){
			var in_rect = this.lineInRect(player.x, player.z, view_y, ad, ae, af,
				obj.x - Math.max(0, obj.width - offset),
				obj.z - Math.max(0, obj.length - offset),
				obj.y - Math.max(0, obj.height - offset),
				obj.x + Math.max(0, obj.width - offset),
				obj.z + Math.max(0, obj.length - offset),
				obj.y + Math.max(0, obj.height - offset)
			);
			
			if(in_rect && 1 > in_rect)return in_rect;
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
	add_ele(node_name, parent, attributes = {}){
		var crt = this.crt_ele(node_name, attributes);
		
		if(typeof parent == 'function')this.wait_for(parent).then(data => data.appendChild(crt));
		else if(typeof parent == 'object' && parent != null && parent.appendChild)parent.appendChild(crt);
		else throw new Error('Parent is not resolvable to a DOM element');
		
		return crt;
	}
	crt_ele(node_name, attributes = {}){
		var after = {};
		
		for(let prop in attributes)if(typeof attributes[prop] == 'object' && attributes[prop] != null)after[prop] = attributes[prop], delete attributes[prop];
	
		var node;
		
		if(node_name == 'raw')node = this.crt_ele('div', { innerHTML: attributes.html }).firstChild;
		else if(node_name == 'text')node = document.createTextNode('');
		else node = document.createElement(node_name)
		
		var cls = attributes.className;
		
		if(cls){
			delete attributes.className;
			node.setAttribute('class', cls);
		}
		
		var events = after.events;
		
		if(events){
			delete after.events;
			
			for(let event in events)node.addEventListener(event, events[event]);
		}
		
		Object.assign(node, attributes);
		
		for(let prop in after)Object.assign(node[prop], after[prop]);
		
		return node;
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
	string_key(key){
		return key.replace(/^([A-Z][a-z]+?)([A-Z0-9][a-z]*?)/, (match, type, key) => ['Digit', 'Key'].includes(type) ? key : `${key} ${type}`);
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
	filter_deep(target, match){
		for(let key in target){
			if(!(key in match))delete target[key];
			
			if(typeof match[key] == 'object' && match[key] != null)this.filter_deep(target[key], match[key]);
		}
		
		return target;
	}
	redirect(name, from, to){
		var proxy = Symbol();
		
		to.addEventListener(name, event => {
			if(event[proxy])return;
		});
		
		from.addEventListener(name, event => to.dispatchEvent(Object.assign(new(event.constructor)(name, event), {
			[proxy]: true,
			stopImmediatePropagation: event.stopImmediatePropagation.bind(event),
			preventDefault: event.preventDefault.bind(event),
		})));
	}
	promise(){
		var res, rej,
			promise = new Promise((resolve, reject) => {
				res = resolve;
				rej = reject;
			});
		
		promise.resolve = res;
		promise.reject = rej;
		
		promise.resolve_in = (time = 0, data) => setTimeout(() => promise.resolve(data), time);
		
		return promise;
	}
	rtn(number, unit){
		return (number / unit).toFixed() * unit;
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

// assholes
add_patch('Nametags', /&&((\w+)\.\w+Seen)(?=\){if\(\(\w+=\2\.objInstances)/, (match, can_see) => `&& ${key}.can_see(${can_see})`);

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

exports.keys = { frame: 0, delta: 1, xdir: 2, ydir: 3, move_dir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weapon_scroll: 10, weapon_swap: 11, move_lock: 12, speed_limit: 13, reset: 14, interact: 15 };

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
	constructor(data){
		this.data = data;
		this.materials = new Map();
	}
	esp_mat(color){
		if(!this.materials.has(color))this.materials.set(color, new utils.three.MeshBasicMaterial({
			transparent: true,
			fog: false,
			depthTest: false,
			color: color,
		}));
		
		return this.materials.get(color);
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
		
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect((this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
	}
	walls(){
		utils.world.scene.children.forEach(obj => {
			if(obj.type != 'Mesh' || !obj.dSrc || obj.material[Visual.hooked])return;
			
			obj.material[Visual.hooked] = true;
			
			var otra = obj.material.transparent,
				opac = obj.material.opacity;
			
			Object.defineProperties(obj.material, {
				opacity: {
					get: _ => opac * this.data.walls / 100,
					set: _ => opac = _,
				},
				transparent: {
					get: _ => this.data.walls != 100 ? true : otra,
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
		this.ctx.font = '14px monospace';
		this.ctx.textAlign = 'start';
		this.ctx.lineWidth = 2.6;
		
		var data = {
			Player: this.data.player ? this.axis_join(this.data.player.position) : null,
			Target: this.data.target ? this.axis_join(this.data.target.position) : null,
			/*
			PlayerV: this.data.player ? this.axis_join(this.data.player.velocity) : null,
			'Target FOV': this.data.target && this.data.target.in_fov,
			'Target Frustrum': this.data.target && this.data.target.frustum,
			'Target Active': this.data.target && this.data.target.active,
			'Target Can Target': this.data.target && this.data.target._can_target,*/
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
		return ['chams', 'box_chams', 'full'].includes(this.data.esp);
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
					var material = this.can_draw_chams ? this.esp_mat(player.esp_color) : orig_mat;
					
					material.wireframe = this.data.wireframe;
					
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


/***/ }),

/***/ "../node_modules/ieee754/index.js":
/*!****************************************!*\
  !*** ../node_modules/ieee754/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ "../node_modules/int64-buffer/int64-buffer.js":
/*!****************************************************!*\
  !*** ../node_modules/int64-buffer/int64-buffer.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports) {

// int64-buffer.js

/*jshint -W018 */ // Confusing use of '!'.
/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
/*jshint -W093 */ // Did you mean to return a conditional instead of an assignment?

var Uint64BE, Int64BE, Uint64LE, Int64LE;

!function(exports) {
  // constants

  var UNDEFINED = "undefined";
  var BUFFER = (UNDEFINED !== typeof Buffer) && Buffer;
  var UINT8ARRAY = (UNDEFINED !== typeof Uint8Array) && Uint8Array;
  var ARRAYBUFFER = (UNDEFINED !== typeof ArrayBuffer) && ArrayBuffer;
  var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
  var isArray = Array.isArray || _isArray;
  var BIT32 = 4294967296;
  var BIT24 = 16777216;

  // storage class

  var storage; // Array;

  // generate classes

  Uint64BE = factory("Uint64BE", true, true);
  Int64BE = factory("Int64BE", true, false);
  Uint64LE = factory("Uint64LE", false, true);
  Int64LE = factory("Int64LE", false, false);

  // class factory

  function factory(name, bigendian, unsigned) {
    var posH = bigendian ? 0 : 4;
    var posL = bigendian ? 4 : 0;
    var pos0 = bigendian ? 0 : 3;
    var pos1 = bigendian ? 1 : 2;
    var pos2 = bigendian ? 2 : 1;
    var pos3 = bigendian ? 3 : 0;
    var fromPositive = bigendian ? fromPositiveBE : fromPositiveLE;
    var fromNegative = bigendian ? fromNegativeBE : fromNegativeLE;
    var proto = Int64.prototype;
    var isName = "is" + name;
    var _isInt64 = "_" + isName;

    // properties
    proto.buffer = void 0;
    proto.offset = 0;
    proto[_isInt64] = true;

    // methods
    proto.toNumber = toNumber;
    proto.toString = toString;
    proto.toJSON = toNumber;
    proto.toArray = toArray;

    // add .toBuffer() method only when Buffer available
    if (BUFFER) proto.toBuffer = toBuffer;

    // add .toArrayBuffer() method only when Uint8Array available
    if (UINT8ARRAY) proto.toArrayBuffer = toArrayBuffer;

    // isUint64BE, isInt64BE
    Int64[isName] = isInt64;

    // CommonJS
    exports[name] = Int64;

    return Int64;

    // constructor
    function Int64(buffer, offset, value, raddix) {
      if (!(this instanceof Int64)) return new Int64(buffer, offset, value, raddix);
      return init(this, buffer, offset, value, raddix);
    }

    // isUint64BE, isInt64BE
    function isInt64(b) {
      return !!(b && b[_isInt64]);
    }

    // initializer
    function init(that, buffer, offset, value, raddix) {
      if (UINT8ARRAY && ARRAYBUFFER) {
        if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
        if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
      }

      // Int64BE() style
      if (!buffer && !offset && !value && !storage) {
        // shortcut to initialize with zero
        that.buffer = newArray(ZERO, 0);
        return;
      }

      // Int64BE(value, raddix) style
      if (!isValidBuffer(buffer, offset)) {
        var _storage = storage || Array;
        raddix = offset;
        value = buffer;
        offset = 0;
        buffer = new _storage(8);
      }

      that.buffer = buffer;
      that.offset = offset |= 0;

      // Int64BE(buffer, offset) style
      if (UNDEFINED === typeof value) return;

      // Int64BE(buffer, offset, value, raddix) style
      if ("string" === typeof value) {
        fromString(buffer, offset, value, raddix || 10);
      } else if (isValidBuffer(value, raddix)) {
        fromArray(buffer, offset, value, raddix);
      } else if ("number" === typeof raddix) {
        writeInt32(buffer, offset + posH, value); // high
        writeInt32(buffer, offset + posL, raddix); // low
      } else if (value > 0) {
        fromPositive(buffer, offset, value); // positive
      } else if (value < 0) {
        fromNegative(buffer, offset, value); // negative
      } else {
        fromArray(buffer, offset, ZERO, 0); // zero, NaN and others
      }
    }

    function fromString(buffer, offset, str, raddix) {
      var pos = 0;
      var len = str.length;
      var high = 0;
      var low = 0;
      if (str[0] === "-") pos++;
      var sign = pos;
      while (pos < len) {
        var chr = parseInt(str[pos++], raddix);
        if (!(chr >= 0)) break; // NaN
        low = low * raddix + chr;
        high = high * raddix + Math.floor(low / BIT32);
        low %= BIT32;
      }
      if (sign) {
        high = ~high;
        if (low) {
          low = BIT32 - low;
        } else {
          high++;
        }
      }
      writeInt32(buffer, offset + posH, high);
      writeInt32(buffer, offset + posL, low);
    }

    function toNumber() {
      var buffer = this.buffer;
      var offset = this.offset;
      var high = readInt32(buffer, offset + posH);
      var low = readInt32(buffer, offset + posL);
      if (!unsigned) high |= 0; // a trick to get signed
      return high ? (high * BIT32 + low) : low;
    }

    function toString(radix) {
      var buffer = this.buffer;
      var offset = this.offset;
      var high = readInt32(buffer, offset + posH);
      var low = readInt32(buffer, offset + posL);
      var str = "";
      var sign = !unsigned && (high & 0x80000000);
      if (sign) {
        high = ~high;
        low = BIT32 - low;
      }
      radix = radix || 10;
      while (1) {
        var mod = (high % radix) * BIT32 + low;
        high = Math.floor(high / radix);
        low = Math.floor(mod / radix);
        str = (mod % radix).toString(radix) + str;
        if (!high && !low) break;
      }
      if (sign) {
        str = "-" + str;
      }
      return str;
    }

    function writeInt32(buffer, offset, value) {
      buffer[offset + pos3] = value & 255;
      value = value >> 8;
      buffer[offset + pos2] = value & 255;
      value = value >> 8;
      buffer[offset + pos1] = value & 255;
      value = value >> 8;
      buffer[offset + pos0] = value & 255;
    }

    function readInt32(buffer, offset) {
      return (buffer[offset + pos0] * BIT24) +
        (buffer[offset + pos1] << 16) +
        (buffer[offset + pos2] << 8) +
        buffer[offset + pos3];
    }
  }

  function toArray(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    storage = null; // Array
    if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
    return newArray(buffer, offset);
  }

  function toBuffer(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    storage = BUFFER;
    if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
    var dest = new BUFFER(8);
    fromArray(dest, 0, buffer, offset);
    return dest;
  }

  function toArrayBuffer(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    var arrbuf = buffer.buffer;
    storage = UINT8ARRAY;
    if (raw !== false && offset === 0 && (arrbuf instanceof ARRAYBUFFER) && arrbuf.byteLength === 8) return arrbuf;
    var dest = new UINT8ARRAY(8);
    fromArray(dest, 0, buffer, offset);
    return dest.buffer;
  }

  function isValidBuffer(buffer, offset) {
    var len = buffer && buffer.length;
    offset |= 0;
    return len && (offset + 8 <= len) && ("string" !== typeof buffer[offset]);
  }

  function fromArray(destbuf, destoff, srcbuf, srcoff) {
    destoff |= 0;
    srcoff |= 0;
    for (var i = 0; i < 8; i++) {
      destbuf[destoff++] = srcbuf[srcoff++] & 255;
    }
  }

  function newArray(buffer, offset) {
    return Array.prototype.slice.call(buffer, offset, offset + 8);
  }

  function fromPositiveBE(buffer, offset, value) {
    var pos = offset + 8;
    while (pos > offset) {
      buffer[--pos] = value & 255;
      value /= 256;
    }
  }

  function fromNegativeBE(buffer, offset, value) {
    var pos = offset + 8;
    value++;
    while (pos > offset) {
      buffer[--pos] = ((-value) & 255) ^ 255;
      value /= 256;
    }
  }

  function fromPositiveLE(buffer, offset, value) {
    var end = offset + 8;
    while (offset < end) {
      buffer[offset++] = value & 255;
      value /= 256;
    }
  }

  function fromNegativeLE(buffer, offset, value) {
    var end = offset + 8;
    value++;
    while (offset < end) {
      buffer[offset++] = ((-value) & 255) ^ 255;
      value /= 256;
    }
  }

  // https://github.com/retrofox/is-array
  function _isArray(val) {
    return !!val && "[object Array]" == Object.prototype.toString.call(val);
  }

}( true && typeof exports.nodeName !== 'string' ? exports : (this || {}));


/***/ }),

/***/ "../node_modules/isarray/index.js":
/*!****************************************!*\
  !*** ../node_modules/isarray/index.js ***!
  \****************************************/
/***/ ((module) => {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/browser.js":
/*!***************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/browser.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// browser.js

exports.encode = __webpack_require__(/*! ./encode */ "../node_modules/msgpack-lite/lib/encode.js").encode;
exports.decode = __webpack_require__(/*! ./decode */ "../node_modules/msgpack-lite/lib/decode.js").decode;

exports.Encoder = __webpack_require__(/*! ./encoder */ "../node_modules/msgpack-lite/lib/encoder.js").Encoder;
exports.Decoder = __webpack_require__(/*! ./decoder */ "../node_modules/msgpack-lite/lib/decoder.js").Decoder;

exports.createCodec = __webpack_require__(/*! ./ext */ "../node_modules/msgpack-lite/lib/ext.js").createCodec;
exports.codec = __webpack_require__(/*! ./codec */ "../node_modules/msgpack-lite/lib/codec.js").codec;


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/buffer-global.js":
/*!*********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/buffer-global.js ***!
  \*********************************************************/
/***/ (function(module) {

/* globals Buffer */

module.exports =
  c(("undefined" !== typeof Buffer) && Buffer) ||
  c(this.Buffer) ||
  c(("undefined" !== typeof window) && window.Buffer) ||
  this.Buffer;

function c(B) {
  return B && B.isBuffer && B;
}

/***/ }),

/***/ "../node_modules/msgpack-lite/lib/buffer-lite.js":
/*!*******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/buffer-lite.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {

// buffer-lite.js

var MAXBUFLEN = 8192;

exports.copy = copy;
exports.toString = toString;
exports.write = write;

/**
 * Buffer.prototype.write()
 *
 * @param string {String}
 * @param [offset] {Number}
 * @returns {Number}
 */

function write(string, offset) {
  var buffer = this;
  var index = offset || (offset |= 0);
  var length = string.length;
  var chr = 0;
  var i = 0;
  while (i < length) {
    chr = string.charCodeAt(i++);

    if (chr < 128) {
      buffer[index++] = chr;
    } else if (chr < 0x800) {
      // 2 bytes
      buffer[index++] = 0xC0 | (chr >>> 6);
      buffer[index++] = 0x80 | (chr & 0x3F);
    } else if (chr < 0xD800 || chr > 0xDFFF) {
      // 3 bytes
      buffer[index++] = 0xE0 | (chr  >>> 12);
      buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
      buffer[index++] = 0x80 | (chr          & 0x3F);
    } else {
      // 4 bytes - surrogate pair
      chr = (((chr - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
      buffer[index++] = 0xF0 | (chr >>> 18);
      buffer[index++] = 0x80 | ((chr >>> 12) & 0x3F);
      buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
      buffer[index++] = 0x80 | (chr          & 0x3F);
    }
  }
  return index - offset;
}

/**
 * Buffer.prototype.toString()
 *
 * @param [encoding] {String} ignored
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {String}
 */

function toString(encoding, start, end) {
  var buffer = this;
  var index = start|0;
  if (!end) end = buffer.length;
  var string = '';
  var chr = 0;

  while (index < end) {
    chr = buffer[index++];
    if (chr < 128) {
      string += String.fromCharCode(chr);
      continue;
    }

    if ((chr & 0xE0) === 0xC0) {
      // 2 bytes
      chr = (chr & 0x1F) << 6 |
            (buffer[index++] & 0x3F);

    } else if ((chr & 0xF0) === 0xE0) {
      // 3 bytes
      chr = (chr & 0x0F)             << 12 |
            (buffer[index++] & 0x3F) << 6  |
            (buffer[index++] & 0x3F);

    } else if ((chr & 0xF8) === 0xF0) {
      // 4 bytes
      chr = (chr & 0x07)             << 18 |
            (buffer[index++] & 0x3F) << 12 |
            (buffer[index++] & 0x3F) << 6  |
            (buffer[index++] & 0x3F);
    }

    if (chr >= 0x010000) {
      // A surrogate pair
      chr -= 0x010000;

      string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
    } else {
      string += String.fromCharCode(chr);
    }
  }

  return string;
}

/**
 * Buffer.prototype.copy()
 *
 * @param target {Buffer}
 * @param [targetStart] {Number}
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {number}
 */

function copy(target, targetStart, start, end) {
  var i;
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (!targetStart) targetStart = 0;
  var len = end - start;

  if (target === this && start < targetStart && targetStart < end) {
    // descending
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    // ascending
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start];
    }
  }

  return len;
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/bufferish-array.js":
/*!***********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/bufferish-array.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// bufferish-array.js

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");

var exports = module.exports = alloc(0);

exports.alloc = alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Array(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Array}
 */

function from(value) {
  if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
    // TypedArray to Uint8Array
    value = Bufferish.Uint8Array.from(value);
  } else if (Bufferish.isArrayBuffer(value)) {
    // ArrayBuffer to Uint8Array
    value = new Uint8Array(value);
  } else if (typeof value === "string") {
    // String to Array
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  // Array-like to Array
  return Array.prototype.slice.call(value);
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/bufferish-buffer.js":
/*!************************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/bufferish-buffer.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// bufferish-buffer.js

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var Buffer = Bufferish.global;

var exports = module.exports = Bufferish.hasBuffer ? alloc(0) : [];

exports.alloc = Bufferish.hasBuffer && Buffer.alloc || alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Buffer(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Buffer}
 */

function from(value) {
  if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
    // TypedArray to Uint8Array
    value = Bufferish.Uint8Array.from(value);
  } else if (Bufferish.isArrayBuffer(value)) {
    // ArrayBuffer to Uint8Array
    value = new Uint8Array(value);
  } else if (typeof value === "string") {
    // String to Buffer
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  // Array-like to Buffer
  if (Buffer.from && Buffer.from.length !== 1) {
    return Buffer.from(value); // node v6+
  } else {
    return new Buffer(value); // node v4
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/bufferish-proto.js":
/*!***********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/bufferish-proto.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// bufferish-proto.js

/* jshint eqnull:true */

var BufferLite = __webpack_require__(/*! ./buffer-lite */ "../node_modules/msgpack-lite/lib/buffer-lite.js");

exports.copy = copy;
exports.slice = slice;
exports.toString = toString;
exports.write = gen("write");

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var Buffer = Bufferish.global;

var isBufferShim = Bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer);
var brokenTypedArray = isBufferShim && !Buffer.TYPED_ARRAY_SUPPORT;

/**
 * @param target {Buffer|Uint8Array|Array}
 * @param [targetStart] {Number}
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function copy(target, targetStart, start, end) {
  var thisIsBuffer = Bufferish.isBuffer(this);
  var targetIsBuffer = Bufferish.isBuffer(target);
  if (thisIsBuffer && targetIsBuffer) {
    // Buffer to Buffer
    return this.copy(target, targetStart, start, end);
  } else if (!brokenTypedArray && !thisIsBuffer && !targetIsBuffer &&
    Bufferish.isView(this) && Bufferish.isView(target)) {
    // Uint8Array to Uint8Array (except for minor some browsers)
    var buffer = (start || end != null) ? slice.call(this, start, end) : this;
    target.set(buffer, targetStart);
    return buffer.length;
  } else {
    // other cases
    return BufferLite.copy.call(this, target, targetStart, start, end);
  }
}

/**
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function slice(start, end) {
  // for Buffer, Uint8Array (except for minor some browsers) and Array
  var f = this.slice || (!brokenTypedArray && this.subarray);
  if (f) return f.call(this, start, end);

  // Uint8Array (for minor some browsers)
  var target = Bufferish.alloc.call(this, end - start);
  copy.call(this, target, 0, start, end);
  return target;
}

/**
 * Buffer.prototype.toString()
 *
 * @param [encoding] {String} ignored
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {String}
 */

function toString(encoding, start, end) {
  var f = (!isBufferShim && Bufferish.isBuffer(this)) ? this.toString : BufferLite.toString;
  return f.apply(this, arguments);
}

/**
 * @private
 */

function gen(method) {
  return wrap;

  function wrap() {
    var f = this[method] || BufferLite[method];
    return f.apply(this, arguments);
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/bufferish-uint8array.js":
/*!****************************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/bufferish-uint8array.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// bufferish-uint8array.js

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");

var exports = module.exports = Bufferish.hasArrayBuffer ? alloc(0) : [];

exports.alloc = alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Uint8Array(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Uint8Array}
 */

function from(value) {
  if (Bufferish.isView(value)) {
    // TypedArray to ArrayBuffer
    var byteOffset = value.byteOffset;
    var byteLength = value.byteLength;
    value = value.buffer;
    if (value.byteLength !== byteLength) {
      if (value.slice) {
        value = value.slice(byteOffset, byteOffset + byteLength);
      } else {
        // Android 4.1 does not have ArrayBuffer.prototype.slice
        value = new Uint8Array(value);
        if (value.byteLength !== byteLength) {
          // TypedArray to ArrayBuffer to Uint8Array to Array
          value = Array.prototype.slice.call(value, byteOffset, byteOffset + byteLength);
        }
      }
    }
  } else if (typeof value === "string") {
    // String to Uint8Array
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  return new Uint8Array(value);
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/bufferish.js":
/*!*****************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/bufferish.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// bufferish.js

var Buffer = exports.global = __webpack_require__(/*! ./buffer-global */ "../node_modules/msgpack-lite/lib/buffer-global.js");
var hasBuffer = exports.hasBuffer = Buffer && !!Buffer.isBuffer;
var hasArrayBuffer = exports.hasArrayBuffer = ("undefined" !== typeof ArrayBuffer);

var isArray = exports.isArray = __webpack_require__(/*! isarray */ "../node_modules/isarray/index.js");
exports.isArrayBuffer = hasArrayBuffer ? isArrayBuffer : _false;
var isBuffer = exports.isBuffer = hasBuffer ? Buffer.isBuffer : _false;
var isView = exports.isView = hasArrayBuffer ? (ArrayBuffer.isView || _is("ArrayBuffer", "buffer")) : _false;

exports.alloc = alloc;
exports.concat = concat;
exports.from = from;

var BufferArray = exports.Array = __webpack_require__(/*! ./bufferish-array */ "../node_modules/msgpack-lite/lib/bufferish-array.js");
var BufferBuffer = exports.Buffer = __webpack_require__(/*! ./bufferish-buffer */ "../node_modules/msgpack-lite/lib/bufferish-buffer.js");
var BufferUint8Array = exports.Uint8Array = __webpack_require__(/*! ./bufferish-uint8array */ "../node_modules/msgpack-lite/lib/bufferish-uint8array.js");
var BufferProto = exports.prototype = __webpack_require__(/*! ./bufferish-proto */ "../node_modules/msgpack-lite/lib/bufferish-proto.js");

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Buffer|Uint8Array|Array}
 */

function from(value) {
  if (typeof value === "string") {
    return fromString.call(this, value);
  } else {
    return auto(this).from(value);
  }
}

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return auto(this).alloc(size);
}

/**
 * @param list {Array} array of (Buffer|Uint8Array|Array)s
 * @param [length]
 * @returns {Buffer|Uint8Array|Array}
 */

function concat(list, length) {
  if (!length) {
    length = 0;
    Array.prototype.forEach.call(list, dryrun);
  }
  var ref = (this !== exports) && this || list[0];
  var result = alloc.call(ref, length);
  var offset = 0;
  Array.prototype.forEach.call(list, append);
  return result;

  function dryrun(buffer) {
    length += buffer.length;
  }

  function append(buffer) {
    offset += BufferProto.copy.call(buffer, result, offset);
  }
}

var _isArrayBuffer = _is("ArrayBuffer");

function isArrayBuffer(value) {
  return (value instanceof ArrayBuffer) || _isArrayBuffer(value);
}

/**
 * @private
 */

function fromString(value) {
  var expected = value.length * 3;
  var that = alloc.call(this, expected);
  var actual = BufferProto.write.call(that, value);
  if (expected !== actual) {
    that = BufferProto.slice.call(that, 0, actual);
  }
  return that;
}

function auto(that) {
  return isBuffer(that) ? BufferBuffer
    : isView(that) ? BufferUint8Array
    : isArray(that) ? BufferArray
    : hasBuffer ? BufferBuffer
    : hasArrayBuffer ? BufferUint8Array
    : BufferArray;
}

function _false() {
  return false;
}

function _is(name, key) {
  /* jshint eqnull:true */
  name = "[object " + name + "]";
  return function(value) {
    return (value != null) && {}.toString.call(key ? value[key] : value) === name;
  };
}

/***/ }),

/***/ "../node_modules/msgpack-lite/lib/codec-base.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/codec-base.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// codec-base.js

var IS_ARRAY = __webpack_require__(/*! isarray */ "../node_modules/isarray/index.js");

exports.createCodec = createCodec;
exports.install = install;
exports.filter = filter;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");

function Codec(options) {
  if (!(this instanceof Codec)) return new Codec(options);
  this.options = options;
  this.init();
}

Codec.prototype.init = function() {
  var options = this.options;

  if (options && options.uint8array) {
    this.bufferish = Bufferish.Uint8Array;
  }

  return this;
};

function install(props) {
  for (var key in props) {
    Codec.prototype[key] = add(Codec.prototype[key], props[key]);
  }
}

function add(a, b) {
  return (a && b) ? ab : (a || b);

  function ab() {
    a.apply(this, arguments);
    return b.apply(this, arguments);
  }
}

function join(filters) {
  filters = filters.slice();

  return function(value) {
    return filters.reduce(iterator, value);
  };

  function iterator(value, filter) {
    return filter(value);
  }
}

function filter(filter) {
  return IS_ARRAY(filter) ? join(filter) : filter;
}

// @public
// msgpack.createCodec()

function createCodec(options) {
  return new Codec(options);
}

// default shared codec

exports.preset = createCodec({preset: true});


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/codec.js":
/*!*************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/codec.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// codec.js

// load both interfaces
__webpack_require__(/*! ./read-core */ "../node_modules/msgpack-lite/lib/read-core.js");
__webpack_require__(/*! ./write-core */ "../node_modules/msgpack-lite/lib/write-core.js");

// @public
// msgpack.codec.preset

exports.codec = {
  preset: __webpack_require__(/*! ./codec-base */ "../node_modules/msgpack-lite/lib/codec-base.js").preset
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/decode-buffer.js":
/*!*********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/decode-buffer.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// decode-buffer.js

exports.DecodeBuffer = DecodeBuffer;

var preset = __webpack_require__(/*! ./read-core */ "../node_modules/msgpack-lite/lib/read-core.js").preset;

var FlexDecoder = __webpack_require__(/*! ./flex-buffer */ "../node_modules/msgpack-lite/lib/flex-buffer.js").FlexDecoder;

FlexDecoder.mixin(DecodeBuffer.prototype);

function DecodeBuffer(options) {
  if (!(this instanceof DecodeBuffer)) return new DecodeBuffer(options);

  if (options) {
    this.options = options;
    if (options.codec) {
      var codec = this.codec = options.codec;
      if (codec.bufferish) this.bufferish = codec.bufferish;
    }
  }
}

DecodeBuffer.prototype.codec = preset;

DecodeBuffer.prototype.fetch = function() {
  return this.codec.decode(this);
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/decode.js":
/*!**************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/decode.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// decode.js

exports.decode = decode;

var DecodeBuffer = __webpack_require__(/*! ./decode-buffer */ "../node_modules/msgpack-lite/lib/decode-buffer.js").DecodeBuffer;

function decode(input, options) {
  var decoder = new DecodeBuffer(options);
  decoder.write(input);
  return decoder.read();
}

/***/ }),

/***/ "../node_modules/msgpack-lite/lib/decoder.js":
/*!***************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/decoder.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// decoder.js

exports.Decoder = Decoder;

var EventLite = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");
var DecodeBuffer = __webpack_require__(/*! ./decode-buffer */ "../node_modules/msgpack-lite/lib/decode-buffer.js").DecodeBuffer;

function Decoder(options) {
  if (!(this instanceof Decoder)) return new Decoder(options);
  DecodeBuffer.call(this, options);
}

Decoder.prototype = new DecodeBuffer();

EventLite.mixin(Decoder.prototype);

Decoder.prototype.decode = function(chunk) {
  if (arguments.length) this.write(chunk);
  this.flush();
};

Decoder.prototype.push = function(chunk) {
  this.emit("data", chunk);
};

Decoder.prototype.end = function(chunk) {
  this.decode(chunk);
  this.emit("end");
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/encode-buffer.js":
/*!*********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/encode-buffer.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// encode-buffer.js

exports.EncodeBuffer = EncodeBuffer;

var preset = __webpack_require__(/*! ./write-core */ "../node_modules/msgpack-lite/lib/write-core.js").preset;

var FlexEncoder = __webpack_require__(/*! ./flex-buffer */ "../node_modules/msgpack-lite/lib/flex-buffer.js").FlexEncoder;

FlexEncoder.mixin(EncodeBuffer.prototype);

function EncodeBuffer(options) {
  if (!(this instanceof EncodeBuffer)) return new EncodeBuffer(options);

  if (options) {
    this.options = options;
    if (options.codec) {
      var codec = this.codec = options.codec;
      if (codec.bufferish) this.bufferish = codec.bufferish;
    }
  }
}

EncodeBuffer.prototype.codec = preset;

EncodeBuffer.prototype.write = function(input) {
  this.codec.encode(this, input);
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/encode.js":
/*!**************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/encode.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// encode.js

exports.encode = encode;

var EncodeBuffer = __webpack_require__(/*! ./encode-buffer */ "../node_modules/msgpack-lite/lib/encode-buffer.js").EncodeBuffer;

function encode(input, options) {
  var encoder = new EncodeBuffer(options);
  encoder.write(input);
  return encoder.read();
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/encoder.js":
/*!***************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/encoder.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// encoder.js

exports.Encoder = Encoder;

var EventLite = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");
var EncodeBuffer = __webpack_require__(/*! ./encode-buffer */ "../node_modules/msgpack-lite/lib/encode-buffer.js").EncodeBuffer;

function Encoder(options) {
  if (!(this instanceof Encoder)) return new Encoder(options);
  EncodeBuffer.call(this, options);
}

Encoder.prototype = new EncodeBuffer();

EventLite.mixin(Encoder.prototype);

Encoder.prototype.encode = function(chunk) {
  this.write(chunk);
  this.emit("data", this.read());
};

Encoder.prototype.end = function(chunk) {
  if (arguments.length) this.encode(chunk);
  this.flush();
  this.emit("end");
};


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/ext-buffer.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/ext-buffer.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// ext-buffer.js

exports.ExtBuffer = ExtBuffer;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");

function ExtBuffer(buffer, type) {
  if (!(this instanceof ExtBuffer)) return new ExtBuffer(buffer, type);
  this.buffer = Bufferish.from(buffer);
  this.type = type;
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/ext-packer.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/ext-packer.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// ext-packer.js

exports.setExtPackers = setExtPackers;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var Buffer = Bufferish.global;
var packTypedArray = Bufferish.Uint8Array.from;
var _encode;

var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

function setExtPackers(codec) {
  codec.addExtPacker(0x0E, Error, [packError, encode]);
  codec.addExtPacker(0x01, EvalError, [packError, encode]);
  codec.addExtPacker(0x02, RangeError, [packError, encode]);
  codec.addExtPacker(0x03, ReferenceError, [packError, encode]);
  codec.addExtPacker(0x04, SyntaxError, [packError, encode]);
  codec.addExtPacker(0x05, TypeError, [packError, encode]);
  codec.addExtPacker(0x06, URIError, [packError, encode]);

  codec.addExtPacker(0x0A, RegExp, [packRegExp, encode]);
  codec.addExtPacker(0x0B, Boolean, [packValueOf, encode]);
  codec.addExtPacker(0x0C, String, [packValueOf, encode]);
  codec.addExtPacker(0x0D, Date, [Number, encode]);
  codec.addExtPacker(0x0F, Number, [packValueOf, encode]);

  if ("undefined" !== typeof Uint8Array) {
    codec.addExtPacker(0x11, Int8Array, packTypedArray);
    codec.addExtPacker(0x12, Uint8Array, packTypedArray);
    codec.addExtPacker(0x13, Int16Array, packTypedArray);
    codec.addExtPacker(0x14, Uint16Array, packTypedArray);
    codec.addExtPacker(0x15, Int32Array, packTypedArray);
    codec.addExtPacker(0x16, Uint32Array, packTypedArray);
    codec.addExtPacker(0x17, Float32Array, packTypedArray);

    // PhantomJS/1.9.7 doesn't have Float64Array
    if ("undefined" !== typeof Float64Array) {
      codec.addExtPacker(0x18, Float64Array, packTypedArray);
    }

    // IE10 doesn't have Uint8ClampedArray
    if ("undefined" !== typeof Uint8ClampedArray) {
      codec.addExtPacker(0x19, Uint8ClampedArray, packTypedArray);
    }

    codec.addExtPacker(0x1A, ArrayBuffer, packTypedArray);
    codec.addExtPacker(0x1D, DataView, packTypedArray);
  }

  if (Bufferish.hasBuffer) {
    codec.addExtPacker(0x1B, Buffer, Bufferish.from);
  }
}

function encode(input) {
  if (!_encode) _encode = __webpack_require__(/*! ./encode */ "../node_modules/msgpack-lite/lib/encode.js").encode; // lazy load
  return _encode(input);
}

function packValueOf(value) {
  return (value).valueOf();
}

function packRegExp(value) {
  value = RegExp.prototype.toString.call(value).split("/");
  value.shift();
  var out = [value.pop()];
  out.unshift(value.join("/"));
  return out;
}

function packError(value) {
  var out = {};
  for (var key in ERROR_COLUMNS) {
    out[key] = value[key];
  }
  return out;
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/ext-unpacker.js":
/*!********************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/ext-unpacker.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// ext-unpacker.js

exports.setExtUnpackers = setExtUnpackers;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var Buffer = Bufferish.global;
var _decode;

var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

function setExtUnpackers(codec) {
  codec.addExtUnpacker(0x0E, [decode, unpackError(Error)]);
  codec.addExtUnpacker(0x01, [decode, unpackError(EvalError)]);
  codec.addExtUnpacker(0x02, [decode, unpackError(RangeError)]);
  codec.addExtUnpacker(0x03, [decode, unpackError(ReferenceError)]);
  codec.addExtUnpacker(0x04, [decode, unpackError(SyntaxError)]);
  codec.addExtUnpacker(0x05, [decode, unpackError(TypeError)]);
  codec.addExtUnpacker(0x06, [decode, unpackError(URIError)]);

  codec.addExtUnpacker(0x0A, [decode, unpackRegExp]);
  codec.addExtUnpacker(0x0B, [decode, unpackClass(Boolean)]);
  codec.addExtUnpacker(0x0C, [decode, unpackClass(String)]);
  codec.addExtUnpacker(0x0D, [decode, unpackClass(Date)]);
  codec.addExtUnpacker(0x0F, [decode, unpackClass(Number)]);

  if ("undefined" !== typeof Uint8Array) {
    codec.addExtUnpacker(0x11, unpackClass(Int8Array));
    codec.addExtUnpacker(0x12, unpackClass(Uint8Array));
    codec.addExtUnpacker(0x13, [unpackArrayBuffer, unpackClass(Int16Array)]);
    codec.addExtUnpacker(0x14, [unpackArrayBuffer, unpackClass(Uint16Array)]);
    codec.addExtUnpacker(0x15, [unpackArrayBuffer, unpackClass(Int32Array)]);
    codec.addExtUnpacker(0x16, [unpackArrayBuffer, unpackClass(Uint32Array)]);
    codec.addExtUnpacker(0x17, [unpackArrayBuffer, unpackClass(Float32Array)]);

    // PhantomJS/1.9.7 doesn't have Float64Array
    if ("undefined" !== typeof Float64Array) {
      codec.addExtUnpacker(0x18, [unpackArrayBuffer, unpackClass(Float64Array)]);
    }

    // IE10 doesn't have Uint8ClampedArray
    if ("undefined" !== typeof Uint8ClampedArray) {
      codec.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
    }

    codec.addExtUnpacker(0x1A, unpackArrayBuffer);
    codec.addExtUnpacker(0x1D, [unpackArrayBuffer, unpackClass(DataView)]);
  }

  if (Bufferish.hasBuffer) {
    codec.addExtUnpacker(0x1B, unpackClass(Buffer));
  }
}

function decode(input) {
  if (!_decode) _decode = __webpack_require__(/*! ./decode */ "../node_modules/msgpack-lite/lib/decode.js").decode; // lazy load
  return _decode(input);
}

function unpackRegExp(value) {
  return RegExp.apply(null, value);
}

function unpackError(Class) {
  return function(value) {
    var out = new Class();
    for (var key in ERROR_COLUMNS) {
      out[key] = value[key];
    }
    return out;
  };
}

function unpackClass(Class) {
  return function(value) {
    return new Class(value);
  };
}

function unpackArrayBuffer(value) {
  return (new Uint8Array(value)).buffer;
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/ext.js":
/*!***********************************************!*\
  !*** ../node_modules/msgpack-lite/lib/ext.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// ext.js

// load both interfaces
__webpack_require__(/*! ./read-core */ "../node_modules/msgpack-lite/lib/read-core.js");
__webpack_require__(/*! ./write-core */ "../node_modules/msgpack-lite/lib/write-core.js");

exports.createCodec = __webpack_require__(/*! ./codec-base */ "../node_modules/msgpack-lite/lib/codec-base.js").createCodec;


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/flex-buffer.js":
/*!*******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/flex-buffer.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// flex-buffer.js

exports.FlexDecoder = FlexDecoder;
exports.FlexEncoder = FlexEncoder;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");

var MIN_BUFFER_SIZE = 2048;
var MAX_BUFFER_SIZE = 65536;
var BUFFER_SHORTAGE = "BUFFER_SHORTAGE";

function FlexDecoder() {
  if (!(this instanceof FlexDecoder)) return new FlexDecoder();
}

function FlexEncoder() {
  if (!(this instanceof FlexEncoder)) return new FlexEncoder();
}

FlexDecoder.mixin = mixinFactory(getDecoderMethods());
FlexDecoder.mixin(FlexDecoder.prototype);

FlexEncoder.mixin = mixinFactory(getEncoderMethods());
FlexEncoder.mixin(FlexEncoder.prototype);

function getDecoderMethods() {
  return {
    bufferish: Bufferish,
    write: write,
    fetch: fetch,
    flush: flush,
    push: push,
    pull: pull,
    read: read,
    reserve: reserve,
    offset: 0
  };

  function write(chunk) {
    var prev = this.offset ? Bufferish.prototype.slice.call(this.buffer, this.offset) : this.buffer;
    this.buffer = prev ? (chunk ? this.bufferish.concat([prev, chunk]) : prev) : chunk;
    this.offset = 0;
  }

  function flush() {
    while (this.offset < this.buffer.length) {
      var start = this.offset;
      var value;
      try {
        value = this.fetch();
      } catch (e) {
        if (e && e.message != BUFFER_SHORTAGE) throw e;
        // rollback
        this.offset = start;
        break;
      }
      this.push(value);
    }
  }

  function reserve(length) {
    var start = this.offset;
    var end = start + length;
    if (end > this.buffer.length) throw new Error(BUFFER_SHORTAGE);
    this.offset = end;
    return start;
  }
}

function getEncoderMethods() {
  return {
    bufferish: Bufferish,
    write: write,
    fetch: fetch,
    flush: flush,
    push: push,
    pull: pull,
    read: read,
    reserve: reserve,
    send: send,
    maxBufferSize: MAX_BUFFER_SIZE,
    minBufferSize: MIN_BUFFER_SIZE,
    offset: 0,
    start: 0
  };

  function fetch() {
    var start = this.start;
    if (start < this.offset) {
      var end = this.start = this.offset;
      return Bufferish.prototype.slice.call(this.buffer, start, end);
    }
  }

  function flush() {
    while (this.start < this.offset) {
      var value = this.fetch();
      if (value) this.push(value);
    }
  }

  function pull() {
    var buffers = this.buffers || (this.buffers = []);
    var chunk = buffers.length > 1 ? this.bufferish.concat(buffers) : buffers[0];
    buffers.length = 0; // buffer exhausted
    return chunk;
  }

  function reserve(length) {
    var req = length | 0;

    if (this.buffer) {
      var size = this.buffer.length;
      var start = this.offset | 0;
      var end = start + req;

      // is it long enough?
      if (end < size) {
        this.offset = end;
        return start;
      }

      // flush current buffer
      this.flush();

      // resize it to 2x current length
      length = Math.max(length, Math.min(size * 2, this.maxBufferSize));
    }

    // minimum buffer size
    length = Math.max(length, this.minBufferSize);

    // allocate new buffer
    this.buffer = this.bufferish.alloc(length);
    this.start = 0;
    this.offset = req;
    return 0;
  }

  function send(buffer) {
    var length = buffer.length;
    if (length > this.minBufferSize) {
      this.flush();
      this.push(buffer);
    } else {
      var offset = this.reserve(length);
      Bufferish.prototype.copy.call(buffer, this.buffer, offset);
    }
  }
}

// common methods

function write() {
  throw new Error("method not implemented: write()");
}

function fetch() {
  throw new Error("method not implemented: fetch()");
}

function read() {
  var length = this.buffers && this.buffers.length;

  // fetch the first result
  if (!length) return this.fetch();

  // flush current buffer
  this.flush();

  // read from the results
  return this.pull();
}

function push(chunk) {
  var buffers = this.buffers || (this.buffers = []);
  buffers.push(chunk);
}

function pull() {
  var buffers = this.buffers || (this.buffers = []);
  return buffers.shift();
}

function mixinFactory(source) {
  return mixin;

  function mixin(target) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/read-core.js":
/*!*****************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/read-core.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// read-core.js

var ExtBuffer = __webpack_require__(/*! ./ext-buffer */ "../node_modules/msgpack-lite/lib/ext-buffer.js").ExtBuffer;
var ExtUnpacker = __webpack_require__(/*! ./ext-unpacker */ "../node_modules/msgpack-lite/lib/ext-unpacker.js");
var readUint8 = __webpack_require__(/*! ./read-format */ "../node_modules/msgpack-lite/lib/read-format.js").readUint8;
var ReadToken = __webpack_require__(/*! ./read-token */ "../node_modules/msgpack-lite/lib/read-token.js");
var CodecBase = __webpack_require__(/*! ./codec-base */ "../node_modules/msgpack-lite/lib/codec-base.js");

CodecBase.install({
  addExtUnpacker: addExtUnpacker,
  getExtUnpacker: getExtUnpacker,
  init: init
});

exports.preset = init.call(CodecBase.preset);

function getDecoder(options) {
  var readToken = ReadToken.getReadToken(options);
  return decode;

  function decode(decoder) {
    var type = readUint8(decoder);
    var func = readToken[type];
    if (!func) throw new Error("Invalid type: " + (type ? ("0x" + type.toString(16)) : type));
    return func(decoder);
  }
}

function init() {
  var options = this.options;
  this.decode = getDecoder(options);

  if (options && options.preset) {
    ExtUnpacker.setExtUnpackers(this);
  }

  return this;
}

function addExtUnpacker(etype, unpacker) {
  var unpackers = this.extUnpackers || (this.extUnpackers = []);
  unpackers[etype] = CodecBase.filter(unpacker);
}

function getExtUnpacker(type) {
  var unpackers = this.extUnpackers || (this.extUnpackers = []);
  return unpackers[type] || extUnpacker;

  function extUnpacker(buffer) {
    return new ExtBuffer(buffer, type);
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/read-format.js":
/*!*******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/read-format.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// read-format.js

var ieee754 = __webpack_require__(/*! ieee754 */ "../node_modules/ieee754/index.js");
var Int64Buffer = __webpack_require__(/*! int64-buffer */ "../node_modules/int64-buffer/int64-buffer.js");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

exports.getReadFormat = getReadFormat;
exports.readUint8 = uint8;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var BufferProto = __webpack_require__(/*! ./bufferish-proto */ "../node_modules/msgpack-lite/lib/bufferish-proto.js");

var HAS_MAP = ("undefined" !== typeof Map);
var NO_ASSERT = true;

function getReadFormat(options) {
  var binarraybuffer = Bufferish.hasArrayBuffer && options && options.binarraybuffer;
  var int64 = options && options.int64;
  var usemap = HAS_MAP && options && options.usemap;

  var readFormat = {
    map: (usemap ? map_to_map : map_to_obj),
    array: array,
    str: str,
    bin: (binarraybuffer ? bin_arraybuffer : bin_buffer),
    ext: ext,
    uint8: uint8,
    uint16: uint16,
    uint32: uint32,
    uint64: read(8, int64 ? readUInt64BE_int64 : readUInt64BE),
    int8: int8,
    int16: int16,
    int32: int32,
    int64: read(8, int64 ? readInt64BE_int64 : readInt64BE),
    float32: read(4, readFloatBE),
    float64: read(8, readDoubleBE)
  };

  return readFormat;
}

function map_to_obj(decoder, len) {
  var value = {};
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value[k[i]] = v[i];
  }
  return value;
}

function map_to_map(decoder, len) {
  var value = new Map();
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value.set(k[i], v[i]);
  }
  return value;
}

function array(decoder, len) {
  var value = new Array(len);
  var decode = decoder.codec.decode;
  for (var i = 0; i < len; i++) {
    value[i] = decode(decoder);
  }
  return value;
}

function str(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  return BufferProto.toString.call(decoder.buffer, "utf-8", start, end);
}

function bin_buffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.from(buf);
}

function bin_arraybuffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.Uint8Array.from(buf).buffer;
}

function ext(decoder, len) {
  var start = decoder.reserve(len+1);
  var type = decoder.buffer[start++];
  var end = start + len;
  var unpack = decoder.codec.getExtUnpacker(type);
  if (!unpack) throw new Error("Invalid ext type: " + (type ? ("0x" + type.toString(16)) : type));
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return unpack(buf);
}

function uint8(decoder) {
  var start = decoder.reserve(1);
  return decoder.buffer[start];
}

function int8(decoder) {
  var start = decoder.reserve(1);
  var value = decoder.buffer[start];
  return (value & 0x80) ? value - 0x100 : value;
}

function uint16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  return (buffer[start++] << 8) | buffer[start];
}

function int16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  var value = (buffer[start++] << 8) | buffer[start];
  return (value & 0x8000) ? value - 0x10000 : value;
}

function uint32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] * 16777216) + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start];
}

function int32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] << 24) | (buffer[start++] << 16) | (buffer[start++] << 8) | buffer[start];
}

function read(len, method) {
  return function(decoder) {
    var start = decoder.reserve(len);
    return method.call(decoder.buffer, start, NO_ASSERT);
  };
}

function readUInt64BE(start) {
  return new Uint64BE(this, start).toNumber();
}

function readInt64BE(start) {
  return new Int64BE(this, start).toNumber();
}

function readUInt64BE_int64(start) {
  return new Uint64BE(this, start);
}

function readInt64BE_int64(start) {
  return new Int64BE(this, start);
}

function readFloatBE(start) {
  return ieee754.read(this, start, false, 23, 4);
}

function readDoubleBE(start) {
  return ieee754.read(this, start, false, 52, 8);
}

/***/ }),

/***/ "../node_modules/msgpack-lite/lib/read-token.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/read-token.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// read-token.js

var ReadFormat = __webpack_require__(/*! ./read-format */ "../node_modules/msgpack-lite/lib/read-format.js");

exports.getReadToken = getReadToken;

function getReadToken(options) {
  var format = ReadFormat.getReadFormat(options);

  if (options && options.useraw) {
    return init_useraw(format);
  } else {
    return init_token(format);
  }
}

function init_token(format) {
  var i;
  var token = new Array(256);

  // positive fixint -- 0x00 - 0x7f
  for (i = 0x00; i <= 0x7f; i++) {
    token[i] = constant(i);
  }

  // fixmap -- 0x80 - 0x8f
  for (i = 0x80; i <= 0x8f; i++) {
    token[i] = fix(i - 0x80, format.map);
  }

  // fixarray -- 0x90 - 0x9f
  for (i = 0x90; i <= 0x9f; i++) {
    token[i] = fix(i - 0x90, format.array);
  }

  // fixstr -- 0xa0 - 0xbf
  for (i = 0xa0; i <= 0xbf; i++) {
    token[i] = fix(i - 0xa0, format.str);
  }

  // nil -- 0xc0
  token[0xc0] = constant(null);

  // (never used) -- 0xc1
  token[0xc1] = null;

  // false -- 0xc2
  // true -- 0xc3
  token[0xc2] = constant(false);
  token[0xc3] = constant(true);

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = flex(format.uint8, format.bin);
  token[0xc5] = flex(format.uint16, format.bin);
  token[0xc6] = flex(format.uint32, format.bin);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = flex(format.uint8, format.ext);
  token[0xc8] = flex(format.uint16, format.ext);
  token[0xc9] = flex(format.uint32, format.ext);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = format.float32;
  token[0xcb] = format.float64;

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = format.uint8;
  token[0xcd] = format.uint16;
  token[0xce] = format.uint32;
  token[0xcf] = format.uint64;

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = format.int8;
  token[0xd1] = format.int16;
  token[0xd2] = format.int32;
  token[0xd3] = format.int64;

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  token[0xd4] = fix(1, format.ext);
  token[0xd5] = fix(2, format.ext);
  token[0xd6] = fix(4, format.ext);
  token[0xd7] = fix(8, format.ext);
  token[0xd8] = fix(16, format.ext);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = flex(format.uint8, format.str);
  token[0xda] = flex(format.uint16, format.str);
  token[0xdb] = flex(format.uint32, format.str);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = flex(format.uint16, format.array);
  token[0xdd] = flex(format.uint32, format.array);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = flex(format.uint16, format.map);
  token[0xdf] = flex(format.uint32, format.map);

  // negative fixint -- 0xe0 - 0xff
  for (i = 0xe0; i <= 0xff; i++) {
    token[i] = constant(i - 0x100);
  }

  return token;
}

function init_useraw(format) {
  var i;
  var token = init_token(format).slice();

  // raw 8 -- 0xd9
  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  token[0xd9] = token[0xc4];
  token[0xda] = token[0xc5];
  token[0xdb] = token[0xc6];

  // fixraw -- 0xa0 - 0xbf
  for (i = 0xa0; i <= 0xbf; i++) {
    token[i] = fix(i - 0xa0, format.bin);
  }

  return token;
}

function constant(value) {
  return function() {
    return value;
  };
}

function flex(lenFunc, decodeFunc) {
  return function(decoder) {
    var len = lenFunc(decoder);
    return decodeFunc(decoder, len);
  };
}

function fix(len, method) {
  return function(decoder) {
    return method(decoder, len);
  };
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/write-core.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/write-core.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// write-core.js

var ExtBuffer = __webpack_require__(/*! ./ext-buffer */ "../node_modules/msgpack-lite/lib/ext-buffer.js").ExtBuffer;
var ExtPacker = __webpack_require__(/*! ./ext-packer */ "../node_modules/msgpack-lite/lib/ext-packer.js");
var WriteType = __webpack_require__(/*! ./write-type */ "../node_modules/msgpack-lite/lib/write-type.js");
var CodecBase = __webpack_require__(/*! ./codec-base */ "../node_modules/msgpack-lite/lib/codec-base.js");

CodecBase.install({
  addExtPacker: addExtPacker,
  getExtPacker: getExtPacker,
  init: init
});

exports.preset = init.call(CodecBase.preset);

function getEncoder(options) {
  var writeType = WriteType.getWriteType(options);
  return encode;

  function encode(encoder, value) {
    var func = writeType[typeof value];
    if (!func) throw new Error("Unsupported type \"" + (typeof value) + "\": " + value);
    func(encoder, value);
  }
}

function init() {
  var options = this.options;
  this.encode = getEncoder(options);

  if (options && options.preset) {
    ExtPacker.setExtPackers(this);
  }

  return this;
}

function addExtPacker(etype, Class, packer) {
  packer = CodecBase.filter(packer);
  var name = Class.name;
  if (name && name !== "Object") {
    var packers = this.extPackers || (this.extPackers = {});
    packers[name] = extPacker;
  } else {
    // fallback for IE
    var list = this.extEncoderList || (this.extEncoderList = []);
    list.unshift([Class, extPacker]);
  }

  function extPacker(value) {
    if (packer) value = packer(value);
    return new ExtBuffer(value, etype);
  }
}

function getExtPacker(value) {
  var packers = this.extPackers || (this.extPackers = {});
  var c = value.constructor;
  var e = c && c.name && packers[c.name];
  if (e) return e;

  // fallback for IE
  var list = this.extEncoderList || (this.extEncoderList = []);
  var len = list.length;
  for (var i = 0; i < len; i++) {
    var pair = list[i];
    if (c === pair[0]) return pair[1];
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/write-token.js":
/*!*******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/write-token.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// write-token.js

var ieee754 = __webpack_require__(/*! ieee754 */ "../node_modules/ieee754/index.js");
var Int64Buffer = __webpack_require__(/*! int64-buffer */ "../node_modules/int64-buffer/int64-buffer.js");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

var uint8 = __webpack_require__(/*! ./write-uint8 */ "../node_modules/msgpack-lite/lib/write-uint8.js").uint8;
var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var Buffer = Bufferish.global;
var IS_BUFFER_SHIM = Bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer);
var NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer.TYPED_ARRAY_SUPPORT;
var Buffer_prototype = Bufferish.hasBuffer && Buffer.prototype || {};

exports.getWriteToken = getWriteToken;

function getWriteToken(options) {
  if (options && options.uint8array) {
    return init_uint8array();
  } else if (NO_TYPED_ARRAY || (Bufferish.hasBuffer && options && options.safe)) {
    return init_safe();
  } else {
    return init_token();
  }
}

function init_uint8array() {
  var token = init_token();

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, writeFloatBE);
  token[0xcb] = writeN(0xcb, 8, writeDoubleBE);

  return token;
}

// Node.js and browsers with TypedArray

function init_token() {
  // (immediate values)
  // positive fixint -- 0x00 - 0x7f
  // nil -- 0xc0
  // false -- 0xc2
  // true -- 0xc3
  // negative fixint -- 0xe0 - 0xff
  var token = uint8.slice();

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = write1(0xc4);
  token[0xc5] = write2(0xc5);
  token[0xc6] = write4(0xc6);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = write1(0xc7);
  token[0xc8] = write2(0xc8);
  token[0xc9] = write4(0xc9);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, (Buffer_prototype.writeFloatBE || writeFloatBE), true);
  token[0xcb] = writeN(0xcb, 8, (Buffer_prototype.writeDoubleBE || writeDoubleBE), true);

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = write1(0xcc);
  token[0xcd] = write2(0xcd);
  token[0xce] = write4(0xce);
  token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = write1(0xd0);
  token[0xd1] = write2(0xd1);
  token[0xd2] = write4(0xd2);
  token[0xd3] = writeN(0xd3, 8, writeInt64BE);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = write1(0xd9);
  token[0xda] = write2(0xda);
  token[0xdb] = write4(0xdb);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = write2(0xdc);
  token[0xdd] = write4(0xdd);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = write2(0xde);
  token[0xdf] = write4(0xdf);

  return token;
}

// safe mode: for old browsers and who needs asserts

function init_safe() {
  // (immediate values)
  // positive fixint -- 0x00 - 0x7f
  // nil -- 0xc0
  // false -- 0xc2
  // true -- 0xc3
  // negative fixint -- 0xe0 - 0xff
  var token = uint8.slice();

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = writeN(0xc4, 1, Buffer.prototype.writeUInt8);
  token[0xc5] = writeN(0xc5, 2, Buffer.prototype.writeUInt16BE);
  token[0xc6] = writeN(0xc6, 4, Buffer.prototype.writeUInt32BE);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = writeN(0xc7, 1, Buffer.prototype.writeUInt8);
  token[0xc8] = writeN(0xc8, 2, Buffer.prototype.writeUInt16BE);
  token[0xc9] = writeN(0xc9, 4, Buffer.prototype.writeUInt32BE);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, Buffer.prototype.writeFloatBE);
  token[0xcb] = writeN(0xcb, 8, Buffer.prototype.writeDoubleBE);

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = writeN(0xcc, 1, Buffer.prototype.writeUInt8);
  token[0xcd] = writeN(0xcd, 2, Buffer.prototype.writeUInt16BE);
  token[0xce] = writeN(0xce, 4, Buffer.prototype.writeUInt32BE);
  token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = writeN(0xd0, 1, Buffer.prototype.writeInt8);
  token[0xd1] = writeN(0xd1, 2, Buffer.prototype.writeInt16BE);
  token[0xd2] = writeN(0xd2, 4, Buffer.prototype.writeInt32BE);
  token[0xd3] = writeN(0xd3, 8, writeInt64BE);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = writeN(0xd9, 1, Buffer.prototype.writeUInt8);
  token[0xda] = writeN(0xda, 2, Buffer.prototype.writeUInt16BE);
  token[0xdb] = writeN(0xdb, 4, Buffer.prototype.writeUInt32BE);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = writeN(0xdc, 2, Buffer.prototype.writeUInt16BE);
  token[0xdd] = writeN(0xdd, 4, Buffer.prototype.writeUInt32BE);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = writeN(0xde, 2, Buffer.prototype.writeUInt16BE);
  token[0xdf] = writeN(0xdf, 4, Buffer.prototype.writeUInt32BE);

  return token;
}

function write1(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(2);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset] = value;
  };
}

function write2(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(3);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset++] = value >>> 8;
    buffer[offset] = value;
  };
}

function write4(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(5);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset++] = value >>> 24;
    buffer[offset++] = value >>> 16;
    buffer[offset++] = value >>> 8;
    buffer[offset] = value;
  };
}

function writeN(type, len, method, noAssert) {
  return function(encoder, value) {
    var offset = encoder.reserve(len + 1);
    encoder.buffer[offset++] = type;
    method.call(encoder.buffer, value, offset, noAssert);
  };
}

function writeUInt64BE(value, offset) {
  new Uint64BE(this, offset, value);
}

function writeInt64BE(value, offset) {
  new Int64BE(this, offset, value);
}

function writeFloatBE(value, offset) {
  ieee754.write(this, value, offset, false, 23, 4);
}

function writeDoubleBE(value, offset) {
  ieee754.write(this, value, offset, false, 52, 8);
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/write-type.js":
/*!******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/write-type.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// write-type.js

var IS_ARRAY = __webpack_require__(/*! isarray */ "../node_modules/isarray/index.js");
var Int64Buffer = __webpack_require__(/*! int64-buffer */ "../node_modules/int64-buffer/int64-buffer.js");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

var Bufferish = __webpack_require__(/*! ./bufferish */ "../node_modules/msgpack-lite/lib/bufferish.js");
var BufferProto = __webpack_require__(/*! ./bufferish-proto */ "../node_modules/msgpack-lite/lib/bufferish-proto.js");
var WriteToken = __webpack_require__(/*! ./write-token */ "../node_modules/msgpack-lite/lib/write-token.js");
var uint8 = __webpack_require__(/*! ./write-uint8 */ "../node_modules/msgpack-lite/lib/write-uint8.js").uint8;
var ExtBuffer = __webpack_require__(/*! ./ext-buffer */ "../node_modules/msgpack-lite/lib/ext-buffer.js").ExtBuffer;

var HAS_UINT8ARRAY = ("undefined" !== typeof Uint8Array);
var HAS_MAP = ("undefined" !== typeof Map);

var extmap = [];
extmap[1] = 0xd4;
extmap[2] = 0xd5;
extmap[4] = 0xd6;
extmap[8] = 0xd7;
extmap[16] = 0xd8;

exports.getWriteType = getWriteType;

function getWriteType(options) {
  var token = WriteToken.getWriteToken(options);
  var useraw = options && options.useraw;
  var binarraybuffer = HAS_UINT8ARRAY && options && options.binarraybuffer;
  var isBuffer = binarraybuffer ? Bufferish.isArrayBuffer : Bufferish.isBuffer;
  var bin = binarraybuffer ? bin_arraybuffer : bin_buffer;
  var usemap = HAS_MAP && options && options.usemap;
  var map = usemap ? map_to_map : obj_to_map;

  var writeType = {
    "boolean": bool,
    "function": nil,
    "number": number,
    "object": (useraw ? object_raw : object),
    "string": _string(useraw ? raw_head_size : str_head_size),
    "symbol": nil,
    "undefined": nil
  };

  return writeType;

  // false -- 0xc2
  // true -- 0xc3
  function bool(encoder, value) {
    var type = value ? 0xc3 : 0xc2;
    token[type](encoder, value);
  }

  function number(encoder, value) {
    var ivalue = value | 0;
    var type;
    if (value !== ivalue) {
      // float 64 -- 0xcb
      type = 0xcb;
      token[type](encoder, value);
      return;
    } else if (-0x20 <= ivalue && ivalue <= 0x7F) {
      // positive fixint -- 0x00 - 0x7f
      // negative fixint -- 0xe0 - 0xff
      type = ivalue & 0xFF;
    } else if (0 <= ivalue) {
      // uint 8 -- 0xcc
      // uint 16 -- 0xcd
      // uint 32 -- 0xce
      type = (ivalue <= 0xFF) ? 0xcc : (ivalue <= 0xFFFF) ? 0xcd : 0xce;
    } else {
      // int 8 -- 0xd0
      // int 16 -- 0xd1
      // int 32 -- 0xd2
      type = (-0x80 <= ivalue) ? 0xd0 : (-0x8000 <= ivalue) ? 0xd1 : 0xd2;
    }
    token[type](encoder, ivalue);
  }

  // uint 64 -- 0xcf
  function uint64(encoder, value) {
    var type = 0xcf;
    token[type](encoder, value.toArray());
  }

  // int 64 -- 0xd3
  function int64(encoder, value) {
    var type = 0xd3;
    token[type](encoder, value.toArray());
  }

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  // fixstr -- 0xa0 - 0xbf
  function str_head_size(length) {
    return (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;
  }

  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  // fixraw -- 0xa0 - 0xbf
  function raw_head_size(length) {
    return (length < 32) ? 1 : (length <= 0xFFFF) ? 3 : 5;
  }

  function _string(head_size) {
    return string;

    function string(encoder, value) {
      // prepare buffer
      var length = value.length;
      var maxsize = 5 + length * 3;
      encoder.offset = encoder.reserve(maxsize);
      var buffer = encoder.buffer;

      // expected header size
      var expected = head_size(length);

      // expected start point
      var start = encoder.offset + expected;

      // write string
      length = BufferProto.write.call(buffer, value, start);

      // actual header size
      var actual = head_size(length);

      // move content when needed
      if (expected !== actual) {
        var targetStart = start + actual - expected;
        var end = start + length;
        BufferProto.copy.call(buffer, buffer, targetStart, start, end);
      }

      // write header
      var type = (actual === 1) ? (0xa0 + length) : (actual <= 3) ? (0xd7 + actual) : 0xdb;
      token[type](encoder, length);

      // move cursor
      encoder.offset += length;
    }
  }

  function object(encoder, value) {
    // null
    if (value === null) return nil(encoder, value);

    // Buffer
    if (isBuffer(value)) return bin(encoder, value);

    // Array
    if (IS_ARRAY(value)) return array(encoder, value);

    // int64-buffer objects
    if (Uint64BE.isUint64BE(value)) return uint64(encoder, value);
    if (Int64BE.isInt64BE(value)) return int64(encoder, value);

    // ext formats
    var packer = encoder.codec.getExtPacker(value);
    if (packer) value = packer(value);
    if (value instanceof ExtBuffer) return ext(encoder, value);

    // plain old Objects or Map
    map(encoder, value);
  }

  function object_raw(encoder, value) {
    // Buffer
    if (isBuffer(value)) return raw(encoder, value);

    // others
    object(encoder, value);
  }

  // nil -- 0xc0
  function nil(encoder, value) {
    var type = 0xc0;
    token[type](encoder, value);
  }

  // fixarray -- 0x90 - 0x9f
  // array 16 -- 0xdc
  // array 32 -- 0xdd
  function array(encoder, value) {
    var length = value.length;
    var type = (length < 16) ? (0x90 + length) : (length <= 0xFFFF) ? 0xdc : 0xdd;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    for (var i = 0; i < length; i++) {
      encode(encoder, value[i]);
    }
  }

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  function bin_buffer(encoder, value) {
    var length = value.length;
    var type = (length < 0xFF) ? 0xc4 : (length <= 0xFFFF) ? 0xc5 : 0xc6;
    token[type](encoder, length);
    encoder.send(value);
  }

  function bin_arraybuffer(encoder, value) {
    bin_buffer(encoder, new Uint8Array(value));
  }

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  function ext(encoder, value) {
    var buffer = value.buffer;
    var length = buffer.length;
    var type = extmap[length] || ((length < 0xFF) ? 0xc7 : (length <= 0xFFFF) ? 0xc8 : 0xc9);
    token[type](encoder, length);
    uint8[value.type](encoder);
    encoder.send(buffer);
  }

  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  function obj_to_map(encoder, value) {
    var keys = Object.keys(value);
    var length = keys.length;
    var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    keys.forEach(function(key) {
      encode(encoder, key);
      encode(encoder, value[key]);
    });
  }

  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  function map_to_map(encoder, value) {
    if (!(value instanceof Map)) return obj_to_map(encoder, value);

    var length = value.size;
    var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    value.forEach(function(val, key, m) {
      encode(encoder, key);
      encode(encoder, val);
    });
  }

  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  // fixraw -- 0xa0 - 0xbf
  function raw(encoder, value) {
    var length = value.length;
    var type = (length < 32) ? (0xa0 + length) : (length <= 0xFFFF) ? 0xda : 0xdb;
    token[type](encoder, length);
    encoder.send(value);
  }
}


/***/ }),

/***/ "../node_modules/msgpack-lite/lib/write-uint8.js":
/*!*******************************************************!*\
  !*** ../node_modules/msgpack-lite/lib/write-uint8.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {

// write-unit8.js

var constant = exports.uint8 = new Array(256);

for (var i = 0x00; i <= 0xFF; i++) {
  constant[i] = write0(i);
}

function write0(type) {
  return function(encoder) {
    var offset = encoder.reserve(1);
    encoder.buffer[offset] = type;
  };
}


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

module.exports="*{outline:none}.content.invalid .name{color:#f04747}.content{display:flex;--size-big: 24px;--size-small: 16px}.info{flex:1 1 auto;min-width:1px;flex-direction:column;flex-wrap:nowrap;display:flex;align-items:stretch;justify-content:center;text-indent:0}.icon{background:#36393f center / cover;margin-right:16px;width:65px;height:65px;border-radius:16px;text-align:center;color:#dcddde;position:relative}.name{min-width:0px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;align-items:center;display:flex;color:#FFF;margin-bottom:2px;font-size:var(--size-big)}.join{text-decoration:none;margin-left:auto;white-space:nowrap;border-radius:3px;font-size:var(--size-small);padding:0px 20px;user-select:none;color:#FFF;background:#3ba55d;cursor:pointer;align-items:center;display:flex}.status{display:flex;align-items:center;margin-left:16px;color:#b9bbbe;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:var(--size-small);white-space:pre-wrap}.status::before{content:'';display:inline-block;margin-right:4px;width:8px;height:8px;border-radius:50%}.status.online::before{background:#43b581}.status.total::after{content:' Members'}.status.online::after{content:' Online'}.status.total::before{background:#747f8d}.content.invalid .status{display:none}"

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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
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


var { krunker } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js");

if(krunker)__webpack_require__(/*! ./main */ "./main.js");
})();

/******/ })()
;