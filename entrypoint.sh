#!/bin/bash

rm -f tmp/pids/server.pid
gem update bundle
bundle install
bundle update
yarn install
yarn upgrade
rails s -p 3000 -b '0.0.0.0'
