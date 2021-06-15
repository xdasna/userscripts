// ==UserScript==
// @name           Krunker Junker
// @author         The Gaming Gurus
// @description    Junk in Your Krunk Guaranteed
// @version        1.0
// @license        gpl-3.0
// @namespace      https://greasyfork.org/users/704479
// @icon           https://y9x.github.io/webpack/junker/junker.png
// @grant          none
// @source         https://github.com/y9x/webpack/
// @supportURL     https://y9x.github.io/discord/
// @extracted      Tue, 15 Jun 2021 00:00:57 GMT
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
 

var CRC2d = CanvasRenderingContext2D.prototype,
	{ api, meta } = __webpack_require__(/*! ../libs/consts */ "../libs/consts.js"),
	Utils = __webpack_require__(/*! ./utils */ "./utils.js"),
	utils = new Utils();

class Main {
	constructor() {
		this.hash = utils.genHash(8);
		window[this.hash] = this;
		
		this.utils = utils;
		
		this.settings = null;

		this.css = {
			hideAdverts: `#aContainer, #aHolder, #endAContainer, #aMerger { display: none !important; }`,
			noTextShadows: `*, .button.small, .bigShadowT { text-shadow: none !important; }`,
		};

		this.tabs = ['Render','Weapon','Player','GamePlay','Radio','Dev'];

		this.downKeys = new Set();
		this.nameTags = undefined;

		this.consts = {
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

		this.key = {
			frame: 0,
			delta: 1,
			xdir: 2,
			ydir: 3,
			moveDir: 4,
			shoot: 5,
			scope: 6,
			jump: 7,
			reload: 8,
			crouch: 9,
			weaponScroll: 10,
			weaponSwap: 11,
			moveLock: 12
		};
		
		this.eventHandlers();
		
		this.discord = { guild: {} };
		
		fetch(new URL('code.txt', meta.discord), { cache: 'no-store' }).then(async res => {
			var code = await res.text();
			
			this.discord.code = code;
			
			Object.assign(this.discord, await(await fetch(`https://discord.com/api/v8/invites/${code}?with_counts=true`)).json());
		});
		
		var tokenPromise = api.token();
		
		api.source().then(source => {
			this.gameLoad(source, tokenPromise);
			this.createSettings();
			this.gameHooks();
		});
	}
	onInput(input) {
		if (!this.settings || !utils.isDefined(this.me)) return input;
		let isMelee = utils.isDefined(this.me.weapon.melee)&&this.me.weapon.melee||utils.isDefined(this.me.weapon.canThrow)&&this.me.weapon.canThrow;
		let ammoLeft = this.me[this.vars.ammos][this.me[this.vars.weaponIndex]];

		// autoReload
		if (this.settings.autoReload.val) {
			//let capacity = this.me.weapon.ammo;
			//if (ammoLeft < capacity)
			if (isMelee) {
				if (!this.me.canThrow) {
					//this.me.refillKnife();
				}
			} else if (!ammoLeft) {
				this.game.players.reload(this.me);
				input[this.key.reload] = 1;
				// this.me[this.vars.reloadTimer] = 1;
				//this.me.resetAmmo();
			}
		}

		//Auto Bhop
		if (this.settings.autoBhop.val && this.settings.autoBhop.val !== "off") {
			if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoJump" || this.settings.autoBhop.val == "autoSlide") {
				this.controls.keys[this.controls.binds.jump.val] ^= 1;
				if (this.controls.keys[this.controls.binds.jump.val]) {
					this.controls.didPressed[this.controls.binds.jump.val] = 1;
				}
				if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoSlide") {
					if (this.me[this.vars.yVel] < -0.03 && this.me.canSlide) {
						setTimeout(() => {
							this.controls.keys[this.controls.binds.crouch.val] = 0;
						}, this.me.slideTimer||325);
						this.controls.keys[this.controls.binds.crouch.val] = 1;
						this.controls.didPressed[this.controls.binds.crouch.val] = 1;
					}
				}
			}
		}

		//Autoaim
		if (this.settings.autoAim.val !== "off") {
			this.ray.setFromCamera(this.vec2, this.renderer.fpsCamera);
			const playerMaps = []
			let target = null, targets = this.game.players.list.filter(enemy => {
				let hostile = undefined !== enemy[this.vars.objInstances] && enemy[this.vars.objInstances] && !enemy[this.vars.isYou] && !this.getIsFriendly(enemy) && enemy.health > 0 && this.getInView(enemy);
				if (hostile) playerMaps.push( enemy[this.vars.objInstances] );
				return hostile
			})

			if (this.settings.fovBoxSize.val !== 'off') {
				let scaledWidth = this.ctx.canvas.width / this.scale;
				let scaledHeight = this.ctx.canvas.height / this.scale;
				for (let i = 0; i < targets.length; i++) {
					const t = targets[i];
					const sp = this.world2Screen(new this.three.Vector3(t.x, t.y, t.z), scaledWidth, scaledHeight, t.height / 2);
					let fovBox = null;
					switch (this.settings.fovBoxSize.val) {
						case 'large':
							fovBox = [scaledWidth / 3, scaledHeight / 4, scaledWidth * (1 / 3), scaledHeight / 2]
							break;
							// medium
						case 'medium':
							fovBox = [scaledWidth * 0.4, scaledHeight / 3, scaledWidth * 0.2, scaledHeight / 3]
							break
							// small
						case 'small':
							fovBox = [scaledWidth * 0.45, scaledHeight * 0.4, scaledWidth * 0.1, scaledHeight * 0.2]
							break
					}
					if (sp.x >= fovBox[0] && sp.x <= (fovBox[0] + fovBox[2]) && sp.y >= fovBox[1] && sp.y < (fovBox[1] + fovBox[3])) {
						target = targets[i]
						break
					}
				}
			}

			else target = targets.sort((p1, p2) => this.getD3D(this.me.x, this.me.z, p1.x, p1.z) - this.getD3D(this.me.x, this.me.z, p2.x, p2.z)).shift();

			if (target) {
				let obj = target[this.vars.objInstances];
				let pos = obj.position.clone();
				let yDire = (this.getDir(this.me.z, this.me.x, pos.z||target.z, pos.x||target.x) || 0) * 1000;
				let xDire = ((this.getXDire(this.me.x, this.me.y, this.me.z, pos.x||target.x, pos.y||target.y - target[this.vars.crouchVal] * this.consts.crouchDst + this.me[this.vars.crouchVal] * this.consts.crouchDst + this.settings.aimOffset.val, pos.z||target.z) || 0) - this.consts.recoilMlt * this.me[this.vars.recoilAnimY]) * 1000;
				let inCast = this.ray.intersectObjects(playerMaps, true).length//this.ray.intersectObjects(this.game.map.objects, true, obj) == obj;

				let vis = pos.clone();
				vis.y += this.consts.playerHeight + this.consts.nameOffset - (target[this.vars.crouchVal] * this.consts.crouchDst);
				if (target.hatIndex >= 0) vis.y += this.consts.nameOffsetHat;
				let dstDiv = Math.max(0.3, (1 - (this.getD3D(this.me.x, this.me.y, this.me.z, vis.x, vis.y, vis.z) / 600)));
				let fSize = (20 * dstDiv);
				let visible = (fSize >= 1 && this.containsPoint(vis));

				if (this.me.weapon[this.vars.nAuto] && this.me[this.vars.didShoot]) {
					input[this.key.shoot] = 0;
					input[this.key.scope] = 0;
					this.me.inspecting = false;
					this.me.inspectX = 0;
				}
				else if (!visible && this.settings.frustrumCheck.val) this.resetLookAt();
				else if (ammoLeft||isMelee) {
					//input[this.key.scope] = this.settings.autoAim.val === "assist" || this.settings.autoAim.val === "correction" || this.settings.autoAim.val === "trigger" ? this.controls[this.vars.mouseDownR] : 0;
					switch (this.settings.autoAim.val) {
						case "quickScope":
							input[this.key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
							if (!this.me[this.vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) {
									this.lookDir(xDire, yDire);
									input[this.key.shoot] = 1;
								}
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						case "assist": case "easyassist":
							if (input[this.key.scope] || this.settings.autoAim.val === "easyassist") {
								if (!this.me.aimDir && visible || this.settings.autoAim.val === "easyassist") {
									if (!this.me.canThrow||!isMelee) {
										this.lookDir(xDire, yDire);
									}
									if (this.settings.autoAim.val === "easyassist" && this.controls[this.vars.mouseDownR]) input[this.key.scope] = 1;
									input[this.key.ydir] = yDire
									input[this.key.xdir] = xDire
								}
							}
							break;
						case "silent":
							input[this.key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
							if (!this.me[this.vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) input[this.key.shoot] = 1;
							} else input[this.key.scope] = 1;
							input[this.key.ydir] = yDire
							input[this.key.xdir] = xDire
							break;
						case "trigger":
							if (input[this.key.scope] && inCast) {
								input[this.key.shoot] = 1;
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						case "correction":
							if (input[this.key.shoot] == 1) {
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						default:
							this.resetLookAt();
							break;
					}
				}
			} else {
				this.resetLookAt();
			}
		}
		
		return input;
	}

	onRender() {
		let main = this;
		let scaledWidth = this.ctx.canvas.width / this.scale;
		let scaledHeight = this.ctx.canvas.height / this.scale;
		let playerScale = (2 * this.consts.armScale + this.consts.chestWidth + this.consts.armInset) / 2
		let worldPosition = this.renderer.camera[this.vars.getWorldPosition]();
		let espVal = this.settings.renderESP.val;
		
		for (let iter = 0, length = this.game.players.list.length; iter < length; iter++) {
			let player = this.game.players.list[iter];
			if (!player || player[this.vars.isYou] || !player.active || !utils.isDefined(player[this.vars.objInstances]) ) {
				continue;
			}

			let isEnemy = !this.me.team || this.me.team != player.team;
			let isRisky = player.isDev || player.isMod || player.isMapMod || player.canGlobalKick || player.canViewReports || player.partnerApp || player.canVerify || player.canTeleport || player.kpdData || player.fakeName || player.level >= 100;

			// Chams
			if (!player[this.vars.objInstances].visible) {
				Object.defineProperty(player[this.vars.objInstances], 'visible', {
					value: true,
					writable: false
				});
			} else {
				player[this.vars.objInstances].traverse(obj => {
					if (obj && obj.type=='Mesh' && obj.hasOwnProperty('material')) {
						if (!obj.hasOwnProperty('_material')) {
							obj._material = obj.material;
						} else {
							Object.defineProperty(obj, 'material', {
								get() {
									if (utils.isDefined(main.mesh) && main.settings.renderChams.val) {
										return main.mesh[ isEnemy ? isRisky ? "#FFFF00" : main.settings.rainbowColor.val ? main.overlay.rainbow.col : main.settings.chamHostileCol.val||"#ff0000" : main.settings.chamFriendlyCol.val||"#00ff00"];
									}
									return this._material;
								}, set(val) {return this._material}
							});
						}

						obj.material.wireframe = !!main.settings.renderWireFrame.val;
					}
				})
			}

			//ESP
			// the below variables correspond to the 2d box esps corners
			let xmin = Infinity;
			let xmax = -Infinity;
			let ymin = Infinity;
			let ymax = -Infinity;
			let position = null;
			let br = false;
			for (let j = -1; !br && j < 2; j+=2) {
				for (let k = -1; !br && k < 2; k+=2) {
					for (let l = 0; !br && l < 2; l++) {
						if (position = player[this.vars.objInstances].position.clone()) {
							position.x += j * playerScale;
							position.z += k * playerScale;
							position.y += l * (player.height - player[this.vars.crouchVal] * this.consts.crouchDst);
							if (!this.containsPoint(position)) {
								br = true;
								break;
							}
							position.project(this.renderer.camera);
							xmin = Math.min(xmin, position.x);
							xmax = Math.max(xmax, position.x);
							ymin = Math.min(ymin, position.y);
							ymax = Math.max(ymax, position.y);
						}
					}
				}
			}

			if (br) {
				continue;
			}

			xmin = (xmin + 1) / 2;
			ymin = (ymin + 1) / 2;
			xmax = (xmax + 1) / 2;
			ymax = (ymax + 1) / 2;

			// save and restore these variables later so they got nothing on us
			const original_strokeStyle = this.ctx.strokeStyle;
			const original_lineWidth = this.ctx.lineWidth;
			const original_font = this.ctx.font;
			const original_fillStyle = this.ctx.fillStyle;

			//Tracers
			if (this.settings.renderTracers.val) {
				CRC2d.save.apply(this.ctx, []);
				let screenPos = this.world2Screen(player[this.vars.objInstances].position);
				this.ctx.lineWidth = 1;
				this.ctx.beginPath();
				this.ctx.moveTo(this.ctx.canvas.width/2, this.ctx.canvas.height - (this.ctx.canvas.height - scaledHeight));
				this.ctx.lineTo(screenPos.x, screenPos.y);
				this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
				this.ctx.stroke();
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.settings.espHostileCol.val||"#ff0000" : main.settings.espFriendlyCol.val||"#00ff00"//this.settings.rainbowColor.val ? this.overlay.rainbow.col : "#eb5656"
				this.ctx.stroke();
				CRC2d.restore.apply(this.ctx, []);
			}

			CRC2d.save.apply(this.ctx, []);
			if (espVal == "twoD" || espVal == "full") {
				// perfect box esp
				this.ctx.lineWidth = 5;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.settings.espHostileCol.val||"#ff0000" : main.settings.espFriendlyCol.val||"#00ff00"//this.settings.rainbowColor.val ? this.overlay.rainbow.col : "#eb5656"
				let distanceScale = Math.max(.3, 1 - this.getD3D(worldPosition.x, worldPosition.y, worldPosition.z, player.x, player.y, player.z) / 600);
				CRC2d.scale.apply(this.ctx, [distanceScale, distanceScale]);
				let xScale = scaledWidth / distanceScale;
				let yScale = scaledHeight / distanceScale;
				CRC2d.beginPath.apply(this.ctx, []);
				ymin = yScale * (1 - ymin);
				ymax = yScale * (1 - ymax);
				xmin = xScale * xmin;
				xmax = xScale * xmax;
				CRC2d.moveTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.stroke.apply(this.ctx, []);

				if (espVal == "full") {
					// health bar
					this.ctx.fillStyle = "#000000";
					let barMaxHeight = ymax - ymin;
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight]);
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight * (player.health / player[this.vars.maxHealth])]);
					// info
					this.ctx.font = "Bold 48px Tahoma";
					this.ctx.fillStyle = "white";
					this.ctx.strokeStyle='black';
					this.ctx.lineWidth = 1;
					let x = xmax + 7;
					let y = ymax;
					CRC2d.fillText.apply(this.ctx, [player.name||player.alias, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.name||player.alias, x, y]);
					this.ctx.font = "Bold 30px Tahoma";
					this.ctx.fillStyle = "#cccccc";
					y += 35;
					CRC2d.fillText.apply(this.ctx, [player.weapon.name, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.weapon.name, x, y]);
					y += 35;
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillText.apply(this.ctx, [player.health + ' HP', x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.health + ' HP', x, y]);
				}
			}

			CRC2d.restore.apply(this.ctx, []);
			this.ctx.strokeStyle = original_strokeStyle;
			this.ctx.lineWidth = original_lineWidth;
			this.ctx.font = original_font;
			this.ctx.fillStyle = original_fillStyle;
		}

		if (this.settings.fovBoxSize.val !== 'off') {
			let fovBox = null;
			switch (this.settings.fovBoxSize.val) {
				case 'large':
					fovBox = [scaledWidth / 3, scaledHeight / 4, scaledWidth * (1 / 3), scaledHeight / 2]
					break;
					// medium
				case 'medium':
					fovBox = [scaledWidth * 0.4, scaledHeight / 3, scaledWidth * 0.2, scaledHeight / 3]
					break
					// small
				case 'small':
					fovBox = [scaledWidth * 0.45, scaledHeight * 0.4, scaledWidth * 0.1, scaledHeight * 0.2]
					break
			}
			CRC2d.save.apply(this.ctx, []);
			this.ctx.strokeStyle = "red"
			this.ctx.strokeRect(...fovBox)
			CRC2d.restore.apply(this.ctx, []);
		}
	}

