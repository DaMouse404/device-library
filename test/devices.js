var sinon = require('sinon'),
    assert = require('assert'),
    uuid = require('node-uuid'),
    server = require('../server'),
    database = require('../lib/database');

describe('Devices', function() {
    it('Lists all devices', function(done) {
        var params = {
            method: 'GET',
            url: '/devices'
        },
        scan = sinon.stub(database, 'scan', function(table, options, cb) {
            cb(null, {items: [{woof:'woof'}]});
        });

        server.inject(params, function(response) {
            assert(scan.calledOnce);
            assert(scan.calledWith('devices', {}));
            assert.deepEqual(response.result, [{woof:'woof'}]);

            scan.restore();
            done();
        });
    });

    it('Lists all devices with associated owners', function(done) {
        var params = {
            method: 'GET',
            url: '/devices'
        },
        devices = [
            {
                name: 'Cake',
                owner: 'batman'
            },
            {
                name: 'Ice Cream',
                owner: 'joker'
            },
            {
                name: 'Lollipop'
            }
        ],
        owners = [
            {
                id: 'batman',
                name: 'Batman'
            },
            {
                id: 'joker',
                name: 'The Joker'
            }
        ],
        scan = sinon.stub(database, 'scan', function(table, options, cb) {
            cb(null, {items: devices});
        }),
        batchGetItem = sinon.stub(database, 'batchGetItem', function(filter, cb) {
            cb(null, {items: owners});
        });

        server.inject(params, function(response) {
            devices[0].owner = owners[0];
            devices[1].owner = owners[1];

            assert(scan.calledOnce);
            assert(scan.calledWith('devices', {}));
            assert(batchGetItem.calledOnce);
            assert(batchGetItem.calledWith({'users': {'keys':['batman','joker']}}));

            assert.deepEqual(response.result, devices);

            scan.restore();
            batchGetItem.restore();
            done();
        });
    });

    it('Gets a single device', function(done) {
        var params = {
            method: 'GET',
            url: '/devices/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {woof: 'woof'});
        });

        server.inject(params, function(response) {
            assert(getItem.calledOnce);
            assert(getItem.calledWith('devices', '4f25951e-82d8-11e4-b116-123b93f75cba', null, {}));
            assert.deepEqual({woof: 'woof'}, response.result);

            getItem.restore();
            done();
        });
    });

    it('Returns a 404 when device does not exist', function(done) {
        var params = {
            method: 'GET',
            url: '/devices/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, null);
        });

        server.inject(params, function(response) {
            assert.equal(response.statusCode, 404);

            getItem.restore();
            done();
        });
    });

    it('Gets a single device with an owner', function(done) {
        var params = {
            method: 'GET',
            url: '/devices/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        device = {name: 'cake', owner: 'woof'},
        owner = {id: 'woof', name: 'Batman'},
        getItem = sinon.stub(database, 'getItem');

        getItem.onFirstCall().yields(null, device);
        getItem.onSecondCall().yields(null, owner);

        server.inject(params, function(response) {
            device.owner = owner;

            assert(getItem.calledTwice);
            assert(getItem.calledWith('devices', '4f25951e-82d8-11e4-b116-123b93f75cba', null, {}));
            assert(getItem.calledWith('users', 'woof', null, {}));

            assert.deepEqual(device, response.result);

            getItem.restore();
            done();
        });
    });

    it('Deletes a device', function(done) {
        var params = {
            method: 'DELETE',
            url: '/devices/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {id: 'woof'});
        }),
        deleteItem = sinon.stub(database, 'deleteItem', function(table, hash, range, opts, cb) {
            cb(null);
        });

        server.inject(params, function(response) {
            assert(getItem.calledOnce);
            assert(getItem.calledWith('devices', '4f25951e-82d8-11e4-b116-123b93f75cba', null, {}));

            assert(deleteItem.calledOnce);
            assert(deleteItem.calledWith('devices', 'woof', null, {}));

            getItem.restore();
            deleteItem.restore();

            done();
        });
    });

    it('Adds a new device', function(done) {
        var device = {
            name: 'Christmas',
            OS: 'Tree 1.0'
        },
        params = {
            method: 'POST',
            url: '/devices',
            payload: device
        },
        putItem = sinon.stub(database, 'putItem', function(table, item, options, cb) {
            cb(null);
        }),
        uid = sinon.stub(uuid, 'v1', function() {
            return 'woof';
        });

        server.inject(params, function(response) {
            device.id = 'woof';

            assert(putItem.calledOnce);
            assert(putItem.calledWith('devices', device));

            assert.equal(response.statusCode, 201);
            assert.equal(response.headers.location, '/devices/woof');

            putItem.restore();
            uid.restore();
            done();
        });
    });

    it('Updates an existing device', function(done) {
        var device = {
            name: 'Christmas',
            OS: 'Tree 1.0'
        },
        params = {
            method: 'PUT',
            url: '/devices/4f25951e-82d8-11e4-b116-123b93f75cba',
            payload: device
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {id: '4f25951e-82d8-11e4-b116-123b93f75cba'});
        }),
        putItem = sinon.stub(database, 'putItem', function(table, item, options, cb) {
            cb(null);
        });

        server.inject(params, function(response) {
            device.id = '4f25951e-82d8-11e4-b116-123b93f75cba';

            assert(getItem.calledOnce);
            assert(getItem.calledWith('devices', '4f25951e-82d8-11e4-b116-123b93f75cba'));

            assert(putItem.calledOnce);
            assert(putItem.calledWith('devices', device));

            assert.equal(response.statusCode, 200);

            getItem.restore();
            putItem.restore();
            done();
        });
    });
});
