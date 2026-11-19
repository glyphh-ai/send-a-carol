// test/noport.cjs : loaded before server.js when a test runs `node server.js --check` (node -r ./test/noport.cjs):
// binding a port or asking the network for anything (an email, a song, a payment, Google's keys are all a fetch;
// R2 is https.request) ends the process at once with its own exit code, so "it binds no port and asks nobody
// anything" is something the test sees, not something it is told.
'use strict';
require('net').Server.prototype.listen = function () { console.error('A PORT WAS BOUND'); process.exit(97); };
global.fetch = function (u) { console.error('THE NETWORK WAS ASKED FOR ' + u); process.exit(98); };
require('https').request = function (o) { console.error('THE NETWORK WAS ASKED FOR ' + (o && (o.hostname || o.host || o.href) || 'something')); process.exit(98); };
