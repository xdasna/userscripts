'use strict';

module.exports = {
    name: 'Junker',
    author: 'The Gaming Gurus',
    locations: [ 'game' ],
    run(){
		var request = new XMLHttpRequest();
		request.open('GET', 'https://y9x.github.io/userscripts/junker.user.js', false);
		request.send();
		new Function('LICENSE_KEY', request.responseText)('idkr');
    },
};