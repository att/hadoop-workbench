#!/bin/bash

__start_mysql() {
echo "#### mysql setup"
mysql_install_db

touch /var/lib/mysql/mounted
chown -R mysql:mysql /var/lib/mysql

echo "#### mysql start"
/usr/bin/mysqld_safe &
sleep 5
}

# Call functions
__start_mysql
