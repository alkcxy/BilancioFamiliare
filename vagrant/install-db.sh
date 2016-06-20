#!/usr/bin/env bash

EXPECTED_ARGS=2
E_BADARGS=65
MYSQL=`which mysql`

Q1="CREATE DATABASE IF NOT EXISTS $1;"
#Q2="GRANT USAGE ON *.* TO $2@localhost IDENTIFIED BY '$3';"
#Q3="GRANT ALL PRIVILEGES ON $1.* TO $2@localhost;"
Q4="FLUSH PRIVILEGES;"
SQL="${Q1}${4}"

if [ $# -ne $EXPECTED_ARGS ]
then
  echo "Usage: $0 dbname dbpass"
  exit $E_BADARGS
fi

$MYSQL --defaults-file=$HOME/.my.cnf -uroot -p$2 -e "$SQL"
