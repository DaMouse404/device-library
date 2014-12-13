var Hapi = require('hapi'),
    config = require('config'),
    server = new Hapi.Server();

server.connection({ port: config.api.port });

server.route(require('./routes/devices'));
server.route(require('./routes/users'));

server.register(require('lout'), function(err) {
    if (err) {
        console.error('Plugin: ', err);
    }
});

module.exports=server;
