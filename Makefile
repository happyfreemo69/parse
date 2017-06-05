mocha=./node_modules/mocha/bin/mocha --recursive
folders=e2e lib
.PHONY: test $(folders)
test: $(folders)

lib:
	@$(mocha) test/lib

e2e:
	@$(mocha) test/e2e