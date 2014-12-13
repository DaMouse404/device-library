.PHONY: test

export NODE_PATH=./lib

all:
	node index.js

test:
	./node_modules/mocha/bin/mocha \
		--require blanket \
		--reporter mocha-term-cov-reporter

coveralls:
	./node_modules/mocha/bin/mocha \
		--require blanket \
		--reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
