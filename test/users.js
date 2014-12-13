var sinon = require('sinon'),
    assert = require('assert'),
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
});