	createSettings() {

		this.settings = {

			// Render

			renderESP: {
				tab: "Render",
				name: "Player ESP Type",
				val: "off",
				html: () =>
				this.generateSetting("select", "renderESP", {
					off: "Off",
					walls: "Walls",
					twoD: "2d",
					full: "Full"
				}),
				set: (value) => {
					this.nameTags=(value=="off")?undefined:true;
					this.noNameTags=(value=="full")?true:undefined;
				}
			},
			renderTracers: {
				tab: "Render",
				name: "Player Tracers",
				val: false,
				html: () => this.generateSetting("checkbox", "renderTracers"),
			},
			espHostileCol: {
				tab: "Render",
				name: "Hostile Color",
				val: "#ff0000",
				html: () => this.generateSetting("color", "espHostileCol"),
			},
			espFriendlyCol: {
				tab: "Render",
				name: "Friendly Color",
				val: "#00ff00",
				html: () => this.generateSetting("color", "espFriendlyCol"),
			},
			renderChams: {
				tab: "Render",
				pre: "<div class='separator'>Color Chams</div>",
				name: "Player Chams",
				val: false,
				html: () => this.generateSetting("checkbox", "renderChams") //+
			},
			renderWireFrame: {
				tab: "Render",
				name: "Player Wireframe",
				val: false,
				html: () => this.generateSetting("checkbox", "renderWireFrame"),
			},
			rainbowColor: {
				tab: "Render",
				name: "Rainbow Color",
				val: false,
				html: () => this.generateSetting("checkbox", "rainbowColor"),
			},
			chamHostileCol: {
				tab: "Render",
				name: "Hostile Color",
				val: "#ff0000",
				html: () => this.generateSetting("color", "chamHostileCol"),
			},
			chamFriendlyCol: {
				tab: "Render",
				name: "Friendly Color",
				val: "#00ff00",
				html: () => this.generateSetting("color", "chamFriendlyCol"),
			},
			hideAdverts: {
				tab: "Render",
				pre: "<div class='separator'>Krunker UI</div>",
				name: "Hide Advertisments",
				val: true,
				html: () => this.generateSetting("checkbox", "hideAdverts"),
				set: (value, init) => {
					if (value) this.mainCustomRule("insert", this.css.hideAdverts);
					else if (!init) this.mainCustomRule("delete", this.css.hideAdverts);
				}
			},
			hideStreams: {
				tab: "Render",
				name: "Hide Streams",
				val: false,
				html: () => this.generateSetting("checkbox", "hideStreams"),
				set: (value) => { this.displayStyle("streamContainer", value) }
			},
			hideMerch: {
				tab: "Render",
				name: "Hide Merch",
				val: false,
				html: () => this.generateSetting("checkbox", "hideMerch"),
				set: (value) => { this.displayStyle("merchHolder", value) }
			},
			hideNewsConsole: {
				tab: "Render",
				name: "Hide News Console",
				val: false,
				html: () => this.generateSetting("checkbox", "hideNewsConsole"),
				set: (value) => { this.displayStyle("newsHolder", value) }
			},
			hideCookieButton: {
				tab: "Render",
				name: "Hide Security Manage Button",
				val: false,
				html: () => this.generateSetting("checkbox", "hideCookieButton"),
				set: (value) => { this.displayStyle("onetrust-consent-sdk", value) }
			},
			//Rendering
			showSkidBtn: {
				tab: "Render",
				pre: "<hr>",
				name: "Show Menu Button",
				val: true,
				html: () => this.generateSetting("checkbox", "showSkidBtn"),
				set: (value, init) => {
					let button = document.getElementById("mainButton");
					if (!utils.isDefined(button)) utils.createButton("Junk", "https://i.imgur.com/pA5e8hy.png", this.toggleMenu, value)
					utils.waitFor(() => document.getElementById("mainButton")).then(button => { button.style.display = value ? "inherit" : "none" })
				}
			},
			customCSS: {
				tab: "Render",
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
				tab: "Render",
				name: "Custom Billboard Text",
				val: "",
				html: () =>
				this.generateSetting(
					"text",
					"customBillboard",
					"Custom Billboard Text"
				),
			},

			// Weapon

			autoReload: {
				tab: "Weapon",
				//pre: "<br><div class='setHed'>Weapon</div>",
				name: "Auto Reload",
				val: false,
				html: () => this.generateSetting("checkbox", "autoReload"),
			},
			weaponZoom: {
				tab: "Weapon",
				name: "Weapon Zoom",
				val: 1.0,
				min: 0,
				max: 50.0,
				step: 0.01,
				html: () => this.generateSetting("slider", "weaponZoom"),
				set: (value) => utils.waitFor(() => this.renderer).then(renderer => renderer.adsFovMlt.fill(value))
			},
			weaponTrails: {
				tab: "Weapon",
				name: "Weapon Trails",
				val: false,
				html: () => this.generateSetting("checkbox", "weaponTrails"),
				set: (value) => utils.waitFor(() => this.me).then(me => { me.weapon.trail = value })
			},
			autoAim: {
				tab: "Weapon",
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
				tab: "Weapon",
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
				tab: "Weapon",
				name: "Aim Offset",
				val: 0,
				min: -4,
				max: 1,
				step: 0.01,
				html: () => this.generateSetting("slider", "aimOffset"),
				set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
			},
			frustrumCheck: {
				tab: "Weapon",
				name: "Player Visible Check",
				val: false,
				html: () => this.generateSetting("checkbox", "frustrumCheck"),
			},
			wallPenetrate: {
				tab: "Weapon",
				name: "Aim through Penetratables",
				val: false,
				html: () => this.generateSetting("checkbox", "wallPenetrate"),
			},

			// Player

			autoBhop: {
				tab: "Player",
				//pre: "<br><div class='setHed'>Player</div>",

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
				tab: "Player",
				name: "Unlock Skins",
				val: false,
				html: () => this.generateSetting("checkbox", "skinUnlock"),
			},

			// GamePlay

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

			// Radio

			playStream: {
				tab: "Radio",
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

			// Dev

		   saveGameJsBtn: {
				tab: "Dev",
				name: "Save Game Script",
				val: false,
				html: () => this.generateSetting("button", "saveGameJsBtn", { label:"Save", function: `${this.hash}.globalCMD('save gameJS')`}),
			},
		}

		async function getSavedSettings() {

			async function getValue(key) {
				let value = await GM.getValue(key, "Fuck");
				if (value != "Fuck" && value != undefined) {
					return value;
				} else {
					return new Promise((resolve) => {
						window.setTimeout(() => resolve(getValue()), 10);
					})
				}
			}

			for (let key in main.settings) {
				const value = await getValue(key);
				main.settings[key].val = value !== null ? value : main.settings[key].val;
				main.settings[key].def = main.settings[key].val;
				if (main.settings[key].val == "false") main.settings[key].val = false;
				if (main.settings[key].val == "true") main.settings[key].val = true;
				if (main.settings[key].val == "undefined") main.settings[key].val = main.settings[key].def;
				if (main.settings[key].set) main.settings[key].set(main.settings[key].val, true);
			}

		}

		utils.waitFor(() => window.windows).then(() => {
			let win = window.windows[11]; win.html = "";
			win.header = utils.genHash(8);
			win.gen = ()=> {
				let tmpHTML = `<div class='wrapper'><div class="content"><div class="guild-icon" style="background-image: url(&quot;https://cdn.discordapp.com/icons/${this.discord.guild.id}/${this.discord.guild.icon}.webp?size=64&quot;);"></div><div class="guild-info" style="flex: 1 1 auto;"><div class="guild-name"> <a href="https://e9x.github.io/kru/inv">${this.discord.guild.name}</a> &nbsp;&nbsp;&nbsp;<div class="colorStandard size14 guildDetail"><div class="statusCounts"><i class="statusOnline status"></i><span class="count-30T-5k online-count">${this.discord.approximate_presence_count} Online</span>&nbsp;<i class="statusOffline status"></i><span class="count-30T-5k offline-count">${this.discord.approximate_member_count} Members</span></div></div></div></div><button type="button" class="d-button join-button" onmouseenter="playTick()" onclick="window.location.href='https://discord.com/invite/${this.discord.code}'"><div class="d-button-label">Join</div></button></div></div>`;
				tmpHTML += '<div class="tab">'; this.tabs.forEach(tab => { tmpHTML += `<button class="tablinks" onclick="${this.hash}.tabChange(event, '${tab}')">${tab}</button>` }); tmpHTML +='</div>'
				this.tabs.forEach(tab => {
					tmpHTML += `<div id="${tab}" class="tabcontent"> ${this.tabContent(tab)} </div>`
				})

				return tmpHTML
			}
			for (const key in this.settings) {
				this.settings[key].def = this.settings[key].val;
				if (!this.settings[key].disabled) {
					let tmpVal = this.getSavedVal(key);
					this.settings[key].val = tmpVal !== null ? tmpVal : this.settings[key].val;
					this.settings[key].val = this.settings[key].val;
					if (this.settings[key].val == "false") this.settings[key].val = false;
					if (this.settings[key].val == "true") this.settings[key].val = true;
					if (this.settings[key].val == "undefined") this.settings[key].val = this.settings[key].def;
					if (this.settings[key].set) this.settings[key].set(this.settings[key].val, true);
				}
			}
			//return getSavedSettings();
		})
	}

	toggleMenu() {
		let lock = document.pointerLockElement || document.mozPointerLockElement;
		if (lock) document.exitPointerLock();
		window.showWindow(12);
		if (utils.isDefined(window.SOUND)) window.SOUND.play(`tick_0`,0.1)
	}

	tabChange(evt, tabName) {
		var i, tabcontent, tablinks;
		tabcontent = document.getElementsByClassName("tabcontent");
		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = "none";
		}
		tablinks = document.getElementsByClassName("tablinks");
		for (i = 0; i < tablinks.length; i++) {
			tablinks[i].className = tablinks[i].className.replace(" active", "");
		}
		document.getElementById(tabName).style.display = "block";
		evt.currentTarget.className += " active";
	}

	tabContent(name) {
		let tmpHTML = "";
		for (let key in this.settings) {
			if (this.settings[key].tab == name) {
				if (this.settings[key].pre) tmpHTML += this.settings[key].pre;
				tmpHTML += "<div class='settName' id='" + key + "_div' style='display:block'>" + this.settings[key].name + " " + this.settings[key].html() + "</div>";
			}
		}
		return tmpHTML;
	}

	globalCMD(cmd) {
		if (confirm(cmd)) {
			switch(cmd) {
				case "save gameJS": return utils.saveData("game_" + this.vars.build + ".js", this.gameJS);
			}
		}
	}

	generateSetting(type, name, extra) {
		switch (type) {
			case 'button':
				return `<input type="button" name="${type}" id="slid_utilities_${name}" class="settingsBtn" onclick="${extra.function}" value="${extra.label}" style="float:right;width:auto"/>`;
			case 'checkbox':
				return `<label class="switch"><input type="checkbox" onclick="${this.hash}.setSetting('${name}', this.checked)" ${this.settings[name].val ? 'checked' : ''}><span class="slider"></span></label>`;
			case 'slider':
				return `<span class='sliderVal' id='slid_utilities_${name}'>${this.settings[name].val}</span><div class='slidecontainer'><input type='range' min='${this.settings[name].min}' max='${this.settings[name].max}' step='${this.settings[name].step}' value='${this.settings[name].val}' class='sliderM' oninput="${this.hash}.setSetting('${name}', this.value)"></div>`
				case 'select': {
					let temp = `<select onchange="${this.hash}.setSetting(\x27${name}\x27, this.value)" class="inputGrey2">`;
					for (let option in extra) {
						temp += '<option value="' + option + '" ' + (option == this.settings[name].val ? 'selected' : '') + '>' + extra[option] + '</option>';
					}
					temp += '</select>';
					return temp;
				}
			default:
				return `<input type="${type}" name="${type}" id="slid_utilities_${name}"\n${'color' == type ? 'style="float:right;margin-top:5px"' : `class="inputGrey2" placeholder="${extra}"`}\nvalue="${this.settings[name].val}" oninput="${this.hash}.setSetting(\x27${name}\x27, this.value)"/>`;
		}
	}

	setSetting(key, value) {
		this.settings[key].val = value;
		//await GM.setValue(key, value);
		this.saveVal(key, value);
		if (document.getElementById(`slid_utilities_${key}`)) document.getElementById(`slid_utilities_${key}`).innerHTML = value;
		if (this.settings[key].set) this.settings[key].set(value);
	}

