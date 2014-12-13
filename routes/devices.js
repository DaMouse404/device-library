var V = require('joi'),
    Boom = require('boom'),
    uuid = require('node-uuid'),
    _ = require('lodash'),
    config = require('config'),
    ddb = require('../lib/database'),
    DeviceSchema = {
        id: V.string().guid(),
        owner: V.string().guid(),
        name: V.string().required(),
        OS: V.string().required()
    };

function fetchOwners(devices, cb) {
    var owners = [];

    _.each(devices, function(device) {
        if (device.owner) {
            owners.push(device.owner);
        }
    });

    if (!owners.length) {
        return cb(null, devices);
    }

    ddb.batchGetItem({'users': { keys: _.uniq(owners) }}, function(err, res) {
        if (err) return cb(err);

        owners =  _.indexBy(res.items, 'id');
        devices = _.map(devices, function(device) {
            if (device.owner) {
                device.owner = owners[device.owner];
            }

            return device;
        });

        cb(null, devices);
    });
}

function fetchOwner(device, cb) {
    if (device.owner) {
        ddb.getItem('users', device.owner, null, {}, function(err, item, cap) {
            device.owner = item;

            cb(err, device);
        });
    } else {
        cb(null, device);
    }
}

function fetchAllDevices(cb) {
    ddb.scan('devices', {}, function(err, res) {
        if (err) return cb(err);

        fetchOwners(res.items, cb);
    });
}

function fetchDevice(uid, cb) {
    ddb.getItem('devices', uid, null, {}, function(err, item, cap) {
        if (err) return cb(err);

        fetchOwner(item, cb);
    });
}

function deleteDevice(uid, cb) {
    ddb.deleteItem('devices', uid, null, {}, function(err, res, cap) {
        cb(err, res);
    });
}

function saveDevice(device, cb) {
    ddb.putItem('devices', device, {}, function(err, res, cap) {
        cb(err);
    });
}

module.exports = [
    {
        method: 'GET',
        path: '/devices/{id?}',
        handler: function(request, reply) {
            if (request.params.id) {
                fetchDevice(request.params.id, function(err, device) {
                    if (err) {
                        console.log(err);
                        throw err;
                    } else {
                        if (!device) {
                            reply(Boom.notFound());
                        } else {
                            reply(device);
                        }
                    }
                });
            } else {
                fetchAllDevices(function(err, devices) {
                    if (err) {
                        throw err;
                    } else {
                        reply(devices);
                    }
                });
            }
        },
        config: {
            validate: {
                params: {
                    id: DeviceSchema.id
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/devices',
        handler: function(request, reply) {
            var newDevice = request.payload;

            if (newDevice.id) {
                return reply(Boom.badRequest('ID specified for device creation'));
            }

            newDevice.id = uuid.v1();

            saveDevice(newDevice, function(err) {
                if (err) throw err;

                reply()
                    .header('location', '/devices/' + newDevice.id)
                    .code(201);
            });
        },
        config: {
            validate: {
                payload: DeviceSchema
            }
        }
    },
    {
        method: 'PUT',
        path: '/devices/{id}',
        handler: function(request, reply) {

            fetchDevice(request.params.id, function(err, device) {
                if (err) throw err;
                if (!device) return reply(Boom.notFound('device not found'));

                var device = request.payload;
                device.id = request.params.id;

                saveDevice(device, function(err) {
                    if (err) throw err;

                    reply();
                });
            });
        },
        config: {
            validate: {
                params: {
                    id: DeviceSchema.id.required()
                },
                payload: DeviceSchema
            }
        }
    },
    {
        method: 'DELETE',
        path: '/devices/{id}',
        handler: function(request, reply) {
            fetchDevice(request.params.id, function(err, device) {
                if (err) throw err;
                if (!device) return reply(Boom.notFound('device not found'));

                deleteDevice(device.id, function(err) {
                    if (err) throw err;

                    reply();
                });
            });
        },
        config: {
            validate: {
                params: {
                    id: DeviceSchema.id.required()
                }
            }
        }
    }
];
