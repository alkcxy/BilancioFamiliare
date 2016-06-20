#!/usr/bin/env bash

sudo rm /var/run/mysqld -rf
sudo ln -s $HOME/db.mysql /var/run/mysqld

source $HOME/.rvm/scripts/rvm
rvm use 2.2.2@vagrant
source $HOME/.bash_profile
nvm use v4.4.5
cd
uwsgi --ini $HOME/bin/emperor.ini