	saveVal(name, val) {
		localStorage.setItem("krk_"+name, val);
	}

	deleteVal(name) {
		localStorage.removeItem("krk_"+name);
	}

	getSavedVal(name) {
		return localStorage.getItem("krk_"+name);
	}

	async gameHooks() {
		let main = this;
		
		let exports = await utils.waitFor(() => this.exports);
		
		let toFind = {
			overlay: ["render", "canvas"],
			config: ["accAnnounce", "availableRegions", "assetCat"],
			three: ["ACESFilmicToneMapping", "TextureLoader", "ObjectLoader"],
		};
		
		for (let rootKey in exports) {
			let exp = exports[rootKey].exports;
			for (let name in toFind) {
				if (utils.objectHas(exp, toFind[name])) {
					console.info("Found Export ", name);
					delete toFind[name];
					this[name] = exp;
				}
			}
		}
		
		if (!(Object.keys(toFind).length === 0 && toFind.constructor === Object)) {
			for (let name in toFind) {
				alert("Failed To Find Export " + name);
			}
		} else {
			Object.defineProperties(this.config, {
				nameVisRate: {
					value: 0,
					writable: false
				},
				//serverBrowserRate: {
				//    value: 0,
				//    writable: false
				//},
				serverTickFrequency: {
					value: 60,
					writable: false
				},
				syncRate: {
					value: 0,
					writable: false
				},
				hitBoxPad: {
					value: 0,
					writable: false
				},
			});

			this.ray = new this.three.Raycaster();
			this.vec2 = new this.three.Vector2(0, 0);
			this.mesh = new Proxy({}, {
				get(target, prop){
					if(!target[prop]) {
						target[prop] = new main.three.MeshBasicMaterial({
							transparent: true,
							fog: false,
							depthTest: false,
							color: prop,
						});
					}
					return target[prop] ;
				},
			});

			this.ctx = this.overlay.canvas.getContext('2d');
			this.overlay.render = new Proxy(this.overlay.render, {
				apply: (target, that, args) => {
					return [target.apply(that, args), this.overlayRender(args, ...args)]
				}
			});
		}


		const $origSkins = Symbol("origSkins"), $localSkins = Symbol("localSkins");
		Object.defineProperties(Object.prototype, {
			skins: {
				set(fn) {
					//console.log(this.toString())
					//console.log(this)
					this[$origSkins] = fn;
					if (void 0 == this[$localSkins] || !this[$localSkins].length) {
						this[$localSkins] = Array.apply(null, Array(5e3)).map((x, i) => {
							return {
								ind: i,
								cnt: 0x1,
							}
						})
					}
					return fn;
				},
				get() {
					return main.settings.skinUnlock.val && this.stats ? this[$localSkins] : this[$origSkins];
				}
			},
		})
		
		utils.waitFor(() => this.ws).then(() => {
			this.wsEvent = this.ws._dispatchEvent.bind(this.ws);
			this.wsSend = this.ws.send.bind(this.ws);
			this.ws.send = new Proxy(this.ws.send, {
				apply: function(target, that, [type, ...msg]) {
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

			this.ws._dispatchEvent = new Proxy(this.ws._dispatchEvent, {
				apply: function(target, that, [type, ...msg]) {
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
							if (pData[i] === main.ws.socketId||0) {
								pData[i + 12] = [main.skinData.main, main.skinData.secondary];
								pData[i + 13] = main.skinData.hat;
								pData[i + 14] = main.skinData.body;
								pData[i + 19] = main.skinData.knife;
								pData[i + 24] = main.skinData.dye;
								pData[i + 33] = main.skinData.waist;
							}
						}
					}
					if (type=="3") {
						if (msg[0][4]) {
							msg[0][4].wId=0;
							msg[0][4].hs=true;
							 msg[0][4].dst=Infinity
							msg[0][4].wb=true;
						}

					}
					
					return target.apply(that, [type, ...msg]);
				}
			})
		})
	}
	
	overlayRender(renderArgs, scale, game, controls, renderer, me){
		let width = this.overlay.canvas.width / scale;
		let height = this.overlay.canvas.height / scale;
		
		if (controls && typeof this.settings == "object" && this.settings.noInActivity.val) {
			controls.idleTimer = 0;
			if (utils.isDefined(this.config)) this.config.kickTimer = Infinity;
		}
		if (me) {
			if (me.active && me.health) controls.update();
			if (me.banned) Object.assign(me, {banned: false});
			if (me.isHacker) Object.assign(me, {isHacker: 0});
			if (me.kicked) Object.assign(me, {kicked: false});
			if (me.kickedByVote) Object.assign(me, {kickedByVote: false});
			me.account = Object.assign(me, {premiumT: true});
			
			["scale", "game", "controls", "renderer", "me"].forEach((item, index)=>{
				this[item] = renderArgs[index];
			});
			this.ctx.save();
			this.ctx.scale(scale, scale);
			// this.ctx.clearRect(0, 0, width, height);
			this.onRender();
			this.ctx.restore();
		}
		
		if (utils.isType(this.settings, 'object')) {
			if (this.settings.hasOwnProperty('autoActivateNuke') && this.settings.autoActivateNuke.val) {
				if (this.me && Object.keys(this.me.streaks).length) this.wsSend("k", 0);
			}
			if (this.settings.hasOwnProperty('autoClick') && this.settings.autoClick.val) {
				if (window.endUI.style.display == "none" && window.windowHolder.style.display == "none") controls.toggle(true);
			}
		}
	}
	
	async gameLoad(source, tokenPromise){
		this.gameJS = source;
		
		this.vars = utils.getData(this.gameJS, {
			build: { regex: /\.exports='(\w{5})'/, index: 1 },
			inView: { regex: /&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/, index: 1 },
			spectating: { regex: /team:window\.(\w+)/, index: 1 },
			//inView: { regex: /\]\)continue;if\(!\w+\['(.+?)\']\)continue;/, index: 1 },
			//canSee: { regex: /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, index: 1 },
			procInputs: { regex: /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, index: 1 },
			aimVal: { regex: /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, index: 1 },
			pchObjc: { regex: /0,this\.(\w+)=new \w+\.Object3D,this/, index: 1 },
			didShoot: { regex: /--,\w+\.(\w+)=!0/, index: 1 },
			nAuto: { regex: /'Single Fire',varN:'(\w+)'/, index: 1 },
			crouchVal: { regex: /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, index: 1 },
			recoilAnimY: { regex: /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, index: 1 },
			ammos: { regex: /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, index: 1 },
			weaponIndex: { regex: /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, index: 1 },
			isYou: { regex: /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, index: 1 },
			objInstances: { regex: /\w+\.\w+\(0,0,0\);if\(\w+\.(\w+)=\w+\.\w+/, index: 1 },
			getWorldPosition: { regex: /var \w+=\w+\.camera\.(\w+)\(\);/, index: 1 },
			mouseDownR: { regex: /this\.(\w+)=0,this\.keys=/, index: 1 },
			maxHealth: { regex: /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, index: 1 },
			xDire: { regex: /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/, index: 1 },
			yDire: { regex: /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/, index: 1 },
			//xVel: { regex: /this\['x']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedX']/, index: 1 },
			yVel: { regex: /this\.(\w+)=this\.\w+,this\.visible/, index: 1 },
			//zVel: { regex: /this\['z']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedZ']/, index: 1 },
		});
		
		console.log(this.vars);
		
		var patched = utils.patchData(this.gameJS, {
			exports: {regex: /(,(\w+)\(\2\.s=\d+\))(}\(\[)/, patch: `$1,${this.hash}.exports=$2.c$3`},
			inputs: {regex: /(\w+\.\w+\.\w+\?'\w+':'push'\]\()(\w+)\),/, patch: `$1${this.hash}.onInput($2)),`},
			inView: {regex: /&&(\w+\.\w+)\){(if\(\(\w+=\w+\.\w+\.\w+\.\w+)/, patch: `){if(void 0!==${this.hash}.noNameTags||!$1&&void 0 == ${this.hash}.nameTags)continue;$2`},
			socket: {regex: /this\.\w+=new WebSocket\(\w+\)/, patch: `${this.hash}.ws=this;$&`},
			isHacker:{regex: /(window\.\w+=)!0\)/, patch: `$1!1)`},
			respawnT:{regex: /\w+:1e3\*/g, patch: `respawnT:0*`},
			anticheat1:{regex: /&&\w+\(\),window\.utilities&&\(\w+\(null,null,null,!0\),\w+\(\)\)/, patch: ""},
			anticheat3:{regex: /windows\.length>\d+.*?37/, patch: `37`},
			commandline:{regex: /Object\.defineProperty\(console.*?\),/, patch: ""},
		});
		
		new Function("WP_fetchMMToken", this.hash, patched)(tokenPromise, this);
	}

	mainCustomRule(action, rule) {
		utils.waitFor(() => this.mainCustom).then(() => {
			const rules = this.mainCustom.cssRules;
			if (action == "insert") this.mainCustom.insertRule(rule);
			else if (action == "delete") {
				for (let i = 0; i < rules.length; i++) {
					if (rules[i].cssText == rule) {
						this.mainCustom.deleteRule(i);
					}
				}
			} else console.error(action + " not Implemented for mainCustomRule")
		})
	}
	
	displayStyle(el, val) {
		utils.waitFor(() => window[el], 5e3).then(node => {
			if (node) node.style.display = val ? "none" : "inherit";
			else log.error(el, " was not found in the window object");
		})
	}

	stylesheets() {
		// Get Main Custom CSS
		new Array(...document.styleSheets).map(css => {
			if (css.href) {
				let arr = /http.*?krunker.io\/css\/(\w+.css).+/.exec(css.href);
				if (arr && arr[1]) {
					let name = arr[1];
					if (name && name.includes("main_custom")) {
						this.mainCustom = css;
					}
				}
			}
		})
		let css = {
			tabStyle: '.tab { overflow: hidden; border: 1px solid #ccc; background-image: linear-gradient(#2f3136, #f1f1f1, #2f3136); }',
			btnStyle: '.tab button { background-color: inherit; float: left; border: none; outline: solid; cursor: pointer; padding: 14px 16px; transition: 0.3s; font-size: 17px; font-weight:500;color:black;text-shadow: 2px 2px #FFF;}',
			btnHoverStyle: '.tab button:hover { background-color: #ddd; }',
			activeTabStyle: '.tab button.active { background-color: #ccc; }',
			tabContentStyle: '.tabcontent { display: none; padding: 6px 12px; border: 1px solid #ccc; border-top: none; animation: fadeEffect 1s; /* Fading effect takes 1 second */}',
			zeroToFullOpacity: '@keyframes fadeEffect { from {opacity: 0;} to {opacity: 1;} }',

			separator: `.separator{display:flex;align-items:center;text-align:center}.separator::before,.separator::after{content:'';flex:1;border-bottom:1px solid #000}.separator:not(:empty)::before{margin-right:.25em}.separator:not(:empty)::after{margin-left:.25em}`,

			discordWrapper: `.wrapper{background:#2f3136;width:100%;}`,
			discordContent: `.content{display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;flex-flow:row nowrap}`,
			discordInfo: `.guild-info{flex:1 1 auto;min-width:1px;-webkit-box-orient:vertical;-webkit-box-direction:normal;flex-direction:column;flex-wrap:nowrap;display:flex;align-items:stretch;-webkit-box-align:stretch;justify-content:center;text-indent:0}`,
			discordIcon: `.guild-icon{background-color:#333;margin-right:16px;flex:0 0 auto;width:50px;height:50px;border-radius:15px;position:relative;background-clip:padding-box;background-position:50%;background-size:100% 100%}`,
			discordDesc: `.inv-desc{font-weight:700;margin:0;margin-bottom:12px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#b9bbbe;text-transform:uppercase;font-size:12px;line-height:12px;flex:1}`,
			discordName: `.guild-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:20px;align-items:center;display:flex;color:#FFF;font-weight:700}`,
			discordNameHover: `.guild-name:hover{cursor:pointer;text-decoration:underline}`,
			discordBtn: `.d-button{align-self:center;margin-left:10px;margin-top:4px;white-space:nowrap;flex:0 0 auto;position:relative;display:flex;justify-content:center;align-items:center;border-radius:3px;border:none;font-size:14px;font-weight:500;line-height:20px;height:43px;padding:2px 20px;user-select:none;transition:background-color .1s ease,color .1s ease;color:#FFF;background:#4B8;cursor:pointer}`,
			discordBtnHover: `.d-button:hover{background:#3A7;}`,
			discordBtnLabel: `.d-button-label{font-weight:500;color:white;text-shadow: 2px 2px #000;}`,
			discordActive: `.d-button:active{background:#396}`,
			discordInvDest: `.inviteDestination{margin:0}`,
			discordDetail: `.guildDetail{margin:0;font-size:14px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#b9bbbe;line-height:16px}`,
			discordStatusCounts: `.statusCounts{display:flex;-webkit-box-align:center;align-items:center;font-weight:600}`,
			discordStatus: `.status{display:block;margin-right:4px;width:8px;height:8px;border-radius:50%;flex:0 0 auto;font-style:italic}`,
			discordStatusOnline: `.statusOnline{background:#43b581}`,
			discordStatusOffline: `.statusOffline{background:#747f8d}`,
			discordCount: `.count-30T-5k{-webkit-box-flex:0;flex:0 1 auto;margin-right:8px;color:#b9bbbe;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}`,
		}, style = document.createElement('style'); style.type = 'text/css'; document.documentElement.appendChild(style);
		Object.entries(css).forEach(([name, rule], index) => {
			style.appendChild(document.createTextNode(rule));
		})

	}
	eventHandlers() {
		window.addEventListener('load', (event) => {
			console.log('page is fully loaded');
			
			this.stylesheets();

			utils.waitFor(() => document.querySelector('#instructionsUpdate'), 5e3).then(target => {
				if(!target)return console.error('Could not get instructions update');
				utils.createObserver(target, 'style', target => {
					if (this.settings.autoFindNew.val) {
						if (['Kicked', 'Banned', 'Disconnected', 'Error', 'Game is full'].some(text => target && target.innerHTML.includes(text))) {
							location = document.location.origin;
						}
					}
				});
			})

			window.addEventListener('keyup', event =>{
				if (this.downKeys.has(event.code)) this.downKeys.delete(event.code)
			});
			window.addEventListener('keydown', event =>{
				if ('INPUT' == document.activeElement.tagName) return;
				switch (event.code) {
					case 'F1':
						event.preventDefault();
						this.toggleMenu();
						break;

					case 'NumpadSubtract':
						document.exitPointerLock();
						console.dir(window)
						console.dir(this)
						break;
					default:
						if (!this.downKeys.has(event.code)) this.downKeys.add(event.code);
						break;
				}
			});
		});
	}
	getD3D(x1, y1, z1, x2, y2, z2) {
		let dx = x1 - x2;
		let dy = y1 - y2;
		let dz = z1 - z2;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	getAngleDst(a, b) {
		return Math.atan2(Math.sin(b - a), Math.cos(a - b));
	}

	getXDire(x1, y1, z1, x2, y2, z2) {
		let h = Math.abs(y1 - y2);
		let dst = this.getD3D(x1, y1, z1, x2, y2, z2);
		return (Math.asin(h / dst) * ((y1 > y2)?-1:1));
	}

	getDir(x1, y1, x2, y2) {
		return Math.atan2(y1 - y2, x1 - x2);
	}

	getDistance(x1, y1, x2, y2) {
		return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
	}

	containsPoint(point) {
		let planes = this.renderer.frustum.planes;
		for (let i = 0; i < 6; i ++) {
			if (planes[i].distanceToPoint(point) < 0) {
				return false;
			}
		}
		return true;
	}

	getCanSee(from, toX, toY, toZ, boxSize) {
		if (!from) return 0;
		boxSize = boxSize||0;
		for (let obj, dist = this.getD3D(from.x, from.y, from.z, toX, toY, toZ),
			 xDr = this.getDir(from.z, from.x, toZ, toX),
			 yDr = this.getDir(this.getDistance(from.x, from.z, toX, toZ), toY, 0, from.y),
			 dx = 1 / (dist * Math.sin(xDr - Math.PI) * Math.cos(yDr)), dz = 1 / (dist * Math.cos(xDr - Math.PI) * Math.cos(yDr)),
			 dy = 1 / (dist * Math.sin(yDr)), yOffset = from.y + (from.height || 0) - this.consts.cameraHeight,
			 aa = 0; aa < this.game.map.manager.objects.length; ++aa) {
			if (!(obj = this.game.map.manager.objects[aa]).noShoot && obj.active && !obj.transparent && (!this.settings.wallPenetrate.val || (!obj.penetrable || !this.me.weapon.pierce))) {
				let tmpDst = this.lineInRect(from.x, from.z, yOffset, dx, dz, dy, obj.x - Math.max(0, obj.width - boxSize), obj.z - Math.max(0, obj.length - boxSize), obj.y - Math.max(0, obj.height - boxSize), obj.x + Math.max(0, obj.width - boxSize), obj.z + Math.max(0, obj.length - boxSize), obj.y + Math.max(0, obj.height - boxSize));
				if (tmpDst && 1 > tmpDst) return tmpDst;
			}
		}

		return null;
	}

	lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2) {
		let t1 = (x1 - lx1) * dx;
		let t2 = (x2 - lx1) * dx;
		let t3 = (y1 - ly1) * dy;
		let t4 = (y2 - ly1) * dy;
		let t5 = (z1 - lz1) * dz;
		let t6 = (z2 - lz1) * dz;
		let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
		let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
		if (tmax < 0) return false;
		if (tmin > tmax) return false;
		return tmin;
	}

	lookDir(xDire, yDire) {
		xDire = xDire / 1000
		yDire = yDire / 1000
		this.controls.object.rotation.y = yDire
		this.controls[this.vars.pchObjc].rotation.x = xDire;
		this.controls[this.vars.pchObjc].rotation.x = Math.max(-this.consts.halfPI, Math.min(this.consts.halfPI, this.controls[this.vars.pchObjc].rotation.x));
		this.controls.yDr = (this.controls[this.vars.pchObjc].rotation.x % Math.PI).round(3);
		this.controls.xDr = (this.controls.object.rotation.y % Math.PI).round(3);
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}

	resetLookAt() {
		this.controls.yDr = this.controls[this.vars.pchObjc].rotation.x;
		this.controls.xDr = this.controls.object.rotation.y;
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}

	world2Screen (position) {
		let pos = position.clone();
		let scaledWidth = this.ctx.canvas.width / this.scale;
		let scaledHeight = this.ctx.canvas.height / this.scale;
		pos.project(this.renderer.camera);
		pos.x = (pos.x + 1) / 2;
		pos.y = (-pos.y + 1) / 2;
		pos.x *= scaledWidth;
		pos.y *= scaledHeight;
		return pos;
	}

	getInView(entity) {
		return null == this.getCanSee(this.me, entity.x, entity.y, entity.z);
	}

	getIsFriendly(entity) {
		return (this.me && this.me.team ? this.me.team : this.me.spectating ? 0x1 : 0x0) == entity.team
	}
};

module.exports = new Main();

/***/ }),

/***/ "./utils.js":
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ ((module) => {

"use strict";


class Utils {
	get head(){
		return document.head || document.getElementsByTagName("head")[0] || document.documentElement;
	}
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
	genHash(sz){
		return [...Array(sz)].map(_ => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[~~(Math.random()*52)]).join('');
	}
	loadScript(data){
		try {
			var script = null;
			if (this.isType(data, 'string')) {
				if (this.isURL(data)) {
					this.request(data, "text", {cache: "no-store"}).then((str)=>this.loadScript(str));
				} else {
					script = document.createElement("script");
					script.appendChild(document.createTextNode(data));
				}
			} else if (this.isType(data, 'function')) {
				script = document.createElement("script");
				script.textContent = `try {(${data})()}catch(e){console.error(e)}`;
			}
			if (script) this.head.appendChild(script);
		} catch (ex) {console.error(ex)}
		if (script && script.parentNode) script.parentNode.removeChild(script);
		if (script && script.hasAttribute("textContent")) script.removeAttribute("textContent");
	}
	loadStyle(url){
		let link = document.createElement('link');
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
		return this.head.appendChild(link);
	}
	loadFrame(attributes){
		let frame = document.createElement('iframe');
		Object.entries(attributes).forEach(([type, rules], index) => {
			frame.setAttribute(type, ...rules);
		})
		return this.head.appendChild(frame);
	}
	patchData(data, patches){
		for(let name in patches) {
			let object = patches[name];
			let found = object.regex.exec(data);
			if (found) {
				data = data.replace(object.regex, object.patch);
				console.info("Patched ", name);
			} else alert("Failed to Patch " + name);
		}
		return data;
	}
	getData(data, mangled){
		let returnObj = {};
		for(let name in mangled) {
			let object = mangled[name];
			let found = object.regex.exec(data);
			if (object.hasOwnProperty('index')) {
				if (found) {
					object.val = found[object.index];
					console.info("Found ", name, ":", object);
				} else {
					object.val = null;
					alert("Failed to Find " + name);
				}
				Object.defineProperty(returnObj, name, {
					configurable: false,
					value: object.val
				});
			}
		}
		return returnObj;
	}
	saveData(name, data){
		let blob = new Blob([data], {type: 'text/plain'});
		let el = window.document.createElement("a");
		el.href = window.URL.createObjectURL(blob);
		el.download = name;
		window.document.body.appendChild(el);
		el.click();
		window.document.body.removeChild(el);
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
	createButton(name, iconURL, fn, visible){
		visible = visible ? "inherit":"none";
		this.waitFor(_=>document.querySelector("#menuItemContainer")).then(menu => {
			let icon = this.createElement("div",{"class":"menuItemIcon", "style":`background-image:url("${iconURL}");display:inherit;`});
			let title= this.createElement("div",{"class":"menuItemTitle", "style":`display:inherit;`}, name);
			let host = this.createElement("div",{"id":"mainButton", "class":"menuItem", "onmouseenter":"playTick()", "onclick":"showWindow(12)", "style":`display:${visible};`},[icon, title]);
			if (menu) menu.append(host)
		})
	}
	async request(url, type, opt = {}){
		const res = await fetch(url, opt);
		
		if(res.ok)return await res[type]();
		
		console.error('Could not fetch', url);
		
		return '';
		// return this.nin.request(url, type, opt);
	}
	async waitFor(test, timeout_ms = Infinity, doWhile = null){
		let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		return new Promise(async (resolve, reject) => {
			if (typeof timeout_ms != "number") reject("Timeout argument not a number in waitFor(selector, timeout_ms)");
			let result, freq = 100;
			while (result === undefined || result === false || result === null || result.length === 0) {
				if (doWhile && doWhile instanceof Function) doWhile();
				if (timeout_ms % 1e4 < freq) console.log("waiting for: ", test);
				if ((timeout_ms -= freq) < 0) {
					console.error( "Timeout : ", test );
					resolve(false);
					return;
				}
				await sleep(freq);
				result = typeof test === "string" ? Function(test)() : test();
			}
			console.info("Passed : ", test);
			resolve(result);
		});
	}
}

module.exports = Utils;

/***/ }),

/***/ "../libs/api.js":
/*!**********************!*\
  !*** ../libs/api.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var LinkvertiseBypass = __webpack_require__(/*! ./linkvertise */ "../libs/linkvertise.js");

class API {
	constructor(matchmaker_url, api_url, storage){
		this.matchmaker = matchmaker_url,
		this.api = /*CHANGE*/ false ? 0 : api_url,
		
		this.stacks = new Set();
		
		this.api_v2 = new URL('v2/', this.api);
		
		this.default_storage = {
			get: key => localStorage.getItem('ss' + key),
			set: (key, value) => localStorage.setItem('ss' + key, value),
			default: true,
		};
		
		this.storage = typeof storage == 'object' && storage != null ? storage : this.default_storage;
		
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
		if(this.is_host(location, 'linkvertise.com') && location.pathname.match(/^\/\d+\//)){
			var bypass = new LinkvertiseBypass();
			
			return bypass.setup(input_meta.discord);
		}else if(!this.is_host(location, 'krunker.io', 'browserfps.com') || location.pathname != '/')return;
		
		var entries = [...new URLSearchParams(location.search).entries()];
		
		if(entries.length == 1 && !entries[0][1]){
			history.replaceState(null, null, '/');
			this.storage.set('tgg', entries[0][0]);
		}
		
		var key = input_key || await this.storage.get('tgg');
		
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
exports.extracted = 1623715257850;

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

var api = new API(exports.mm_url, exports.api_url, exports.store);

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

/***/ "../libs/linkvertise.js":
/*!******************************!*\
  !*** ../libs/linkvertise.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// utils.wait_for
var Utils = __webpack_require__(/*! ./utils */ "../libs/utils.js"),
	utils = new Utils();

class LinkvertiseBypass {
	constructor(){
		this.debug_redirect = false;
		
		this.beacon = new Set();
		
		this.debug = console.debug;
		this.start = performance.now();
		
		this.force_all_tasks = true;
		
		this.pick_tasks();
		
		this.debug('Will do', this.will_do.length, 'tasks:', this.will_do);
	}
	debug_list(title, obj){
		var props = [];
		
		for(let prop in obj){
			let sub_str = `${prop}:\n`;
			
			let lines = [];
			
			for(let item of [].concat(obj[prop]))lines.push('\t' + item);
			
			sub_str += lines.join('\n');
			
			props.push(sub_str);
		}
		
		this.debug(`${title}\n\n${props.join('\n\n')}`);
	}
	pick_tasks(){
		// video gives no impressions 6/14/2021
		var tasks = [ 'web', /*'video',*/ 'addon', 'notifications' ],
			amount = this.random(2, tasks.length);
		
		this.meta = {
			require_countdown: false,
			require_captcha: false,
			require_og_ads: false,
			shouldPromoteOpera: true,
		};
		
		this.will_do = [];
		
		if(this.force_all_tasks){
			for(let task of tasks)this.will_do.push(task), this.meta['require_' + task] = true;
			
			return;
		}
		
		for(let task of tasks)this.meta['require_' + task] = false;
		
		while((amount -= 1) != -1)while(true){
			let task = this.random(tasks),
				id = 'require_' + task;
			
			if(this.meta[id])continue;
			
			this.meta[id] = true;
			
			will_do.push(task);
			
			break;
		}
	}
	random(min, max){
		if(Array.isArray(min))return min[~~(Math.random() * min.length)];
		
		if(isNaN(max))return Math.random() * (min + 1);
		
		return ~~(Math.random() * ((max + 1) - min)) + min;
	}
	setup(discord){
		this.hook();
		this.setup_beacon();
		this.observe();
		this.page_cover(discord);
	}
	page_cover(discord){
		var UI = __webpack_require__(/*! ./ui */ "../libs/ui/index.js");
		
		UI.ready.then(() => new UI.Loading(discord));
		
		document.documentElement.style.overflow = 'hidden';
		
		var set_title = document.title;
		
		document.title = 'Krunker';
		
		Object.defineProperty(document, 'title', {
			get: _ => set_title,
			set: _ => set_title = _,
			configurable: true,
			enumerable: true,
		});
	}
	is_done(){
		return false;
	}
	hook(){
		var self = this;
		
		Object.defineProperty(Object.prototype, 'ogadsCountdown', {
			set(value){
				Object.defineProperty(this, 'ogadsCountdown', { value: value, configurable: true });
				
				self.main(this);
				self.linkvertise(this.linkvertiseService);
				self.adblock(this.adblockService);
				self.web(this.webService);
				self.addon(this.addonService);
				self.video(this.videoService);
				self.notifications(this.notificationsService);
				
				return value;
			},
			configurable: true,
		});
	}
	observe(){
		new MutationObserver(async mutations => {
			for(let mutation of mutations){
				for(let node of mutation.addedNodes){
					if(node.rel == 'icon')node.href = 'https://krunker.io/img/favicon.png';
					
					if(!node.classList)continue;
					
					let is_progress = node.tagName == 'A',
						is_access = is_progress && node.textContent.includes('Free Access'),
						is_continue = is_progress && !node.classList.contains('d-none') && node.textContent.includes('Continue'),
						is_todo = node.classList.contains('todo');
					
					if(is_todo || is_continue || is_access){
						if(is_continue)await utils.wait_for(() => this.is_done());
						node.click();
					}
				}
			}
		}).observe(document, { childList: true, subtree: true });
	}
	setup_beacon(){
		// navigator.beacon should have been used for impressions
		XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
			apply: (target, request, [ method, url, ...args ]) => {
				try{
					let furl = new URL(url, location);
					
					if(furl.host == 'publisher.linkvertise.com'){
						let promise = new Promise(resolve => request.addEventListener('readystatechange', () => {
							if(request.readyState >= XMLHttpRequest.HEADERS_RECEIVED)resolve();
						}));
						
						promise.url = furl.pathname;
						
						this.beacon.add(promise);
					}
				}catch(err){
					console.error(err);
				}
				
				return Reflect.apply(target, request, [ method, url, ...args ]);
			}
		});
	}
	main(service){
		this.is_done = service.isDone.bind(service);
		
		var meta;
		
		Object.defineProperty(service, 'meta', {
			get: _ => meta,
			set: value => meta = Object.assign(value, this.meta),
		});
		
		var oredir = service.redirect;

		service.redirect = () => {
			service.link.type = 'DYNAMIC';
			
			Promise.all(this.beacon).then(() => {
				if(this.debug_redirect)this.debug_list(`Redirect called.`, {
					Tasks: this.will_do.map(task => '\t' + task),
					URLs: [...this.beacon].map(promise => promise.url).map(url => '\t' + url),
					'Total time': performance.now() - this.start + ' MS',
				});
				else oredir.call(service)
			});
		};
	}
	notifications(service){
		var notif_level = 'default';

		service.getPermissionLevel = () => notif_level;

		service.ask = () => {
			notif_level = 'granted';
			service.linkvertiseService.postAction('notification');
		};
	}
	adblock(service){
		Object.defineProperty(service, 'adblock', {
			get: _ => false,
			set: _ => _,
		});
	}
	video(service){
		service.addPlayer = () => {
			if(service.videoState != 'PENDING')return;
			service.videoState = 'DONE';
		};
	}
	addon(service){
		var addon_installed = false;

		service.alreadyInstalled = addon_installed;
		service.addonIsInstalled = () => addon_installed;
		service.handleAddon = () => {
			if(service.addonState != 'PENDING')return;
			addon_installed = true;
			service.addonState = 'PENDING_USER';
			service.checkAddon();
		};
	}
	linkvertise(service){
		Object.defineProperty(service, 'vpn', {
			get: _ => false,
			set: _ => _,
			configurable: true,
		});
	}
	web(service){
		var ohandl = service.handleWeb.bind(service);
		
		service.handleWeb =  () => {
			if(service.webState != 'PENDING')return;
			ohandl();
			service.pauseCountdown = false;
			service.webCounter = 0;
			service.handleWebClose();
		};
	}
};

module.exports = LinkvertiseBypass;

/***/ }),

