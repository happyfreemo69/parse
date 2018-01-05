PARSE Docker image
=======================

- To run, the image needs :
  - a ssh key provided as a id_rsa file
  - a privateConfig.js file, mounted at runtime (you can specify using volumes directives in a docker-compose.yml file). This file should be created
  - A running accessible mongodb server
  - The environment variable PARSE_PORT should be set to the same port specified in privateConfig. You can do that in a makefile.
  
Sample docker-compose.yml (in assetd parent directory)
```
version: "2"
services:
  parse:
    build: parse
    ports:
      - "127.0.0.1:$PARSE_PORT:$PARSE_PORT"
    volumes:
      - ./config/privateConfig.js:/home/citylity/parse/config/privateConfig.js

```

Sample makefile (in parse parent directory)
```
build:
	@PARSE_PORT=`node -e 'console.log(require("./config/privateConfig").port)'` docker-compose -p asset build parse
run:
	@PARSE_PORT=`node -e 'console.log(require("./config/privateConfig").port)'` docker-compose -p asset up -d parse
stop:
	@PARSE_PORT=`node -e 'console.log(require("./config/privateConfig").port)'` docker-compose -p asset stop
clean: stop
	@PARSE_PORT=`node -e 'console.log(require("./config/privateConfig").port)'` docker-compose -p asset rm parse

```
