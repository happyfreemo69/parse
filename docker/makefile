build:
	@PARSE_PORT=`node -e 'console.log(require("./parse/privateConfig").port)'` docker-compose -p parse build
run:
	@echo "PARSE_PORT=`node -e 'console.log(require(\"./parse/privateConfig\").port)'`" > .env
	@docker-compose -p parse up parse
stop:
	@PARSE_PORT=`node -e 'console.log(require("./parse/privateConfig").port)'` docker-compose -p parse stop
clean: stop
	@PARSE_PORT=`node -e 'console.log(require("./parse/privateConfig").port)'` docker-compose -p parse rm parse
