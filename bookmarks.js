<!DOCTYPE HTML>
<html>
	<head>
		<meta charset='utf8' />
	</head>
	<body>
		<script>
var add_ele = (node_name, parent, attributes = {}) => {
	if(node_name == 'text')return parent.appendChild(Object.assign(document.createTextNode(''), attributes));
	
	if(attributes.style != null && typeof attributes.style == 'object')attributes.style = this.css(attributes.style);
	
	return Object.assign(parent.appendChild(document.createElement(node_name)), attributes);
};

var scripts = {
	Sploit: 'https://y9x.github.io/userscripts/sploit.user.js',
};

for(let script in scripts)add_ele('a', document.body, {
	href: `javascript:var r=new XMLHttpRequest();r.open('GET',${JSON.stringify(script)},false);r.send();var t=location.href,w=window.open(t),i=w.setInterval(_=>w.location.href==t&&(w.clearInterval(i),w.eval(r.responseText),location.href='about:blank'))`,
});
		</script>
	</body>
</html>
