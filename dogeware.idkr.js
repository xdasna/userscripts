'use strict';

module.exports = {
    name: 'Dogeware',
    author: 'The Gaming Gurus',
    locations: [ 'game' ],
    run(){
		var request = new XMLHttpRequest();
		request.open('GET', 'https://y9x.github.io/userscripts/dogeware.user.js', false);
		request.send();
		new Function('LICENSE_KEY', request.responseText)('idkr');
    },
};