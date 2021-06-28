install: install-deps

page-loader:
	node bin/page-loader.js

install-deps:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	DEBUG=nock.common,page-loader*,axios npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8
	