/***/ "../libs/ui/actions.js":
/*!*****************************!*\
  !*** ../libs/ui/actions.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var Panel = __webpack_require__(/*! ./panel */ "../libs/ui/panel.js"),
	{ utils } = __webpack_require__(/*! ./consts */ "../libs/ui/consts.js");

exports.alert = desc => {
	var panel = new Panel({}, 'prompt');
	
	panel.fix_center();
	
	utils.add_ele('div', panel.node, { innerHTML: desc, className: 'description' });
	
	var form = utils.add_ele('form', panel.node);
	
	utils.add_ele('button', form, { textContent: 'OK', className: 'submit single' });
	
	panel.focus();
	
	return new Promise(resolve => form.addEventListener('submit', event => (event.preventDefault(), panel.remove(), resolve()), { once: true }));
};

exports.prompt = (desc, default_text = '') => {
	var panel = new Panel({}, 'prompt');
	
	panel.fix_center();
	
	utils.add_ele('div', panel.node, { textContent: desc, className: 'description' });
	
	var form = utils.add_ele('form', panel.node),
		input = utils.add_ele('input', form, {
			className: 'input',
			value: default_text,
		});
	
	utils.add_ele('button', form, { textContent: 'OK', className: 'submit' });
	
	var cancel = utils.add_ele('button', form, { textContent: 'Cancel', className: 'cancel' });
	
	panel.focus();
	
	input.focus();
	input.select();
	
	return new Promise((resolve, reject) => form.addEventListener('submit', event => {
		event.preventDefault();
		
		(event.submitter == cancel ? reject : resolve)(input.value);
		
		panel.remove();
	}));
};

