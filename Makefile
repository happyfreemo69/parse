mocha=./node_modules/mocha/bin/mocha --recursive
folders=e2e lib
dirs=$(addprefix test/,$(folders))
.PHONY: test $(folders)
test: $(folders)

lib:
	@$(mocha) test/lib

e2e:
	@$(mocha) test/e2e

jenkins:
	@$(mocha) --reporter mocha-jenkins-reporter --colors --reporter-options junit_report_path=./test-reports/report.xml $(dirs)
