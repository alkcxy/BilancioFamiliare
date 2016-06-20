#!/usr/bin/env bash

cd /vagrant

source $HOME/.rvm/scripts/rvm
rvm use ${1}@vagrant --create

source $HOME/.bash_profile
nvm use ${2}

bundle config build.nokogiri --use-system-libraries
bundle install

cd /vagrant/vagrant/conf
bunzip2 ${4}.bz2
mysql --defaults-file=$HOME/.my.cnf -uroot -p${3} ${4}dev < ${4}
bzip2 ${4}
x\
cd /vagrant
bundle exec rake db:migrate
bundle exec rake tmp:create

ln -s /vagrant/vassals/vivilazio-dev.ini $HOME/vassals/
#cp /vagrant/vassals/vivilazio-dev.ini $HOME/vassals/