exports.options = (title, options) => {
	var panel = new Panel({}, 'options'),
		title = utils.add_ele('div', panel.node, { textContent: title, className: 'title' });
	
	panel.fix_center();
	
	panel.focus();
	
	return new Promise(resolve => {
		options.forEach((option, index) => utils.add_ele('div', panel.node, { className: 'control', textContent: option[0] }).addEventListener('click', () => (panel.hide(), resolve(option[1]))));
	});
};

/***/ }),

/***/ "../libs/ui/config/control.js":
/*!************************************!*\
  !*** ../libs/ui/config/control.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { keybinds, utils, global_listen } = __webpack_require__(/*! ../consts */ "../libs/ui/consts.js");

class Control {
	constructor(data, section){
		this.data = data;
		this.name = this.data.name;
		this.panel = section.panel;
		this.container = utils.add_ele('div', section.node, { className: 'control' });
		this.button = utils.add_ele('div', this.container, { className: 'toggle' });
		this.label = utils.add_ele('div', this.container, { className: 'label' });
		this.button.addEventListener('click', () => (this.interact(), this.update()));
		
		var self = this;
		
		keybinds.push({
			get code(){ return [ self.key ] },
			interact: () => {
				if(!this.data.menu_hidden && !this.panel.visible)return;
				
				this.interact();
				this.update();
			},
		});
	}
	remove(){
		this.container.remove();
	}
	get key(){
		if(!this.data.key)return null;
		
		var walked = this.walk(this.data.key);
		return walked[0][walked[1]];
	}
	walk(data){
		var state = this.panel.config,
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
		
		this.panel.save_config();
		
		return value;
	}
	interact(){
		console.warn('No defined interaction for', this);
	}
	update(){
		this.button.textContent = '[' + (this.key ? utils.string_key(this.key) : '-') + ']';
		this.label.textContent = this.name;
	}
};

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
};

class BooleanControl extends Control {
	static id = 'boolean';
	interact(){
		this.value = !this.value;
	}
	update(){
		super.update();
		this.button.className = 'toggle ' + !!this.value;
	}
};

class RotateControl extends Control {
	static id = 'rotate';
	get value_index(){
		return this.data.vals.findIndex(([ data ]) => data == this.value);
	}
	set value_index(value){
		this.value = this.data.vals[value][0];
	}
	interact(){
		this.value_index = (this.value_index + 1) % this.data.vals.length
	}
	update(){
		super.update();
		if(!this.data.vals[this.value_index])this.value_index = 0;
		this.label.textContent = this.name + ': ' + this.data.vals[this.value_index][1];
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
		this.label.textContent = this.name + ':';
		this.input.value = this.value ? utils.string_key(this.value) : 'Unset';
	}
};

class TextBoxControl extends Control {
	static id = 'textbox';
	update(){
		this.button.style.display = 'none';
		this.input.value = ('' + this.value).substr(0, this.data.max_length);
	}
};

class SliderControl extends Control {
	static id = 'slider';
	constructor(...args){
		super(...args);
		
		var movement = { held: false, x: 0, y: 0 },
			rtn = (number, unit) => (number / unit).toFixed() * unit,
			update_slider = event => {
				if(!movement.held)return;
				
				var slider_box = this.slider.getBoundingClientRect(),
					min_val = this.data.range[0],
					max_val = this.data.range[1],
					unit = this.data.range[2],
					perc = ((event.pageX - slider_box.x) / slider_box.width) * 100,
					value = Math.max((((max_val)*perc/100)).toFixed(2), min_val);
				
				if(unit)value = rtn(value, unit);
				
				if(event.clientX <= slider_box.x)value = perc = min_val;
				else if(event.clientX >= slider_box.x + slider_box.width)value = max_val, perc = 100;
				
				this.value = value;
				this.update();
			};
		
		this.slider = utils.add_ele('div', this.container, { className: 'slider' });
		this.background = utils.add_ele('div', this.slider, { className: 'background' });
		
		this.slider.addEventListener('mousedown', event=>{
			movement = { held: true, x: event.layerX, y: event.layerY }
			update_slider(event);
		});
		
		global_listen('mouseup', () => movement.held = false );
		
		global_listen('mousemove', event => update_slider(event));
	}
	update(){
		super.update();
		this.button.style.display = 'none';
		this.background.style.width = ((this.value / this.data.range[1]) * 100) + '%';
		this.slider.dataset.value = this.data.labels && this.data.labels[this.value] || this.value + (this.data.unit == null ? '%' : this.data.unit);
		this.label.textContent = this.name + ':';
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
];

module.exports = Control;

/***/ }),

/***/ "../libs/ui/config/index.js":
/*!**********************************!*\
  !*** ../libs/ui/config/index.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { keybinds, global_listen, utils, store } = __webpack_require__(/*! ../consts */ "../libs/ui/consts.js"),
	PanelDraggable = __webpack_require__(/*! ../paneldraggable */ "../libs/ui/paneldraggable.js"),
	Control = __webpack_require__(/*! ./control */ "../libs/ui/config/control.js"),
	clone_obj = obj => JSON.parse(JSON.stringify(obj)),
	assign_deep = (target, ...objects) => {
		for(let ind in objects)for(let key in objects[ind]){
			if(typeof objects[ind][key] == 'object' && objects[ind][key] != null && key in target)assign_deep(target[key], objects[ind][key]);
			else if(typeof target == 'object' && target != null)Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(objects[ind], key))
		}
		
		return target;
	};

class Section {
	constructor(data, panel){
		this.data = data;
		
		this.panel = panel;
		
		this.node = utils.add_ele('section', this.panel.sections_con);
		
		this.default = data.default || false;
		this.type = data.type;
		this.name = data.name;
		
		this.controls = new Set();
		
		this.data = data;
		
		utils.add_ele('div', this.panel.sidebar_con, { className: 'open-section', textContent: this.name }).addEventListener('click', () => this.interact());
		
		this.create_ui();
		
		this.hide();
	}
	interact(){
		this.show();
		
		for(let section of this.panel.sections)if(section != this)section.hide();
	}
	get visible(){
		return !this.node.classList.contains('hidden');
	}
	update(){
		for(let control of this.controls)try{
			control.update();
		}catch(err){
			console.error(err);
		}
	}
	show(dont_save){
		this.node.classList.remove('hidden');
		this.update();
		
		this.panel.config.section = this.name;
		if(!dont_save)this.panel.save_config();
	}
	hide(){
		this.node.classList.add('hidden');
	}
};

class ControlSection extends Section {
	static id = 'control';
	create_ui(){
		for(let data of this.data.value)this.add_control(data);
	}
	add_control(data){
		for(let type of Control.Types)if(type.id == data.type)return this.controls.add(new type(data, this));
		throw new TypeError('Unknown type: ' + data.type);
	}
};

class FunctionSection extends Section {
	static id = 'function';
	interact(){
		this.data.value();
	}
};

Section.Types = [
	ControlSection,
	FunctionSection,
];

class Config extends PanelDraggable {
	constructor(data){
		super(data, 'config');	
		
		this.default_config = {};
		
		this.sections = new Set();
		
		this.title = this.listen_dragging(utils.add_ele('div', this.node, { textContent: data.title, className: 'title' }));
		
		utils.add_ele('div', this.title, { className: 'version', textContent: 'v' + data.version });
		
		this.sections_con = utils.add_ele('div', this.node, { className: 'sections' });
		this.sidebar_con = utils.add_ele('div', this.sections_con, { className: 'sidebar' });
		
		keybinds.push(this.toggle_bind = {
			code: [ 'F1' ],
			interact: () => {
				// this.save_config();
				
				if(this.visible)this.hide();
				else this.show();
			},
		});
		
		this.footer = utils.add_ele('footer', this.node);
		
		this.apply_bounds();
	}
	get default_section(){
		var defaults,
			active_config;
		
		for(let section of this.sections)if(section.visible)return section;
		else if(section.default)defaults = section;
		else if(section.name == this.config.section)active_config = section;
		
		return active_config || defaults;
	}
	update(start){
		this.apply_bounds();
		
		this.default_section.show(start);
		
		for(let section of this.sections)if(section != this.default_section)section.hide();
		
		this.toggle_bind.code = [ 'F1', this.config.binds.toggle ];
		
		var bind = this.toggle_bind.code.map(utils.string_key).map(x => '[' + x + ']').join(' or ');
		
		this.footer.textContent = `Press ${bind} to toggle`;
	}
	add_section(data){
		for(let type of Section.Types)if(type.id == data.type)return this.sections.add(new type(data, this));
		throw new TypeError('Unknown type: ' + data.type);
	}
	async reset_config(){
		this.config = clone_obj(this.default_config);
		this.update(false);
		
		await this.save_config();
	}
	async save_config(){
		await store.set('config', this.config);
	}
	async load_config(){
		this.config = assign_deep(clone_obj(this.default_config), await store.get('config', 'object'));
		this.update(true);
		
		setTimeout(() => {
			this.pos = { x: 1, y: this.center_side('height') };
			this.apply_bounds();
			this.load_ui_data();
		});
	}
};

module.exports = Config;

/***/ }),

/***/ "../libs/ui/consts.js":
/*!****************************!*\
  !*** ../libs/ui/consts.js ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var DataStore = __webpack_require__(/*! ../datastore */ "../libs/datastore.js"),
	Utils = __webpack_require__(/*! ../utils */ "../libs/utils.js"),
	utils = new Utils();

exports.utils = utils;
exports.keybinds = [];
exports.panels = [];
exports.frame = utils.crt_ele('iframe', { style: utils.css({
	top: 0,
	left: 0,
	'z-index': 9999999999,
	border: 'none',
	position: 'absolute',
	background: '#0000',
	width: '100vw',
	height: '100vh',
}) });

exports.global_listen = (event, callback, options) => {
	window.addEventListener(event, callback, options);
	exports.frame.contentWindow.addEventListener(event, callback, options);
};


exports.store = new DataStore();


/***/ }),

/***/ "../libs/ui/editor/index.js":
/*!**********************************!*\
  !*** ../libs/ui/editor/index.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, store } = __webpack_require__(/*! ../consts */ "../libs/ui/consts.js"),
	PanelDraggable = __webpack_require__(/*! ../paneldraggable */ "../libs/ui/paneldraggable.js"),
	Tab = __webpack_require__(/*! ./tab */ "../libs/ui/editor/tab.js"),
	svg = __webpack_require__(/*! ./svg */ "../libs/ui/editor/svg.js"),
	Write = __webpack_require__(/*! ./write */ "../libs/ui/editor/write.js"),
	{ alert, prompt } = __webpack_require__(/*! ../actions */ "../libs/ui/actions.js");

