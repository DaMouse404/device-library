var V = require('joi'),
    _ = require('lodash'),
    Boom = require('boom'),
    uuid = require('node-uuid'),
    config = require('config'),
    ddb = require('dynamodb').ddb(config.AWS),
    UserSchema = {
        id: V.string().guid(),
        name: V.string().required(),
        team: V.string().required(),
        email: V.string().email().required()
    };

function fetchAllUsers(cb) {
    ddb.scan('users', {}, function(err, res) {
        if (err) return cb(err);

        cb(err, res.items);
    });
}

function fetchUser(uid, cb) {
    ddb.getItem('users', uid, null, {}, function(err, item, cap) {
        cb(err, item);
    });
}

function deleteUser(uid, cb) {
    ddb.deleteItem('users', uid, null, {}, function(err, res, cap) {
        cb(err, res);
    });
}

function saveUser(user, cb) {
    ddb.putItem('users', user, {}, function(err, res, cap) {
        cb(err);
    });
}

function fetchDevices(user, cb) {
    var filter = {
        owner: {
            eq: user.id
        }
    };

    ddb.scan('devices', {filter: filter}, function(err, res) {
        if (err) return cb(err);

        var devices = _.map(res.items, function(device) {
            device.owner = user;

            return device;
        });

        cb(null, devices);
    });
}

module.exports = [
    {
        method: 'GET',
        path: '/users/{id?}',
        handler: function(request, reply) {
            if (request.params.id) {
                fetchUser(request.params.id, function(err, user) {
                    if (err) {
                        console.log(err);
                        throw err;
                    } else {
                        if (!user) {
                            reply(Boom.notFound());
                        } else {
                            reply(user);
                        }
                    }
                });
            } else {
                fetchAllUsers(function(err, users) {
                    if (err) {
                        throw err;
                    } else {
                        reply(users);
                    }
                });
            }
        },
        config: {
            validate: {
                params: {
                    id: UserSchema.id
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/users/{id}/devices',
        handler: function(request, reply) {
            fetchUser(request.params.id, function(err, user) {
                if (err) return reply(err);
                if (!user) return reply(Boom.notFound('user not found'));

                fetchDevices(user, function(err, devices) {
                    if (err) return reply(err);

                    reply(devices);
                });
            });
        },
        config: {
            validate: {
                params: {
                    id: UserSchema.id.required()
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/users',
        handler: function(request, reply) {
            var newUser = request.payload;
            newUser.id = uuid.v1();

            saveUser(newUser, function(err) {
                if (err) throw err;

                reply()
                    .header('location', '/users/' + newUser.id)
                    .code(201);
            });
        },
        config: {
            validate: {
                payload: UserSchema
            }
        }
    },
    {
        method: 'PUT',
        path: '/users/{id}',
        handler: function(request, reply) {
            reply('OK!');
        },
        config: {
            validate: {
                params: {
                    id: UserSchema.id.required()
                },
                payload: UserSchema
            }
        }
    },
    {
        method: 'DELETE',
        path: '/users/{id}',
        handler: function(request, reply) {
            fetchUser(request.params.id, function(err, user) {
                if (err) throw err;

                deleteUser(user.id, function(err) {
                    if (err) throw err;

                    reply();
                });
            });
        },
        config: {
            validate: {
                params: {
                    id: UserSchema.id.required()
                }
            }
        }
    }
];
