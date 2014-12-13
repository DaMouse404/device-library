var sinon = require('sinon'),
    assert = require('assert'),
    uuid = require('node-uuid'),
    server = require('../server'),
    database = require('../lib/database');

describe('Users', function() {
    it('Lists all users in the database', function(done) {
        var params = {
            method: 'GET',
            url: '/users'
        },
        scan = sinon.stub(database, 'scan', function(table, options, cb) {
            cb(null, {items: [{woof:'woof'}]});
        });

        server.inject(params, function(response) {
            assert.deepEqual(response.result, [{woof:'woof'}]);

            scan.restore();
            done();
        });
    });

    it('Gets a single user from the database', function(done) {
        var params = {
            method: 'GET',
            url: '/users/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {woof: 'woof'});
        });

        server.inject(params, function(response) {
            assert(getItem.calledOnce);
            assert(getItem.calledWith('users', '4f25951e-82d8-11e4-b116-123b93f75cba', null, {}));
            assert.deepEqual({woof: 'woof'}, response.result);

            getItem.restore();
            done();
        });
    });

    it('Deletes a user from the database', function(done) {
        var params = {
            method: 'DELETE',
            url: '/users/4f25951e-82d8-11e4-b116-123b93f75cba'
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {id: 'woof'});
        }),
        deleteItem = sinon.stub(database, 'deleteItem', function(table, hash, range, opts, cb) {
            cb(null);
        });

        server.inject(params, function(response) {
            assert(getItem.calledOnce);
            assert(getItem.calledWith('users', '4f25951e-82d8-11e4-b116-123b93f75cba', null, {}));

            assert(deleteItem.calledOnce);
            assert(deleteItem.calledWith('users', 'woof', null, {}));

            getItem.restore();
            deleteItem.restore();

            done();
        });
    });

    it('Adds a new user', function(done) {
        var user = {
            name: 'Christmas',
            email: 'tree@christmas.com',
            team: 'Santa'
        },
        params = {
            method: 'POST',
            url: '/users',
            payload: user
        },
        putItem = sinon.stub(database, 'putItem', function(table, item, options, cb) {
            cb(null);
        }),
        uid = sinon.stub(uuid, 'v1', function() {
            return 'woof';
        });

        server.inject(params, function(response) {
            user.id = 'woof';

            assert(putItem.calledOnce);
            assert(putItem.calledWith('users', user));

            assert.equal(response.statusCode, 201);
            assert.equal(response.headers.location, '/users/woof');

            putItem.restore();
            uid.restore();
            done();
        });
    });

    it('Updates an existing user', function(done) {
        var user = {
            name: 'Christmas',
            email: 'tree@christmas.com',
            team: 'Santa'
        },
        params = {
            method: 'PUT',
            url: '/users/4f25951e-82d8-11e4-b116-123b93f75cba',
            payload: user
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {id: '4f25951e-82d8-11e4-b116-123b93f75cba'});
        }),
        putItem = sinon.stub(database, 'putItem', function(table, item, options, cb) {
            cb(null);
        });

        server.inject(params, function(response) {
            user.id = '4f25951e-82d8-11e4-b116-123b93f75cba';

            assert(getItem.calledOnce);
            assert(getItem.calledWith('users', '4f25951e-82d8-11e4-b116-123b93f75cba'));

            assert(putItem.calledOnce);
            assert(putItem.calledWith('users', user));

            assert.equal(response.statusCode, 200);

            getItem.restore();
            putItem.restore();
            done();
        });
    });

    it('Gets all devices for a user', function(done) {
        var params = {
            method: 'GET',
            url: '/users/4f25951e-82d8-11e4-b116-123b93f75cba/devices',
        },
        filter = {
            owner: {
                eq: '4f25951e-82d8-11e4-b116-123b93f75cba'
            }
        },
        getItem = sinon.stub(database, 'getItem', function(table, hash, range, opts, cb) {
            cb(null, {id: '4f25951e-82d8-11e4-b116-123b93f75cba'});
        }),
        scan = sinon.stub(database, 'scan', function(table, options, cb) {
            cb(null, {items: [{id: 'woof', owner: '4f25951e-82d8-11e4-b116-123b93f75cba'}]});
        });

        server.inject(params, function(response) {
            assert(getItem.calledOnce);
            assert(getItem.calledWith('users', '4f25951e-82d8-11e4-b116-123b93f75cba'));

            assert(scan.calledOnce);
            assert(scan.calledWith('devices', { filter: filter }));

            assert.equal(response.statusCode, 200);

            getItem.restore();
            scan.restore();
            done();
        });
    });
});