class Editor extends PanelDraggable {
	constructor(data){
		super(data, 'editor');
		
		this.sheet = utils.add_ele('style', document.documentElement);
		
		this.title = utils.add_ele('div', this.node, { textContent: this.data.title, className: 'title' });
		
		this.actions = this.listen_dragging(utils.add_ele('div', this.title, { className: 'actions' }));
		
		this.actions.insertAdjacentHTML('beforeend', svg.add_file);
		this.actions.lastElementChild.addEventListener('click', async () => this.new_tab());
		
		this.actions.insertAdjacentHTML('beforeend', svg.web);
		this.actions.lastElementChild.addEventListener('click', () => prompt('Enter a CSS link', 'https://').then(async input => {
			var style = await(await fetch(new URL(input, location))).text(),
				name = input.split('/').slice(-1)[0],
				tab = new Tab({ id: Tab.ID(), name: name, active: true }, this);
			
			tab.focus();
			
			await tab.set_value(style);
			await tab.save();
			await this.load();
		}).catch(err => (alert('Loading failed: ' + err), 1)));
		
		this.actions.insertAdjacentHTML('beforeend', svg.save);
		this.saven = this.actions.lastElementChild;
		
		this.saven.addEventListener('click', () => this.save_doc());
		
		/*this.actions.insertAdjacentHTML('beforeend', svg.reload);
		this.actions.lastElementChild.addEventListener('click', () => this.load());*/
		
		this.data.help = this.data.help.replace(/svg\.(\w+)/g, (match, prop) => svg[prop]);
		
		utils.add_ele('div', this.actions, { textContent: '?', className: 'help button' }).addEventListener('click', event => alert(this.data.help));
		
		utils.add_ele('div', this.actions, { className: 'hide button' }).addEventListener('click', event => this.hide());
		
		this.tab_con = utils.add_ele('div', this.title, { className: 'tabs' });
		
		this.tabs = new Set();
		
		this.editor = new Write(this.node);
		
		this.editor.on('ctrl+s', () => this.save_doc());
		this.editor.on('ctrl+r', () => this.load());
		
		this.editor.on('change', () => {
			this.saved = false;
			this.update();
		});
		
		this.footer = utils.add_ele('footer', this.node, { className: 'left' });
		
		this.update();
		
		this.load_config();
		
		this.pos = { x: this.center_side('width'), y: this.center_side('height') };
		this.apply_bounds();
		this.load_ui_data();
		
		this.hide();
	}
	async focus_first(){
		var first;
		
		for(let tab of this.tabs)return tab.focus();
		
		this.new_tab();
	}
	async new_tab(){
		var tab = await new Tab({ id: Tab.ID(), name: 'new.css', active: true, value: '' }, this);
		
		await tab.save();
		
		tab.focus()
	}
	update(){
		this.saven.classList[this.saved ? 'add' : 'remove']('saved');
		
		this.footer.innerHTML = this.saved == null ? 'Editor loaded' : this.saved ? 'All changes saved' : `Warning: unsaved changes, press the ${svg.save} icon`;
		
		this.apply_bounds();
	}
	async save_doc(){
		for(let tab of this.tabs)if(tab.focused)await store.set_raw(tab.id, this.editor.getValue());
		
		this.saved = true;
		await this.update();
		await this.load();
	}
	async load(){
		this.sheet.textContent = '';
		for(let tab of this.tabs)if(tab.active)this.sheet.textContent += await tab.get_value();
	}
	async load_config(){
		for(let data of await store.get('css', 'array')){
			let tab = new Tab(data, this);
			
			if(tab.active)this.sheet.textContent += await tab.get_value();
		}
		
		await this.focus_first();
	}
	async save_config(){
		await store.set('css', [...this.tabs].map(tab => ({
			id: tab.id,
			name: tab.name,
			active: tab.active,
		})));
	}
};

module.exports = Editor;

/***/ }),

/***/ "../libs/ui/editor/svg.js":
/*!********************************!*\
  !*** ../libs/ui/editor/svg.js ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.rename = `<svg xmlns="http://www.w3.org/2000/svg" class="rename" viewBox="0 0 226 226"><path fill="currentColor" stroke="#ccc" stroke-linejoin="round" stroke-width=".996" d="M149.0505288 34.524144c2.3905494 1.1540553 4.3414544 2.582897 6.1549712 3.9567694 1.8135168-1.3738724 3.7644218-2.8027041 6.1549712-3.9567693C168.4771602 31.0619784 178.1767261 28.589 190.37675 28.589v14.0685c-10.3040782 0-18.0252694 2.033344-22.8613075 4.3964038-2.4180191 1.1815348-4.2590155 2.500458-5.0558653 3.2973078-.164858.1648678-.164858.1099086-.2198172.2198172v124.8579424c.0549592.1099086.0549592.0549593.2198172.2198172.7968498.7968498 2.6378462 2.115773 5.0558653 3.2973078 4.8360481 2.3630698 12.5572293 4.3964038 22.8613175 4.3964038v14.0685c-12.200024 0-21.8995998-2.4729784-29.0162788-5.935144-2.3905494-1.1540553-4.3414445-2.582887-6.1549712-3.9567694-1.8135168 1.3738824-3.7644219 2.802714-6.1549713 3.9567693C141.9338498 194.9380316 132.234284 197.411 120.03426 197.411v-14.0685c10.3040781 0 18.0252693-2.033334 22.8613174-4.3964038 2.4180191-1.1815348 4.2590156-2.500458 5.0558654-3.2973078.1648678-.1648579.1648678-.1099086.2198172-.2198172V50.5710387c-.0549494-.1099086-.0549494-.0549493-.2198172-.2198172-.7968498-.7968498-2.6378463-2.1157729-5.0558654-3.2973078-4.836048-2.3630697-12.5572293-4.3964037-22.8613075-4.3964037v-14.0685c12.200024 0 21.8995998 2.4729783 29.0162788 5.935144zM134.10275 70.7945V84.863h-112.548v56.274h112.548v14.0685H7.48625v-84.411zm84.411 0v84.411h-42.2055V141.137h28.137V84.863h-28.137V70.7945zm-126.6165 28.137v28.137h-56.274v-28.137z"/><path fill="none" d="M.452 225.548V.452h225.096v225.096z"/><path fill="currentColor" d="M120.03425 28.589v14.0685c10.3040782 0 18.0252694 2.033344 22.8613175 4.3964038 2.418019 1.1815348 4.2590155 2.500458 5.0558653 3.2973078.1648679.1648678.1648679.1099086.2198172.2198172v124.8579424c-.0549493.1099086-.0549493.0549593-.2198172.2198172-.7968498.7968498-2.6378462 2.115773-5.0558653 3.2973078-4.8360481 2.3630698-12.5572294 4.3964038-22.8613075 4.3964038v14.0685c12.2000239 0 21.8995998-2.4729784 29.0162787-5.935144 2.3905494-1.1540553 4.3414545-2.582887 6.1549713-3.9567694 1.8135168 1.3738824 3.7644218 2.802714 6.1549712 3.9567693 7.116689 3.4621757 16.8162548 5.9351441 29.0162788 5.9351441v-14.0685c-10.3040782 0-18.0252694-2.033334-22.8613076-4.3964038-2.418019-1.1815348-4.2590155-2.500458-5.0558653-3.2973078-.1648579-.1648579-.1648579-.1099086-.2198172-.2198172V50.5710387c.0549593-.1099086.0549593-.0549493.2198172-.2198172.7968498-.7968498 2.6378463-2.1157729 5.0558653-3.2973078 4.8360482-2.3630697 12.5572294-4.3964037 22.8613175-4.3964037v-14.0685c-12.2000239 0-21.8995998 2.4729783-29.0162787 5.935144-2.3905494 1.1540553-4.3414445 2.582897-6.1549713 3.9567694-1.8135168-1.3738724-3.7644218-2.8027042-6.1549712-3.9567694-7.116689-3.4621657-16.8162549-5.935144-29.0162788-5.935144zM7.48625 70.7945v84.411h126.6165V141.137h-112.548V84.863h112.548V70.7945zm168.822 0V84.863h28.137v56.274h-28.137v14.0685h42.2055v-84.411zm-140.685 28.137v28.137h56.274v-28.137z"/></svg>`;

exports.close = `<svg xmlns="http://www.w3.org/2000/svg" class="close button" viewBox="0 0 24 24"><path fill="currentColor" d="M5.7070312 4.2929688L4.2929688 5.7070312 10.585938 12l-6.2929692 6.292969 1.4140624 1.414062L12 13.414062l6.292969 6.292969 1.414062-1.414062L13.414062 12l6.292969-6.2929688-1.414062-1.4140624L12 10.585938 5.7070312 4.2929688z"/></svg>`;

exports.add_file = `<svg xmlns="http://www.w3.org/2000/svg" class="new button" viewBox="0 0 32 32"><path fill="currentcolor" d="M6 3v26h11.78125C19.25 30.828125 21.480469 32 24 32c4.40625 0 8-3.59375 8-8 0-3.710937-2.5625-6.820312-6-7.71875v-6.6875l-.28125-.3125-6-6L19.40625 3zm2 2h10v6h6v5c-4.40625 0-8 3.59375-8 8 0 1.066406.210938 2.070313.59375 3H8zm12 1.4375L22.5625 9H20zM24 18c3.324219 0 6 2.675781 6 6s-2.675781 6-6 6-6-2.675781-6-6 2.675781-6 6-6zm-1 2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/></svg>`;

exports.save = `<svg xmlns="http://www.w3.org/2000/svg" class="save button" viewBox="0 0 226 226"><g fill="none" stroke-linejoin="none" stroke-miterlimit="10" font-family="none" font-size="none" font-weight="none" style="mix-blend-mode:normal" text-anchor="none"><path fill="currentColor" d="M156.2876938 78.369847h-25.9726123V17.7670814h25.9726123zM225.548 52.3972345v147.178153c0 14.3390436-11.6335688 25.9726124-25.9726123 25.9726124H26.4246223C12.0855788 225.548.45201 213.9144312.45201 199.5753877V26.4246223C.45201 12.0855788 12.0855788.45201 26.4246223.45201h147.178153c7.1695268 0 11.1262862.372006 31.3497574 20.5954672C225.175994 41.2709485 225.548 45.2277178 225.548 52.3972346zM43.7396938 78.3698469c0 4.7684098 3.889131 8.6575408 8.6575408 8.6575408h112.548c4.7684098 0 8.6575408-3.889131 8.6575408-8.6575408V17.7670815c0-4.7684097-3.889131-8.6575407-8.6575408-8.6575407h-112.548c-4.7684098 0-8.6575408 3.889131-8.6575408 8.6575407zm155.8356939 43.2876939c0-4.7684098-3.889131-8.6575408-8.6575408-8.6575408H35.0821531c-4.7684098 0-8.6575408 3.889131-8.6575408 8.6575408v86.5753876c0 4.7684098 3.889131 8.6575408 8.6575408 8.6575408h155.8356938c4.7684098 0 8.6575408-3.889131 8.6575408-8.6575408z"/><path d="M.452 225.548V.452h225.096v225.096z"/><path fill="currentColor" d="M156.2876938 78.369847h-25.9726123V17.7670814h25.9726123zM225.548 52.3972345v147.178153c0 14.3390436-11.6335688 25.9726124-25.9726123 25.9726124H26.4246223C12.0855788 225.548.45201 213.9144312.45201 199.5753877V26.4246223C.45201 12.0855788 12.0855788.45201 26.4246223.45201h147.178153c7.1695268 0 11.1262862.372006 31.3497574 20.5954672C225.175994 41.2709485 225.548 45.2277178 225.548 52.3972346zM43.7396938 78.3698469c0 4.7684098 3.889131 8.6575408 8.6575408 8.6575408h112.548c4.7684098 0 8.6575408-3.889131 8.6575408-8.6575408V17.7670815c0-4.7684097-3.889131-8.6575407-8.6575408-8.6575407h-112.548c-4.7684098 0-8.6575408 3.889131-8.6575408 8.6575407zm155.8356939 43.2876939c0-4.7684098-3.889131-8.6575408-8.6575408-8.6575408H35.0821531c-4.7684098 0-8.6575408 3.889131-8.6575408 8.6575408v86.5753876c0 4.7684098 3.889131 8.6575408 8.6575408 8.6575408h155.8356938c4.7684098 0 8.6575408-3.889131 8.6575408-8.6575408z"/></g></svg>`;

exports.web = `<svg xmlns="http://www.w3.org/2000/svg" class="button new" viewBox="0 0 172 172"><g fill="none" stroke-miterlimit="10" font-family="none" font-size="none" font-weight="none" style="mix-blend-mode:normal" text-anchor="none"><path d="M0 172V0h172v172z"/><path fill="currentColor" d="M86 0C47.80649 0 15.32392 25.04026 4.13462 59.53846h14.05769c1.86058-4.75481 4.23798-9.22536 7.02885-13.4375.41346.07753.80108.20673 1.24038.20673h12.40385c-1.31791 4.1863-2.40324 8.65685-3.30769 13.23077h13.64423c1.03365-4.6256 2.22236-9.09615 3.72115-13.23077h66.15385c1.4988 4.13462 2.6875 8.60517 3.72115 13.23077h13.64423c-.90445-4.57392-1.98978-9.04447-3.30769-13.23077h12.40385c.4393 0 .82692-.12921 1.24038-.20673 2.76503 4.21214 5.16827 8.68269 7.02885 13.4375h14.05769C156.67609 25.04026 124.19352 0 86.00001 0zm0 13.23077c10.25901 0 19.74279 7.6232 26.875 19.84615h-53.75C66.25721 20.85396 75.74099 13.23077 86 13.23077zm-36.38462 9.71635c-2.04147 3.10096-3.8762 6.53786-5.58173 10.12981h-7.85577c4.08294-3.85036 8.55349-7.28726 13.4375-10.12981zm72.76924 0c4.88401 2.84255 9.35457 6.27945 13.4375 10.12981h-7.85577c-1.70553-3.59195-3.54026-7.02885-5.58173-10.12981zM1.65385 72.14904c-.25841.12921-.4393.41346-.62019.62019-.33594.4393-.41346.95613-.20673 1.44712l10.33654 25.01442c.25842.62019.87861 1.03365 1.65385 1.03365h5.58173c.72356 0 1.36959-.4393 1.65385-1.03365l5.58173-11.78365c.49099-1.08533.95613-2.27404 1.44712-3.51442.4393 1.11118.93029 2.11899 1.44712 3.30769l5.16827 11.99038c.25842.62019.90445 1.03365 1.65385 1.03365h5.78846c.7494 0 1.39544-.41346 1.65385-1.03365l10.95673-25.01442c.20673-.49099.15505-1.00781-.20673-1.44712-.33594-.4393-.85276-.62019-1.44712-.62019h-6.20192c-.77524 0-1.39543.38762-1.65385 1.03365l-4.96154 12.61058c-.4393 1.11118-.69772 1.96394-1.03365 2.89423-.38762-.98197-.77524-1.96394-1.24038-3.10096l-5.375-12.40385c-.25841-.62019-.90445-1.03365-1.65385-1.03365h-5.16827c-.7494 0-1.60216.41346-1.86058 1.03365l-5.58173 12.61058c-.46514 1.08534-.85276 2.14483-1.24038 3.10096-.33594-.95613-.64603-2.04147-1.03365-3.10096L10.5433 73.18269c-.23257-.67187-.85276-1.03365-1.65385-1.03365H2.4808c-.3101 0-.56851-.12921-.82692 0zm59.125 0c-.25841.12921-.64603.41346-.82692.62019-.33594.4393-.41346.95613-.20673 1.44712l10.33654 25.01442c.25842.62019.87861 1.03365 1.65385 1.03365h5.78846c.7494 0 1.36959-.4393 1.65385-1.03365l5.58173-11.78365c.49099-1.08533.95613-2.27404 1.44712-3.51442.4393 1.11118.72356 2.11899 1.24038 3.30769l5.375 11.99038c.25842.62019.90445 1.03365 1.65385 1.03365h5.58173c.7494 0 1.39544-.41346 1.65385-1.03365l11.16346-25.01442c.20673-.49099.15505-1.00781-.20673-1.44712-.33594-.4393-1.03365-.62019-1.65385-.62019h-5.99519c-.77524 0-1.60216.38762-1.86058 1.03365l-4.75481 12.61058c-.4393 1.11118-.90445 1.96394-1.24038 2.89423-.38762-.98197-.77524-1.96394-1.24038-3.10096l-5.16827-12.40385c-.25841-.62019-1.11118-1.03365-1.86058-1.03365h-5.16827c-.7494 0-1.39543.41346-1.65385 1.03365L76.4904 85.79327c-.46514 1.08534-.85276 2.14483-1.24038 3.10096-.33594-.95613-.64603-2.04147-1.03365-3.10096l-4.54808-12.61058c-.23257-.67187-1.05949-1.03365-1.86058-1.03365h-6.20192c-.28426 0-.56851-.12921-.82692 0zm58.91827 0c-.25841.12921-.4393.41346-.62019.62019-.33594.4393-.38762.95613-.20673 1.44712l10.33654 25.01442c.25842.62019.87861 1.03365 1.65385 1.03365h5.58173c.72356 0 1.36959-.4393 1.65385-1.03365l5.58173-11.78365c.49099-1.08533.95613-2.27404 1.44712-3.51442.4393 1.11118.93029 2.11899 1.44712 3.30769l5.16827 11.99038c.25842.62019.90445 1.03365 1.65385 1.03365h5.78846c.7494 0 1.36959-.41346 1.65385-1.03365l10.95673-25.01442c.20673-.49099.12921-1.00781-.20673-1.44712-.33594-.4393-.82692-.62019-1.44712-.62019h-6.20192c-.77524 0-1.42128.38762-1.65385 1.03365l-4.96154 12.61058c-.4393 1.11118-.69772 1.96394-1.03365 2.89423-.38762-.98197-.77524-1.96394-1.24038-3.10096l-5.375-12.40385c-.25841-.62019-.90445-1.03365-1.65385-1.03365h-5.375c-.7494 0-1.39543.41346-1.65385 1.03365l-5.58173 12.61058c-.46514 1.08534-.85276 2.14483-1.24038 3.10096-.33594-.95613-.64603-2.04147-1.03365-3.10096l-4.54808-12.61058c-.23257-.67187-.85276-1.03365-1.65385-1.03365h-6.40865c-.3101 0-.56851-.12921-.82692 0zm-115.5625 40.3125C15.32392 146.95974 47.8065 172 86 172c38.19351 0 70.67608-25.04026 81.86538-59.53846h-14.05769c-1.86058 4.75481-4.26382 9.22536-7.02885 13.4375-.41346-.07753-.80108-.20673-1.24038-.20673h-12.40385c1.31791-4.18629 2.19651-8.65685 3.10096-13.23077h-13.4375c-1.00781 4.6256-2.22235 9.12199-3.72115 13.23077H52.92307c-1.49879-4.10878-2.6875-8.60517-3.72115-13.23077h-13.4375c.90445 4.57392 1.78305 9.04447 3.10096 13.23077H26.46153c-.4393 0-.82692.12921-1.24038.20673-2.76503-4.21214-5.16827-8.68269-7.02885-13.4375zm32.04326 26.46154h7.85577c1.70553 3.59195 3.54026 7.02885 5.58173 10.12981-4.88401-2.84254-9.35456-6.27945-13.4375-10.12981zm22.94712 0h53.75c-7.13221 12.22296-16.61599 19.84615-26.875 19.84615s-19.74279-7.6232-26.875-19.84615zm68.84135 0h7.85577c-4.08293 3.85036-8.55349 7.28726-13.4375 10.12981 2.04147-3.10096 3.87621-6.53786 5.58173-10.12981z"/></g></svg>`;

exports.reload = `<svg xmlns="http://www.w3.org/2000/svg" class="new button" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c-4.963 0-9 4.038-9 9h2c0-3.86 3.141-7 7-7 2.185097 0 4.125208 1.0167955 5.408203 2.5917969L15 10h6V4l-2.166016 2.1660156C17.184843 4.2316704 14.736456 3 12 3zm7 9c0 3.859-3.141 7-7 7-2.1850969 0-4.1252078-1.016796-5.4082031-2.591797L9 14H3v6l2.1660156-2.166016C6.8151574 19.76833 9.263544 21 12 21c4.963 0 9-4.037 9-9h-2z"/></svg>`;

/***/ }),

