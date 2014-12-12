var Hapi = require('hapi'),
    server = new Hapi.Server({ debug: { request: ['error'] } });

function startServer() {
    server.start(function () {
        console.log('Server running at:', server.info.uri);
    });
}

server.connection({ host: 'pal.sandbox.dev.bbc.co.uk', port: 3000 });

server.route(require('./routes/devices'));
server.route(require('./routes/users'));

server.register(require('lout'), function() {
    startServer();
});
