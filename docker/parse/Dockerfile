FROM debian:stretch
MAINTAINER David Flavigné

RUN apt-get update
RUN apt-get install -y \
    git \
    ssh \
    gnupg \
    make \
    g++ \
    curl

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -

RUN apt-get install -y \
    nodejs

RUN useradd -d "/home/citylity" -u 1000 -m -s /bin/bash citylity
WORKDIR /home/citylity

RUN mkdir .ssh
COPY id_rsa /home/citylity/.ssh/id_rsa
COPY config /home/citylity/.ssh/config
COPY privateConfig.js /home/citylity/privateConfig.js
RUN chown -R citylity:citylity /home/citylity/privateConfig.js
RUN ssh-keyscan -t rsa github.com > /home/citylity/.ssh/known_hosts
RUN chown -R citylity:citylity /home/citylity/.ssh
USER citylity
RUN git clone --verbose --progress git@github.com:happyfreemo69/parse.git
RUN cp /home/citylity/privateConfig.js /home/citylity/parse/config/privateConfig.js
WORKDIR parse
COPY server.crt /home/citylity/parse/config/server.crt
COPY server.key /home/citylity/parse/config/server.key
RUN npm install

ENTRYPOINT ["nodejs","app.js"]
