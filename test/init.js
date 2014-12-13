var nock = require('nock');

before(function() {
    nock.disableNetConnect();
});

after(function() {
    nock.enableNetConnect();
});

afterEach(function() {
    nock.cleanAll();
});