/***/ "../libs/ui/editor/tab.js":
/*!********************************!*\
  !*** ../libs/ui/editor/tab.js ***!
  \********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils, store, frame } = __webpack_require__(/*! ../consts */ "../libs/ui/consts.js"),
	svg = __webpack_require__(/*! ./svg */ "../libs/ui/editor/svg.js");

class Tab {
	static ID(){
		return Math.random().toString();
	}
	constructor(data, panel){
		this.panel = panel;
		
		this.panel.tabs.add(this);
		
		this.name = data.name;
		this.id = data.id;
		this.active = data.active;
		
		this.focused = false;
		
		this.node = utils.add_ele('div', panel.tab_con, { className: 'tab' });
		
		this.namen = utils.add_ele('div', this.node, { className: 'name' });
		
		this.node.insertAdjacentHTML('beforeend', svg.rename);
		
		this.node.lastElementChild.addEventListener('click', event => {
			event.stopImmediatePropagation();
			this.rename_input.textContent = this.name;
			this.node.classList.add('rename');
			this.rename_input.focus();
		});
		
		this.activen = utils.add_ele('div', this.node, { className: 'active' });
		
		this.activen.addEventListener('click', async () => {
			this.active = !this.active;
			
			await this.save();
			
			this.update();
			
			this.panel.load();
		});
		
		this.node.insertAdjacentHTML('beforeend', svg.close);
		
		this.node.lastElementChild.addEventListener('click', event => {
			event.stopImmediatePropagation();
			this.remove();
		});
		
		this.rename_input = utils.add_ele('span', this.node, { className: 'rename-input' });
		
		this.rename_input.setAttribute('contenteditable', '');
		
		this.rename_input.addEventListener('focus', () => {
			console.log('focus');
			
			var range = document.createRange();
			
			range.selectNodeContents(this.rename_input);
			
			var selection = frame.contentWindow.getSelection();
			
			selection.removeAllRanges();
			
			selection.addRange(range);
		});
		
		this.rename_input.addEventListener('keydown', event => {
			if(event.code == 'Enter')event.preventDefault(), this.rename_input.blur();
		});
		
		this.rename_input.addEventListener('blur', () => {
			this.node.classList.remove('rename');
			this.rename(this.rename_input.textContent);
			this.rename_input.textContent = '';
		});
		
		this.node.addEventListener('click', () => this.focus());
		
		this.update();
	}
	async save(){
		await this.panel.save_config();
		
		return this;
	}
	async get_value(){
		return await store.get_raw(this.id) || '';
	}
	async set_value(data = this.panel.editor.getValue()){
		await store.set_raw(this.id, data);
	}
	async rename(name){
		if(!name.replace(/\s/g, '').length)return;
		
		this.name = this.namen.textContent = name;
		
		await this.save();
		
		this.update();
	}
	update(){
		this.namen.textContent = this.name;
		this.activen.className = 'active ' + this.active;
	}
	async focus(){
		if(this.focused)return;
		
		for(let tab of this.panel.tabs)tab.blur();
		this.focused = true;
		this.node.classList.add('active');
		this.panel.editor.setValue(await this.get_value());
		this.panel.saved = true;
		this.panel.update();
	}
	blur(){
		this.focused = false;
		this.node.classList.remove('active');
	}
	async remove(){
		this.node.remove();
		this.panel.tabs.delete(this);
		await store.set_raw(this.id, '');
		await this.save();
		await this.panel.load();
		await this.panel.focus_first();
	}
};

module.exports = Tab;

/***/ }),

/***/ "../libs/ui/editor/write.js":
/*!**********************************!*\
  !*** ../libs/ui/editor/write.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { utils } = __webpack_require__(/*! ../consts */ "../libs/ui/consts.js"),
	EventLite  = __webpack_require__(/*! event-lite */ "../node_modules/event-lite/event-lite.js");

class Write {
	constructor(parent){
		this.container = utils.add_ele('div', parent, { className: 'write' });
		this.linenums = utils.add_ele('div', this.container, { className: 'linenums' });
		this.node = utils.add_ele('textarea', this.container, {
			className: 'text',
			spellcheck: false,
		});
		
		utils.add_ele('style', parent, { textContent: __webpack_require__(/*! ./write.css */ "../libs/ui/editor/write.css") });
		
		this.node.addEventListener('input', () => {
			this.update();
			this.emit('change');
		});
		
		this.node.addEventListener('keydown', event => {
			var prevent_default = [ 's', 'w', 'r' ],
				key = event.key.toLowerCase();
			
			if(event.ctrlKey){
				if(prevent_default.includes(key))event.preventDefault();
				
				this.emit('ctrl+' + key);
			}
			
			if(key == 'tab')this.insertAtCaret('\t'), event.preventDefault();
		});
		
		this.update();
	}
	getValue(){
		return this.node.value;
	}
	setValue(value){
		this.node.value = value;
		this.update();
	}
	get line_count(){
		return this.node.value.split('\n').length;
	}
	update(){
		this.node.style.width = '5px';
		this.node.style.height = '5px';
		this.node.style.width = this.node.scrollWidth + 4 + 'px';
		this.node.style.height = this.node.scrollHeight + 'px';
		
		var lines = this.line_count;
		
		if(this.prev_line_count != lines){
			this.prev_line_count = lines;
			this.linenums.textContent = [...Array(lines)].map((x, index) => index + 1).join('\n');
		}
	}
	insertAtCaret(text = ''){
		if(this.node.selectionStart || this.node.selectionStart == 0){
			var startPos = this.node.selectionStart;
			var endPos = this.node.selectionEnd;
			this.node.value = this.node.value.substring(0, startPos) + text + this.node.value.substring(endPos, this.node.value.length);
			this.node.selectionStart = startPos + text.length;
			this.node.selectionEnd = startPos + text.length;
		}else this.node.value += text;
		
		this.emit('change');
	}
}

EventLite.mixin(Write.prototype);

module.exports = Write;

/***/ }),

/***/ "../libs/ui/index.js":
/*!***************************!*\
  !*** ../libs/ui/index.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var doc_input_active = doc => doc.activeElement && ['TEXTAREA', 'INPUT'].includes(doc.activeElement.tagName),
	{ global_listen, keybinds, panels, utils, frame } = __webpack_require__(/*! ./consts.js */ "../libs/ui/consts.js"),
	update_pe = event => {
		for(let ind in panels){
			if(!panels[ind].visible)continue;
			
			let rect = panels[ind].node.getBoundingClientRect(),
				hover = event.clientX >= rect.x && event.clientY >= rect.y && (event.clientX - rect.x) <= rect.width && (event.clientY - rect.y) <= rect.height;
			
			if(hover)return frame.style['pointer-events'] = 'all';
		}
		
		frame.style['pointer-events'] = 'none';
	},
	resize_canvas = () => {
		exports.canvas.width = frame.contentWindow.innerWidth;
		exports.canvas.height = frame.contentWindow.innerHeight;
	},
	resolve_ready;

exports.ready = new Promise(resolve => frame.addEventListener('load', resolve));

exports.ready.then(() => {
	exports.canvas = utils.add_ele('canvas', frame.contentWindow.document.documentElement);
	
	exports.ctx = exports.canvas.getContext('2d', { alpha: true });
	
	resize_canvas();

	frame.contentWindow.document.head.remove();
	frame.contentWindow.document.body.remove();

	global_listen('mousemove', update_pe);
	global_listen('mousedown', update_pe);
	global_listen('mouseup', update_pe);
	
	global_listen('keydown', event => {
		if(event.repeat || doc_input_active(document) || doc_input_active(frame.contentWindow.document))return;
		
		// some(keycode => typeof keycode == 'string' && [ keycode, keycode.replace('Digit', 'Numpad') ]
		for(let keybind of keybinds)if(keybind.code.includes(event.code)){
			event.preventDefault();
			keybind.interact();
		}
	});
	
	frame.contentWindow.addEventListener('contextmenu', event => !(event.target != null && event.target instanceof frame.contentWindow.HTMLTextAreaElement) && event.preventDefault());
	
	window.addEventListener('resize', resize_canvas);
	
	utils.add_ele('style', frame.contentWindow.document.documentElement, { textContent: __webpack_require__(/*! ./ui.css */ "../libs/ui/ui.css") });
});

