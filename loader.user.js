// ==UserScript==
// @name           The Gaming Guru's™ Krunker Cheat Loader
// @description    This allows easier loading of our custom scripts
// @homepage       https://forum.sys32.dev/
// @supportURL     https://y9x.github.io/discord/
// @icon           https://y9x.github.io/webpack/libs/gg.gif
// @version        1
// @match          *://krunker.io/*
// @match          *://*.browserfps.com/*
// @run-at         document-start
// @noframes
// ==/UserScript==

(()=>{'use strict';var e={653:e=>{var t=e=>'object'==typeof e&&null!=e,r=e=>'string'==typeof e||e instanceof Location||e instanceof URL,i=e=>{if(t(e)){if(e instanceof Headers){let t={};for(let[r,i]of e)t[r]=i;return t}return e}return{}},s=e=>{if(!t(e))throw new TypeError('Input must be an object');var r={cache:'no-cache',headers:i(e.headers)},a=s.resolve(e);switch(e.cache){case!0:r.cache='force-cache';break;case'query':a.search+='?'+Date.now()}1==e.cache&&(r.cache='force-cache'),t(e.data)&&(r.method='POST',r.body=JSON.stringify(e.data),r.headers['content-type']='application/json'),'string'==typeof e.method&&(r.method=e.method),e.sync&&(r.xhr=!0,r.synchronous=!0);var n=['text','json','arrayBuffer'].includes(e.result)?e.result:'text';return(r.xhr?s.fetch_xhr:s.fetch)(a,r).then((e=>e[n]()))};s.fetch=window.fetch.bind(window),s.fetch_xhr=(e,t={})=>{if(!r(e))throw new TypeError('url param is not resolvable');e=new URL(e,location).href;var i='string'==typeof t.method?t.method:'GET',s=new XMLHttpRequest;return s.open(i,e,!t.synchronous),new Promise(((e,r)=>{s.addEventListener('load',(()=>e({text:async()=>s.responseText,json:async()=>JSON.parse(s.responseText),headers:new Headers}))),s.addEventListener('error',(e=>r(e.error))),s.send(t.body)}))},s.resolve=e=>{if(!r(e.target))throw new TypeError('Target must be specified');var t=new URL(e.target);return r(e.endpoint)&&(t=new URL(e.endpoint,t)),'object'==typeof e.query&&null!=e.query&&(t.search='?'+new URLSearchParams(Object.entries(e.query))),t},e.exports=s},619:(e,t,r)=>{var i=r(864);class s{constructor(){this.children=[]}appendChild(e){this.children.push(e)}append(){}append_into(e){for(let t of this.children)e.append(t)}}e.exports=class{constructor(e,t,r,i){this.FakeNode=s,this.canvas=e,this.three=t,this.game=r,this.world=i,this.pi2=2*Math.PI,this.halfpi=Math.PI/2,this.mobile_uas=['android','webos','iphone','ipad','ipod','blackberry','iemobile','opera mini']}get mobile(){if('object'==typeof navigator&&null!=navigator)for(let e of this.mobile_uas)if(navigator.userAgent.includes(e))return!0;return!1}dist_center(e){return Math.hypot(window.innerWidth/2-e.x,window.innerHeight/2-e.y)}is_host(e,...t){return t.some((t=>e.hostname==t||e.hostname.endsWith('.'+t)))}normal_radian(e){return(e%=this.pi2)<0&&(e+=this.pi2),e}distanceTo(e,t){return Math.hypot(e.x-t.x,e.y-t.y,e.z-t.z)}applyMatrix4(e,t){var r=e.x,i=e.y,s=e.z,a=t.elements,n=1/(a[3]*r+a[7]*i+a[11]*s+a[15]);return e.x=(a[0]*r+a[4]*i+a[8]*s+a[12])*n,e.y=(a[1]*r+a[5]*i+a[9]*s+a[13])*n,e.z=(a[2]*r+a[6]*i+a[10]*s+a[14])*n,e}project3d(e,t){return this.applyMatrix4(this.applyMatrix4(e,t.matrixWorldInverse),t.projectionMatrix)}update_frustum(){this.world.frustum.setFromProjectionMatrix((new this.three.Matrix4).multiplyMatrices(this.world.camera.projectionMatrix,this.world.camera.matrixWorldInverse))}update_camera(){this.world.camera.updateMatrix(),this.world.camera.updateMatrixWorld()}pos2d(e,t=0){return isNaN(e.x)||isNaN(e.y)||isNaN(e.z)?{x:0,y:0}:((e={x:e.x,y:e.y,z:e.z}).y+=t,this.update_camera(),this.project3d(e,this.world.camera),{x:(e.x+1)/2*this.canvas.width,y:(1-e.y)/2*this.canvas.height})}obstructing(e,t,r,i=0){var s=this.getD3D(e.x,e.y,e.z,t.x,t.y,t.z),a=this.getDir(e.z,e.x,t.z,t.x),n=this.getDir(this.getDistance(e.x,e.z,t.x,t.z),t.y,0,e.y),o=1/(s*Math.sin(a-Math.PI)*Math.cos(n)),h=1/(s*Math.cos(a-Math.PI)*Math.cos(n)),c=1/(s*Math.sin(n)),l=e.y+(e.height||0)-1.15;for(let t of this.game.map.manager.objects)if(!t.noShoot&&t.active&&(!r||!t.penetrable)){var d=this.lineInRect(e.x,e.z,l,o,h,c,t.x-Math.max(0,t.width-i),t.z-Math.max(0,t.length-i),t.y-Math.max(0,t.height-i),t.x+Math.max(0,t.width-i),t.z+Math.max(0,t.length-i),t.y+Math.max(0,t.height-i));if(d&&1>d)return d}if(this.game.map.terrain){var u=this.game.map.terrain.raycast(e.x,-e.z,l,1/o,-1/h,1/c);if(u)return this.getD3D(e.x,e.y,e.z,u.x,u.z,-u.y)}}getDistance(e,t,r,i){return Math.sqrt((r-=e)*r+(i-=t)*i)}getD3D(e,t,r,i,s,a){var n=e-i,o=t-s,h=r-a;return Math.sqrt(n*n+o*o+h*h)}getXDire(e,t,r,i,s,a){return Math.asin(Math.abs(t-s)/this.getD3D(e,t,r,i,s,a))*(t>s?-1:1)}getDir(e,t,r,i){return Math.atan2(t-i,e-r)}lineInRect(e,t,r,i,s,a,n,o,h,c,l,d){var u=(n-e)*i,p=(c-e)*i,w=(h-r)*a,m=(d-r)*a,v=(o-t)*s,g=(l-t)*s,f=Math.max(Math.max(Math.min(u,p),Math.min(w,m)),Math.min(v,g)),y=Math.min(Math.min(Math.max(u,p),Math.max(w,m)),Math.max(v,g));return!(y<0||f>y)&&f}getAngleDst(e,t){return Math.atan2(Math.sin(t-e),Math.cos(e-t))}box_size(e,t){var r=this.world.camera.fov*Math.PI/180;Math.tan(r/2),this.world.camera.position.z,this.canvas.width,this.canvas.height;return{width,height}}contains_point(e){for(var t=0;t<6;t++)if(this.world.frustum.planes[t].distanceToPoint(e)<0)return!1;return!0}camera_world(){var e=this.world.camera.matrixWorld.clone(),t=this.world.camera[i.getWorldPosition]();return this.world.camera.matrixWorld.copy(e),this.world.camera.matrixWorldInverse.copy(e).invert(),t.clone()}request_frame(e){requestAnimationFrame(e)}round(e,t){return Math.round(e*Math.pow(10,t))/Math.pow(10,t)}add_ele(e,t,r={}){var i=this.crt_ele(e,r);if('function'==typeof t)this.wait_for(t).then((e=>e.appendChild(i)));else{if('object'!=typeof t||null==t||!t.appendChild)throw new Error('Parent is not resolvable to a DOM element');t.appendChild(i)}return i}crt_ele(e,t={}){var r,i={};for(let e in t)'object'==typeof t[e]&&null!=t[e]&&(i[e]=t[e],delete t[e]);r='raw'==e?this.crt_ele('div',{innerHTML:t.html}).firstChild:'text'==e?document.createTextNode(''):document.createElement(e);var s=t.className;s&&(delete t.className,r.setAttribute('class',s));var a=i.events;if(a){delete i.events;for(let e in a)r.addEventListener(e,a[e])}Object.assign(r,t);for(let e in i)Object.assign(r[e],i[e]);return r}wait_for(e,t){return new Promise((r=>{var i,s=()=>{try{var t=e();if(t)return i&&clearInterval(i),r(t),!0}catch(e){console.log(e)}};i=s()||setInterval(s,t||50)}))}css(e){var t=[];for(var r in e)t.push(r+':'+e[r]+';');return t.join('\n')}sanitize(e){var t=document.createElement('div');return t.textContent=e,t.innerHTML}unsanitize(e){var t=document.createElement('div');return t.innerHTML=e,t.textContent}node_tree(e,t=document){var r={parent:t},i=/^\$\s+>?/g,s=/^\^\s+>?/g;for(var a in e){var n=e[a];if(n instanceof Node)r[a]=n;else if('object'==typeof n)r[a]=this.node_tree(n,r.container);else if(i.test(e[a])){if(!r.container){console.warn('No container is available, could not access',n);continue}r[a]=r.container.querySelector(e[a].replace(i,''))}else if(s.test(e[a])){if(!r.parent){console.warn('No parent is available, could not access',n);continue}r[a]=r.parent.querySelector(e[a].replace(s,''))}else r[a]=t.querySelector(e[a]);r[a]||console.warn('No node found, could not access',n)}return r}string_key(e){return e.replace(/^([A-Z][a-z]+?)([A-Z0-9][a-z]*?)/,((e,t,r)=>['Digit','Key'].includes(t)?r:`${r} ${t}`))}clone_obj(e){return JSON.parse(JSON.stringify(e))}assign_deep(e,...t){for(let r in t)for(let i in t[r])'object'==typeof t[r][i]&&null!=t[r][i]&&i in e?this.assign_deep(e[i],t[r][i]):'object'==typeof e&&null!=e&&Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(t[r],i));return e}filter_deep(e,t){for(let r in e)r in t||delete e[r],'object'==typeof t[r]&&null!=t[r]&&this.filter_deep(e[r],t[r]);return e}redirect(e,t,r){var i=Symbol();r.addEventListener(e,(e=>{e[i]})),t.addEventListener(e,(t=>r.dispatchEvent(Object.assign(new t.constructor(e,t),{[i]:!0,stopImmediatePropagation:t.stopImmediatePropagation.bind(t),preventDefault:t.preventDefault.bind(t)}))))}promise(){var e,t,r=new Promise(((r,i)=>{e=r,t=i}));return r.resolve=e,r.reject=t,r.resolve_in=(e=0,t)=>setTimeout((()=>r.resolve(t)),e),r}rtn(e,t){return(e/t).toFixed()*t}}},864:(e,t)=>{var r=new Map,i=new Map,s=(e,t,i)=>r.set(e,[t,i]),a=(e,t,r)=>i.set(e,[t,r]),n='_'+Math.random().toString().substr(2);s('build',/\.exports='(\w{5})'/,1),s('inView',/&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/,1),s('spectating',/team:window\.(\w+)/,1),s('nAuto',/'Single Fire',varN:'(\w+)'/,1),s('xDire',/this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/,1),s('yDire',/this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/,1),s('procInputs',/this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/,1),s('isYou',/this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/,1),s('pchObjc',/0,this\.(\w+)=new \w+\.Object3D,this/,1),s('aimVal',/this\.(\w+)-=1\/\(this\.weapon\.aimSpd/,1),s('crouchVal',/this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/,1),s('didShoot',/--,\w+\.(\w+)=!0/,1),s('ammos',/length;for\(\w+=0;\w+<\w+\.(\w+)\.length/,1),s('weaponIndex',/\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/,1),s('maxHealth',/\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/,1),s('yVel',/\w+\.(\w+)&&\(\w+\.y\+=\w+\.\1\*/,1),s('mouseDownR',/this\.(\w+)=0,this\.keys=/,1),s('recoilAnimY',/\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/,1),s('objInstances',/lowerBody\),\w+\|\|\w+\.(\w+)\./,1),s('getWorldPosition',/var \w+=\w+\.camera\.(\w+)\(\);/,1),a('Skins',/((?:[a-zA-Z]+(?:\.|(?=\.skins)))+)\.skins(?!=)/g,((e,t)=>`${n}.skins(${t})`)),a('Nametags',/&&((\w+)\.\w+Seen)(?=\){if\(\(\w+=\2\.objInstances)/,((e,t)=>`&& ${n}.can_see(${t})`)),a('Game',/(\w+)\.moveObj=func/,((e,t)=>`${n}.game(${t}),${e}`)),a('World',/(\w+)\.backgroundScene=/,((e,t)=>`${n}.world(${t}),${e}`)),a('Input',/((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/,((e,t,r,i,s)=>`${t}${n}.input(${i})${s}`)),a('Timer',/(\w+\.exports)\.(kickTimer)=([\dex]+)/,((e,t,r,i)=>`${n}.timer(${t},"${r}",${i})`)),a('ThreeJS',/\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/,((e,t)=>`${e}${n}.three(${t});`)),t.patch=e=>{var s={},a={};for(var[n,[o,h]]of r){var c=(e.match(o)||0)[h];c?t[n]=s[n]=c:a[n]=[o,h]}for(var[n,[l,d]]of(console.log('Found:'),console.table(s),console.log('Missing:'),console.table(a),i))e.match(l)||console.error('Could not patch',n),e=e.replace(l,d);return e},t.key=n,t.keys={frame:0,delta:1,xdir:2,ydir:3,move_dir:4,shoot:5,scope:6,jump:7,reload:8,crouch:9,weapon_scroll:10,weapon_swap:11,move_lock:12,speed_limit:13,reset:14,interact:15},t.consts={twoPI:2*Math.PI,halfPI:Math.PI/2,playerHeight:11,cameraHeight:1.5,headScale:2,armScale:1.3,armInset:.1,chestWidth:2.6,hitBoxPad:1,crouchDst:3,recoilMlt:.3,nameOffset:.6,nameOffsetHat:.8},t.load=e=>{e(s,a,t.key)}},871:e=>{e.exports={name:'The Gaming Guru\'s™ Krunker Cheat Loader',description:'This allows easier loading of our custom scripts',homepage:'https://forum.sys32.dev/',supportURL:'https://y9x.github.io/discord',icon:'https://y9x.github.io/webpack/libs/gg.gif',version:1.1}}},t={};function r(i){var s=t[i];if(void 0!==s)return s.exports;var a=t[i]={exports:{}};return e[i](a,a.exports,r),a.exports}(()=>{var e=r(653),t=r(871),i=new(r(619));class s{constructor(e,t,r){this.name=t,this.data=r,this.controls=e,this.content=i.crt_ele('div',{className:'setBodH'}),this.sub=i.add_ele('div',this.content,{className:'settName'}),this.label=i.add_ele('text',this.sub,{nodeValue:this.name}),this.select=i.add_ele('select',this.sub,{className:'inputGrey2',events:{change:()=>this.change()}});for(let e in this.data.value)i.add_ele('option',this.select,{value:e,textContent:e});this.init=!0,this.value=this.data.value,this.init=!1,this.controls.list.push(this)}get value(){return this.data.value[this.select.value]}set value(e){for(let t in this.data.value)this.data.value[t]==e&&(this.select.value=t);return this.select.value=e,this.change(),e}change(){'function'==typeof this.data.change&&this.data.change(this.init,this.value,(e=>this.select.value=e))}}class a{constructor(){var e=this.list=[];this.id='a-'+Math.random().toString().slice(2),customElements.define(this.id,class extends HTMLElement{connectedCallback(){this.replaceWith(e[this.id].content)}})}html(){var e='';for(let t in this.list)e+=`<${this.id} id="${t}"></${this.id}>`;return e}}new class{type='Userscript';version=t.version;og_loaders={doge:'Dogeware',skid:'SkidFest',shit:'Sploit',sploit:'Sploit',junk:'Junker'};constructor(e,t=!1){this.url=e,this.logs=t,this.active=null,this.controls=new a,i.wait_for((()=>'object'==typeof windows&&windows)).then((e=>{var t=e[0],r=t.tabs.length,i=t.getSettings;t.tabs.push({name:'Cheats',categories:[]}),t.getSettings=()=>t.tabIndex==r?this.controls.html():i.call(t)}))}log(...e){this.logs&&console.log('[LOADER]',...e)}warn(...e){this.logs&&console.warn('[LOADER]',...e)}get script(){if(!this.active)return tnull;if(!this.serve.scripts[this.active])throw new Error(`'${this.active}' is invalid`);return this.serve.scripts[this.active]}save(){return localStorage.setItem('scriptinfo',this.active?JSON.stringify({name:this.active,data:this.script}):''),this}pick(e){this.active=e,this.save(),location.assign('/')}async load(){if(this.log('Loading...'),this.serve=await e({target:this.url,result:'json',cache:'query',sync:!0}),t.version!=this.serve.loader.version)return this.warn('The loader is outdated!'),location.assign(this.serve.loader.url+'?'+this.serve.loader.version);var{name:r,data:i}=JSON.parse(localStorage.getItem('scriptinfo')||'[]'),a=localStorage.getItem('userScripts');a&&!r&&(r=this.og_loaders[a]),this.active=r;var n={None:null};for(let e in this.serve.scripts)n[e]=e;new s(this.controls,'Script',{value:n,change:(e,t,r)=>{e?r(this.active||'None'):this.pick(t)}});if(!this.active)return this.log('No script active, skipping loading...');var o=!1,h=null;try{this.script}catch(e){return this.log('Invalid script selected, returning...')}JSON.stringify(i)!=JSON.stringify(this.script)?(this.warn('Script data changed, cache invalidated.'),o=!0):(h=sessionStorage.getItem(this.script.url))?this.log('Loading cache...'):(this.warn('No script in sessionStorage, cache invalidated.'),o=!0),o&&(this.save(),this.log('Requesting new script...'),sessionStorage.setItem(this.script.url,h=await e({target:this.script.url+'?'+this.serve.loader.version,sync:!0,result:'text'}))),new Function('LOADER',h)(this)}}("https://y9x.github.io/userscripts/serve.json",!0).load()})()})();