// ==UserScript==
// @name         Kyro Cheat Loader
// @namespace    https://akiooware.tk
// @icon         https://media.discordapp.net/attachments/941454328101761084/999405899108061204/nigga.gif
// @license      gpl-3.0
// @version      1.24
// @match        https://krunker.io/*
// @match        https://*.browserfps.com/*
// @run-at       document-start
// @noframes
// ==/UserScript==

(()=>{'use strict';var e,t,s,i,n,a={122:e=>{class t{static original=Symbol();static events=new WeakMap;static resolve(e){t.events.has(this)||t.events.set(this,new Map);var s=t.events.get(this),i=s.get(e);return i||(i=new Set,s.set(e,i)),i}on(e,s){if('function'!=typeof s)throw new TypeError('Callback is not a function.');return t.resolve.call(this,e).add(s),this}once(e,s){var i=function(...t){this.off(e,s),s.call(this,...t)};return s[t.original]=i,this.on(e,i)}off(e,s){if('function'!=typeof s)throw new TypeError('Callback is not a function.');return s[t.original]&&(s=s[t.original]),t.resolve.call(this,e).delete(s)}emit(e,...s){var i=t.resolve.call(this,e);if(!i.size){if('error'==e)throw s[0];return!1}for(let e of i)try{e.call(this,...s)}catch(e){this.emit('error',e)}return!0}}e.exports=t},420:(e,t,s)=>{var i=s(263),n=s(122),a=s(254),r=s(154),o=s(77);e.exports=class extends n{html=new a;async save_config(){o.error('save_config() not implemented')}async load_config(){o.error('load_config() not implemented')}tab={content:this.html,window:{menu:this}};async insert(e){var t=(await i.wait_for((()=>'object'==typeof windows&&windows)))[0],s={},n=t.getSettings;for(let i in t.tabs)s[i]=t.tabs[i].length,t.tabs[i].push({name:e,categories:[]});t.getSettings=()=>t.tabIndex==s[t.settingType]?this.html.get():n.call(t)}categories=new Set;category(e){var t=new r(this.tab,e);return this.categories.add(t),t}update(e=!1){for(let t of this.categories)t.update(e)}constructor(){super()}}},254:e=>{e.exports=class{children=[];appendChild(e){return this.append(e),e}append(e){this.children.push(e)}constructor(){this.id='a-'+Math.random().toString().slice(2);var e=this.children;customElements.define(this.id,class extends HTMLElement{connectedCallback(){for(let t of e)this.parentNode.insertBefore(t,this);this.remove()}})}get(){return`<${this.id}></${this.id}>`}}},492:e=>{class t{static keybinds=new Set;constructor(e,s){this.keys=new Set,this.callbacks=new Set,t.keybinds.add(this),'string'==typeof e&&(this.key(e),e=s),'function'==typeof e&&this.callback(s)}delete(){t.keybinds.delete(this)}set_key(...e){return this.keys=new Set,this.key(...e)}set_callback(...e){return this.callbacks=new Set,this.key(...e)}key(...e){for(let t of e)this.keys.add(t);return this}callback(...e){for(let t of e)this.callbacks.add(t);return this}}window.addEventListener('keydown',(e=>{if(!e.repeat){for(let t of[...e.composedPath()])if(t.tagName)for(let e of['INPUT','TEXTAREA'])if(t.tagName.includes(e))return;for(let s of t.keybinds)if(!e.repeat&&s.keys.has(e.code)){e.preventDefault();for(let t of s.callbacks)t(e)}}})),e.exports=t},969:(e,t,s)=>{var i=s(263),n=s(122),a=s(77);class r extends n{constructor(e,t,s){super(),this.data=t,this.name=e,this.category=s,this.menu=this.category.tab.window.menu,this.content=i.add_ele('div',this.category.content,{className:'settName'}),this.label=i.add_ele('text',this.content),this.create(),this.menu.emit('control',this)}label_text(e){this.label.nodeValue=e}remove(){this.content.remove()}walk(e){var t,s,i=this.menu.config;for(let n of e.split('.'))i=(t=i)[s=n]||{};return[t,s]}get value(){if('function'==typeof this.data.value)return this.data.value;var e=this.walk(this.data.walk);return e[0][e[1]]}set value(e){var t=this.walk(this.data.walk);return t[0][t[1]]=e,this.menu.save_config(),this.emit('change',e),e}create(){}interact(){a.warn('No defined interaction for',this)}update(e){e&&this.emit('change',this.value,!0),this.label_text(this.name)}show_content(){this.content.style.display='block'}hide_content(){this.content.style.display='none'}}class o extends r{static id='link';create(){this.link=i.add_ele('a',this.content,{href:this.value}),this.link.append(this.label)}interact(){this.link.click()}}r.Types={KeybindControl:class extends r{static id='keybind';create(){this.input=i.add_ele('input',this.content,{className:'inputGrey2',placeholder:'Press a key',style:{display:'inline-block',width:'220px'}}),this.input.addEventListener('focus',(()=>{this.input.value=''})),this.input.addEventListener('keydown',(e=>{e.preventDefault(),this.value='Escape'==e.code?null:e.code,this.input.blur()})),this.input.addEventListener('blur',(()=>{this.category.update(),this.update()}))}update(e){super.update(e),this.input.value=i.string_key(this.value)}},SelectControl:class extends r{static id='select';create(){this.select=i.add_ele('select',this.content,{className:'inputGrey2'}),this.select.addEventListener('change',(()=>this.value=this.select.value));for(let e in this.data.value)i.add_ele('option',this.select,{value:e,textContent:this.data.value[e]})}update(e){super.update(e),e&&(this.select.value=this.value)}},DropdownControl:class extends r{static id='dropdown';create(){this.select=i.add_ele('select',this.content,{className:'inputGrey2'}),this.select.addEventListener('change',(()=>{this.key=this.select.value,this.value=this.data.value[this.select.value]}));for(let e in this.data.value)i.add_ele('option',this.select,{textContent:e,value:e})}update(e){if(super.update(e),e)for(let[e,t]of Object.entries(this.data.value))t==this.value&&(this.select.value=e,this.key=e)}},BooleanControl:class extends r{static id='boolean';create(){this.switch=i.add_ele('label',this.content,{className:'switch',textContent:'Run',style:{'margin-left':'10px'}}),this.input=i.add_ele('input',this.switch,{type:'checkbox'}),this.input.addEventListener('change',(()=>this.value=this.input.checked)),i.add_ele('span',this.switch,{className:'slider'})}update(e){super.update(e),e&&(this.input.checked=this.value),this.label_text(this.name)}},FunctionControl:class extends r{static id='function';create(){i.add_ele('div',this.content,{className:'settingsBtn',textContent:this.data.text||'Run',events:{click:()=>this.interact()}})}interact(){this.value()}},LinkControl:o,TextBoxControl:class extends r{static id='textbox';create(){this.input=i.add_ele('input',this.content,{className:'inputGrey2',placeholder:this.data.placeholder||'',style:{display:'inline-block',width:'220px'}}),this.input.addEventListener('change',(()=>this.value=this.input.value))}update(e){super.update(e),e&&(this.input.value=this.value)}},SliderControl:class extends r{static id='slider';create(){var e={min:this.data.min,max:this.data.max,step:this.data.step};this.input=i.add_ele('input',this.content,{className:'sliderVal',type:'number',...e}),this.slider=i.add_ele('input',i.add_ele('div',this.content,{className:'slidecontainer',style:{'margin-top':'-8px'}}),{className:'sliderM',type:'range',...e}),this.input.addEventListener('focus',(()=>(this.input_focused=!0,this.interact()))),this.input.addEventListener('blur',(()=>(this.input_focused=!1,this.interact()))),this.slider.addEventListener('input',(()=>this.interact(this.value=this.slider.value))),this.input.addEventListener('input',(()=>this.interact(this.value=+this.input.value)))}interact(){var e=!this.input_focused&&this.data.labels&&this.data.labels[this.value]||this.value;this.input.type='string'==typeof e?'text':'number',this.input.value=e,this.slider.value=this.value}update(e){super.update(e),this.interact()}},ColorControl:class extends r{static id='color';create(){this.input=i.add_ele('input',this.content,{name:'color',type:'color',style:{float:'right'}}),this.input.addEventListener('change',(()=>this.value=this.input.value))}update(e){super.update(e),e&&(this.input.value=this.value)}},LinkControl:o,LinkFunctionControl:class extends r{static id='linkfunction';create(){this.link=i.add_ele('a',this.content,{href:'#',events:{click:()=>this.interact()}}),this.link.append(this.label)}interact(){this.value()}}},e.exports=r},154:(e,t,s)=>{var i=s(263),n=s(969);e.exports=class{constructor(e,t){this.tab=e,this.controls=new Set,t&&(this.label=t,this.header=i.add_ele('div',this.tab.content,{className:'setHed'}),this.header_status=i.add_ele('span',this.header,{className:'material-icons plusOrMinus'}),i.add_ele('text',this.header,{nodeValue:t}),this.header.addEventListener('click',(()=>this.toggle()))),this.content=i.add_ele('div',this.tab.content,{className:'setBodH'}),t&&this.expand()}toggle(){this.collapsed?this.expand():this.collapse()}collapse(){this.collapsed=!0,this.update()}expand(){this.collapsed=!1,this.update()}update(e){this.content.style.display=this.collapsed?'none':'block',this.header&&(this.header.style.display='block',this.header_status.textContent='keyboard_arrow_'+(this.collapsed?'right':'down'));for(let t of this.controls)t.update(e)}show(){this.expand(),this.header&&(this.header.style.display='block')}hide(){this.content.style.display='none',this.header&&(this.header.style.display='none')}fix(){this.update();for(let e of this.controls)e.show_content()}control(e,t){for(let[s,i]of Object.entries(n.Types))if(i.id==t.type){let s=new i(e,t,this);return this.controls.add(s),s}throw new TypeError('Unknown type: '+t.type)}}},144:e=>{var t=e=>'object'==typeof e&&null!=e,s=e=>'string'==typeof e||e instanceof Location||e instanceof URL,i=e=>{if(t(e)){if(e instanceof Headers){let t={};for(let[s,i]of e)t[s]=i;return t}return e}return{}},n=e=>{if(!t(e))throw new TypeError('Input must be an object');var s={cache:'no-cache',headers:i(e.headers)},a=n.resolve(e);switch(e.cache){case!0:s.cache='force-cache';break;case'query':a.search+='?'+Date.now()}1==e.cache&&(s.cache='force-cache'),t(e.data)&&(s.method='POST',s.body=JSON.stringify(e.data),s.headers['content-type']='application/json'),'string'==typeof e.method&&(s.method=e.method),e.sync&&(s.xhr=!0,s.synchronous=!0);var r=['text','json','arrayBuffer'].includes(e.result)?e.result:'text';return(s.xhr?n.fetch_xhr:window.fetch.bind(window))(a,s).then((e=>e[r]()))};n.fetch_xhr=(e,t={})=>{if(!s(e))throw new TypeError('url param is not resolvable');e=new URL(e,location).href;var i='string'==typeof t.method?t.method:'GET',n=new XMLHttpRequest;return n.open(i,e,!t.synchronous),new Promise(((e,s)=>{n.addEventListener('load',(()=>e({text:async()=>n.responseText,json:async()=>JSON.parse(n.responseText),headers:new Headers}))),n.addEventListener('error',(e=>s(e.error))),n.send(t.body)}))},n.resolve=e=>{if(!s(e.target))throw new TypeError('Target must be specified');var t=new URL(e.target);return s(e.endpoint)&&(t=new URL(e.endpoint,t)),'object'==typeof e.query&&null!=e.query&&(t.search='?'+new URLSearchParams(Object.entries(e.query))),t},e.exports=n},263:(e,t,s)=>{var i=s(77);e.exports=class{static is_host(e,...t){return t.some((t=>e.hostname==t||e.hostname.endsWith('.'+t)))}static round(e,t){return Math.round(e*Math.pow(10,t))/Math.pow(10,t)}static add_ele(e,t,s={}){var i=this.crt_ele(e,s);if('function'==typeof t)this.wait_for(t).then((e=>e.append(i)));else{if('object'!=typeof t||null==t||!t.append)throw new Error('Parent is not resolvable to a DOM element');t.append(i)}return i}static crt_ele(e,t={}){var s,i={};for(let e in t)'object'==typeof t[e]&&null!=t[e]&&(i[e]=t[e],delete t[e]);s='raw'==e?this.crt_ele('div',{innerHTML:t.html}).firstChild:'text'==e?document.createTextNode(''):document.createElement(e);var n=t.className;n&&(delete t.className,s.setAttribute('class',n));var a=i.events;if(a){delete i.events;for(let e in a)s.addEventListener(e,a[e])}Object.assign(s,t);for(let e in i)Object.assign(s[e],i[e]);return s}static wait_for(e,t){return new Promise((s=>{var n,a=()=>{try{var t=e();if(t)return n&&clearInterval(n),s(t),!0}catch(e){i.log(e)}};n=a()||setInterval(a,t||50)}))}static sanitize(e){var t=document.createElement('div');return t.textContent=e,t.innerHTML}static unsanitize(e){var t=document.createElement('div');return t.innerHTML=e,t.textContent}static node_tree(e,t=document){var s={parent:t},n=/^\$\s+>?/g,a=/^\^\s+>?/g;for(var r in e){var o=e[r];if(o instanceof Node)s[r]=o;else if('object'==typeof o)s[r]=this.node_tree(o,s.container);else if(n.test(e[r])){if(!s.container){i.warn('No container is available, could not access',o);continue}s[r]=s.container.querySelector(e[r].replace(n,''))}else if(a.test(e[r])){if(!s.parent){i.warn('No parent is available, could not access',o);continue}s[r]=s.parent.querySelector(e[r].replace(a,''))}else s[r]=t.querySelector(e[r]);s[r]||i.warn('No node found, could not access',o)}return s}static string_key(e){return e.replace(/^([A-Z][a-z]+?)([A-Z0-9][a-z]*?)/,((e,t,s)=>['Digit','Key'].includes(t)?s:`${s} ${t}`))}static clone_obj(e){return JSON.parse(JSON.stringify(e))}static assign_deep(e,...t){for(let s in t)for(let i in t[s])'object'==typeof t[s][i]&&null!=t[s][i]&&i in e?this.assign_deep(e[i],t[s][i]):'object'==typeof e&&null!=e&&Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(t[s],i));return e}static filter_deep(e,t){for(let s in e)s in t||delete e[s],'object'==typeof t[s]&&null!=t[s]&&this.filter_deep(e[s],t[s]);return e}static redirect(e,t,s){var i=Symbol();s.addEventListener(e,(e=>{e[i]})),t.addEventListener(e,(t=>s.dispatchEvent(Object.assign(new t.constructor(e,t),{[i]:!0,stopImmediatePropagation:t.stopImmediatePropagation.bind(t),preventDefault:t.preventDefault.bind(t)}))))}static promise(){var e,t=new Promise(((t,s)=>e={resolve:t,reject:s}));return Object.assign(t,e),t.resolve_in=(e=0,s)=>setTimeout((()=>t.resolve(s)),e),t}static rtn(e,t){return(e/t).toFixed()*t}}},77:(e,t)=>{for(let e of['log','warn','info','error','trace','table','debug','group','groupCollapsed','groupEnd'])t[e]=console[e].bind(console)},871:e=>{e.exports={name:'Krunker Cheat Loader',namespace:'https://forum.sys32.dev/',icon:'https://y9x.github.io/webpack/libs/gg.gif',license:'gpl-3.0',version:1.24,match:['https://krunker.io/*','https://*.browserfps.com/*']}}},r={};function o(e){var t=r[e];if(void 0!==t)return t.exports;var s=r[e]={exports:{}};return a[e](s,s.exports,o),s.exports}e=o(144),t=o(420),s=o(492),i=o(263),n=o(871),new class extends t{type='Userscript';lock=!0;version=n.version;key='krl';save_config(){localStorage[this.key]=JSON.stringify(this.config)}async load_config(){this.config=i.assign_deep({script:{url:!1,name:'',version:0},gui:{show:!0}},JSON.parse(localStorage[this.key]||'{}'));try{this.legacy()}catch(e){console.error(e)}this.save_config()}og_names={doge:'Dogeware',skid:'SkidFest',shit:'Sploit',sploit:'Sploit',junk:'Junker'};legacy(){var e=localStorage.scriptinfo,t=localStorage.userScripts;if(t&&(delete localStorage.userScripts,this.og_names[t]),e){delete localStorage.scriptinfo;var s=JSON.parse(e||'{}');s.name,s&&s.data&&s.data.url&&(this.config.script.url=s.data.url,this.config.script.name=s.name)}}constructor(e){super(),this.url=e,this.badge='[LOADER '+this.version+']',this.log=console.log.bind(console,this.badge),this.warn=console.warn.bind(console,this.badge),this.active=null}async main(){var t=await e({target:this.url,result:'json',cache:'query',sync:!0});if(n.version<t.loader.version){if(this.warn('The loader is outdated!'),!navigator.userAgent.includes('Electron'))return this.redirect(e.resolve({target:t.loader.url,query:{v:t.loader.version}}));alert('A new version of the Krunker Cheat Loader is available. Open GG Client\'s forum post and download the new loader. Replace this script with the new latest version.'),window.open('https://forum.sys32.dev/d/3-gg-client')}this.load_config();try{this.menu(t)}catch(e){this.warn(e)}if(this.config.script.url)try{this.load_script(t)}catch(e){this.warn(e)}else this.log('No script selected')}async load_script(t){var s,i=!1,n=t.scripts[this.config.script.name];if(!n||!this.config.script.name)return this.log('Invalid script selected, returning...');n.version!=this.config.script.version?(this.warn('Script data changed, cache invalidated.'),i=!0):(s=sessionStorage.getItem(this.config.script.url))?this.log('Loading cache...'):(this.warn('No script in sessionStorage, cache invalidated.'),i=!0),this.config.script.version=n.version,this.save_config(),i&&(this.log('Requesting new script...'),sessionStorage[this.config.script.url]=s=await e({target:this.config.script.url,query:{v:this.config.script.version},sync:!0,result:'text'})),new Function('LOADER',s)(this)}menu(e){var t=this.category(),i={None:!1};for(let[t,{url:s}]of Object.entries(e.scripts))i[t]=s;this.dropdown=t.control('Script',{type:'dropdown',walk:'script.url',value:i}).on('change',((e,t)=>{t||(this.config.script.name=this.dropdown.key,this.save_config(),location.reload())})),t.control('Show tab [F10 to enable]',{type:'boolean',walk:'gui.show'}).on('change',((e,t)=>!t&&location.reload()));for(let e of this.categories)e.update(!0);this.config.gui.show?this.insert('Cheats'):new s('F10',(()=>{this.config.gui.show=!0,this.save_config(),location.reload()}))}async redirect(e){await i.wait_for((()=>'complete'==document.readyState)),location.assign(e)}get script(){if(!this.active)return null;if(!this.serve.scripts[this.active])throw new Error(`'${this.active}' is invalid`);return this.serve.scripts[this.active]}}("https://y9x.github.io/userscripts/serve.json").main()})();