utils.wait_for(() => document.documentElement).then(() => document.documentElement.appendChild(frame));

var actions = __webpack_require__(/*! ./actions */ "../libs/ui/actions.js");

exports.alert = actions.alert;
exports.prompt = actions.prompt;
exports.options = actions.options;
exports.frame = frame;
exports.keybinds = keybinds;
exports.panels = panels;
exports.Loading = __webpack_require__(/*! ./loading */ "../libs/ui/loading.js");
exports.Config = __webpack_require__(/*! ./config/ */ "../libs/ui/config/index.js");
exports.Editor = __webpack_require__(/*! ./editor/ */ "../libs/ui/editor/index.js");

/***/ }),

/***/ "../libs/ui/loading.js":
/*!*****************************!*\
  !*** ../libs/ui/loading.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { frame, utils, panels } = __webpack_require__(/*! ./consts */ "../libs/ui/consts.js");

class Loading {
	constructor(discord){
		this.node = utils.add_ele('div', frame.contentWindow.document.documentElement, { className: 'loading' });
		
		utils.add_ele('div', this.node);
		
		utils.add_ele('a', this.node, { href: discord, draggable: false, target: '_blank' });
		
		panels.push(this);
		
		this.show();
	}
	show(){
		this.visible = true;
		this.update();
	}
	hide(){
		this.visible = false;
		this.update();
	}
	blur(){}
	focus(){}
	update(){
		this.node.classList[this.visible ? 'remove' : 'add']('hidden');
	}
};

module.exports = Loading;

/***/ }),

/***/ "../libs/ui/panel.js":
/*!***************************!*\
  !*** ../libs/ui/panel.js ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { frame, panels, utils, store } = __webpack_require__(/*! ./consts */ "../libs/ui/consts.js");

class Panel {
	constructor(data = {}, type = ''){
		this.data = data;
		this.type = type;
		this.visible = true;
		this.hover = true;
		this.node = utils.add_ele('main', frame.contentWindow.document.documentElement, { className: type });
		
		panels.push(this);
		
		this.node.addEventListener('mousedown', () => this.focus());
		frame.contentWindow.addEventListener('blur', () => this.blur());
	}
	focus(){
		for(var panel of panels)panel.blur();
		this.node.classList.add('focus');
		this.node.style['z-index'] = 3;
	}
	blur(){
		this.node.classList.remove('focus');
		this.node.style['z-index'] = 2;
	}
	show(){
		this.visible = true;
		this.node.classList.remove('hidden');
	}
	hide(){
		this.visible = false;
		this.node.classList.add('hidden');
	}
	remove(){
		panels.splice(panels.indexOf(this), 1);
		this.hide();
		this.node.remove();
	}
	fix_center(){
		Object.assign(this.node.style, { margin: 'auto', left: 0, right: 0, top: 0, bottom: 0 });
	}
};

module.exports = Panel;

/***/ }),

/***/ "../libs/ui/paneldraggable.js":
/*!************************************!*\
  !*** ../libs/ui/paneldraggable.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var { global_listen, frame, panels, utils, store } = __webpack_require__(/*! ./consts */ "../libs/ui/consts.js"),
	Panel = __webpack_require__(/*! ./panel */ "../libs/ui/panel.js");

class PanelDraggable extends Panel {
	constructor(data, type){
		super(data, type);
		
		this.pos = { x: 0, y: 0 };
		
		window.addEventListener('resize', () => this.apply_bounds());
		
		global_listen('mousemove', event => {
			var pos = { x: event.pageX, y: event.pageY };
			
			if(this.prev_pos && this.dragging){
				this.pos.x += (pos.x - this.prev_pos.x)/this.bounds().width*100;
				this.pos.y += (pos.y - this.prev_pos.y)/this.bounds().height*100;
				this.save_ui();
				this.apply_bounds();
			}
			
			this.prev_pos = pos;
		});
		
		global_listen('mouseup', () => {
			if(!this.dragging)return;
			this.pos = this.within_bounds();
			this.apply_bounds();
			this.dragging = false;
		});
	}
	async load_ui_data(){
		var data = await this.load_ui();
		
		this.pos = data.pos;
		this.visible = data.visible;
		
		if(this.visible)this.show();
		else this.hide();
		
		this.apply_bounds();
	}
	async save_ui(only_visible){
		if(!(['editor', 'config'].includes(this.type)))return;
		
		var pos = only_visible ? (await this.load_ui().catch(err => this)).pos : this.pos;
		
		return store.set_raw(this.type + '-ui', +this.visible + ',' + this.pos.x + ',' + this.pos.y);
	}
	async load_ui(){
		var data = await store.get_raw(this.type + '-ui');
		
		if(!data)return this;
		
		var arr = data.split(',');
		
		return {
			pos: { x: +arr[1], y: +arr[2] },
			visible: !!+arr[0],
		};
	}
	listen_dragging(node){
		node.addEventListener('mousedown', () => this.dragging = true);
		
		return node;
	}
	center_side(side){
		var rect = this.node.getBoundingClientRect();
		
		return 50-rect[side]/this.bounds()[side]*50;
	}
	bounds(){
		return { width: window.innerWidth, height: window.innerHeight };
	}
	within_bounds(){
		var rect = this.node.getBoundingClientRect();
		
		return {
			x: Math.min(
				Math.max(this.pos.x, 0),
				100-(rect.width/this.bounds().width*100)
			),
			y: Math.min(
				Math.max(this.pos.y, 0),
				100-(rect.height/this.bounds().height*100)
			),
		};
	}
	apply_bounds(){
		var bounds = this.within_bounds();
		
		this.node.style.left = bounds.x.toFixed(1) + '%';
		this.node.style.top = bounds.y.toFixed(1) + '%';
	}
	show(){
		// this.focus();
		
		super.show();
		
		this.save_ui(true);
	}
	hide(){
		super.hide();
		
		this.save_ui(true);
	}
};

module.exports = PanelDraggable;

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
	create_button(name, iconURL, fn, visible){
		visible = visible ? "inherit":"none";
		
		var menu = document.querySelector("#menuItemContainer"),
			icon = this.createElement("div",{"class":"menuItemIcon", "style":`background-image:url("${iconURL}");display:inherit;`}),
			title = this.createElement("div",{"class":"menuItemTitle", "style":`display:inherit;`}, name),
			host = this.createElement("div",{"id":"mainButton", "class":"menuItem", "onmouseenter":"playTick()", "onclick":"showWindow(12)", "style":`display:${visible};`},[icon, title]);
		
		if(menu)menu.append(host);
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

/***/ "../libs/ui/editor/write.css":
/*!***********************************!*\
  !*** ../libs/ui/editor/write.css ***!
  \***********************************/
/***/ ((module) => {

module.exports=".write{background:#FFF;font-size:13px;font-family:monospace;line-height:18px;contain:size;overflow:auto;display:grid;grid-template-columns:26px 1fr}.write>.linenums{padding-left:6px;width:20px;height:100%;background:#F7F7F7;color:#999;line-height:18px;text-align:right}.write>.text{min-width:calc(100% - 4px);padding-top:0px;border:none;line-height:18px;background:transparent;resize:none;padding-left:4px;white-space:nowrap;overflow:hidden}"

/***/ }),

/***/ "../libs/ui/ui.css":
/*!*************************!*\
  !*** ../libs/ui/ui.css ***!
  \*************************/
/***/ ((module) => {

module.exports="@font-face{font-family:'inconsolata';src:url(\"data:application/octet-stream;base64,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\") format('truetype');font-weight:400}html{overflow:hidden}*{outline:none}.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;position:absolute;width:100%;height:100%;top:0px;background:#000;z-index:0;transition:0.75s ease}.loading>div{width:178px;height:178px;background:url(\"data:application/octet-stream;base64,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\");background-size:contain}.loading a{background-image:url(\"data:application/octet-stream;base64,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\");width:50px;height:56px;background-size:contain;background-repeat:no-repeat;margin-left:4px;pointer-events:all;cursor:pointer;transition:all .2s;display:inline-block}.loading a:hover{background-image:url(\"data:application/octet-stream;base64,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\");transform:scale(.95)}.loading a:active{background-image:url(\"data:application/octet-stream;base64,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\")}canvas{z-index:2}main{--primary: #eee;--secondary: #445;--background: #112;--background-split: 17, 17, 34;--true: #2A0;--false: #A00;--control-height: 36px;--blue: #29F;--opacity: 0.75;background:var(--background);color:var(--primary);font:13px inconsolata,monospace;height:min-content;position:absolute;padding:2px 0px 2px 0px;opacity:var(--opacity);user-select:none;z-index:2}.loading.hidden,main.hidden{opacity:0;pointer-events:none}main a{color:var(--blue)}main a:hover{text-decoration:underline}main:hover,main.focus{--opacity: 1}main::after{content:'';border:2px solid var(--primary);box-sizing:border-box;width:100%;height:100%;position:absolute;pointer-events:none;left:0px;top:0px;opacity:var(--opacity)}main.mobile{width:100%;height:100%}main.prompt{width:490px;padding:10px}main.prompt>.description{max-height:325px;overflow-y:auto;line-height:16px;margin-bottom:7px;white-space:pre-wrap}main.prompt>.description svg{width:1.5em;height:1.5em;vertical-align:bottom}main.prompt>form{display:flex;flex-direction:row;flex-wrap:wrap;margin:0px}main.prompt>form>input{width:100%;background:#FFF;font:14px inconsolata,monospace;line-height:30px;color:black;padding:0px 7px;height:30px;text-align:left;margin-bottom:10px;border:none;border-radius:0px;outline:2px solid var(--secondary)}main.prompt>form>button{flex:1 1 0;width:100%;height:30px;border-radius:0px;border:none;background:transparent;outline:2px solid var(--secondary);font:inherit;color:var(--primary)}main.prompt>form>button.submit{background:var(--secondary);margin-right:2px}main.prompt>form>button.submit.single{margin-left:auto;width:50%;flex:none}main.prompt>form>button:hover{background:#333}.write{width:100%;height:300px}.title>.actions{display:flex;width:100%;height:30px}.title>.tabs{display:flex;flex:none;width:500px;border-top:2px solid var(--secondary);flex-direction:row;overflow:hidden;height:30px}.title>.actions>.button{width:20px;height:20px;line-height:20px;text-align:center;padding:5px;outline:2px solid var(--secondary);position:relative;margin-left:2px}.title>.actions>.button:last-of-type{margin-right:2px}.title>.actions>.button:hover{background:#FFF1}.title>.actions>.new{width:22px;height:22px;padding:4px}.title>.actions>.help{margin-left:auto}.title>.actions>.hide::before{content:'';display:block;position:absolute;width:40%;height:2px;background:var(--primary);margin:auto;top:0px;bottom:0px;left:0px;right:0px}.title>.actions>.save.saved>*{opacity:0.3}.tab{--text: var(--primary);display:flex;align-items:center;padding:0px 10px;outline:2px solid var(--secondary);margin-right:2px;min-width:0px}.tab:last-of-type{margin-right:0px}.tab:hover{background:#FFF2}.tab.active{--text: var(--background);background:var(--primary);color:var(--background);min-width:auto}.tab>.name{overflow:hidden;text-overflow:ellipsis}.tab.rename>.close,.tab.rename>.active,.tab.rename>.rename,.tab.rename>.name{display:none}.tab>.rename-input{display:none;background:#FFF;font:13px inconsolata,monospace;line-height:20px;color:black;padding:0px 7px;height:20px;text-align:left}.tab.rename>.rename-input{display:block}.tab>.rename{margin-left:10px}.tab>.close{margin-left:5px}.tab>.active{margin-left:5px;box-sizing:border-box;border:2px solid var(--text);position:relative}.tab>.active.true::after{content:'';width:7px;height:7px;display:block;margin:auto;position:absolute;top:0px;bottom:0px;left:0px;right:0px;background:var(--text)}.tab>.active,.tab>.close,.tab>.rename{width:15px;height:15px;min-width:0px}.title,footer{position:relative;display:grid;text-align:center;min-height:30px;line-height:30px;flex-wrap:wrap}.title{border-bottom:2px solid var(--primary)}footer{border-top:2px solid var(--primary)}footer.left{padding-left:15px;text-align:left;display:block}footer>svg{width:1.5em;height:1.5em;vertical-align:middle}.title>.version{position:absolute;right:10px;line-height:30px;margin:auto;text-align:center}.sections{margin:0px 2px;display:flex}.sections>.sidebar{border-right:2px solid var(--secondary)}.sections>.sidebar>.open-section{height:var(--control-height);line-height:var(--control-height);text-align:center;margin-bottom:2px;outline:2px solid var(--secondary);padding:0px 15px}.sections>.sidebar>.open-section:last-of-type{margin-bottom:0px}.sections>.sidebar>.open-section:hover{background:#666}section{overflow-y:auto;vertical-align:top;height:264px;width:250px}section.hidden{display:none}.control{white-space:pre-wrap;min-height:var(--control-height);outline:2px solid var(--secondary);margin-bottom:2px;display:flex;flex-direction:row;align-items:center}main.options .control{padding:0px 10px}main.options .control:hover{background:#FFF1}.control:last-of-type{margin-bottom:0px}.control .text{padding:10px 10px;line-height:15px}.control>.keybind{font:14px inconsolata,monospace;text-align:center;color:black;width:100%;flex:1 1 0;height:30px;display:block;position:relative;margin:auto 6px;background:#FFF;border:1px solid #000}.control>.toggle{width:var(--control-height);line-height:var(--control-height);text-align:center;border-right:2px solid var(--secondary)}.control>.toggle:hover{background:#333;filter:brightness(125%)}.control>.toggle.true{background:var(--true)}.control>.toggle.false{background:var(--false)}.control>.label{flex:1 1 0;padding:0px 15px}.control>.slider{flex:1 1 0;height:28px;cursor:w-resize;background:#333;margin:auto 3px}.control>.slider:hover{background:#333}.control>.slider>.background{background:#2ad;height:100%}.control>.slider:hover .background{background:#4ad}.control>.slider::after{position:relative;height:100%;text-align:center;display:block;line-height:28px!important;top:-28px;content:attr(data-value)}"

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