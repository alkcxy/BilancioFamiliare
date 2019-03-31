FROM ruby:2.5
MAINTAINER Alessio Caradossi <alkcxy@gmail.com>
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -qq -y build-essential nodejs yarn git default-libmysqlclient-dev --fix-missing --no-install-recommends
RUN mkdir /bilancio
WORKDIR /bilancio
COPY . /bilancio
RUN bundle install --without development test
RUN yarn install
RUN rails webpacker:compile
