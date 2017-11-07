#!/bin/sh
count="select count(*) from information_schema.tables where table_type = 'BASE TABLE' and table_schema = 'HW'"
export TERM=xterm

export HW_HOME=/opt/hw
export HW_BIN=$HW_HOME/bin
export CATALINA_HOME=/opt/tomcat
export HW_EXEC=$CATALINA_HOME/webapps

/usr/bin/mysql -u root -h localhost -e"$count" > $HW_HOME/mysql_status.txt
stat=`cat $HW_HOME/mysql_status.txt | tail -1`
rm -rf $HW_HOME/mysql_status.txt

if [ "$stat" != "0" ]; then
    echo 'The databse specified, is not empty.';
    echo 'Upgrading HW schema to the latest version';
    su hw -c 'source $HW_HOME/.bashrc && $HW_BIN/flyway migrate'
else
    echo 'Database is empty. Start migrate and import data'
    su hw -c 'source $HW_HOME/.bashrc && cd $HW_HOME/scripts && /usr/bin/mysql -u root -h localhost < create-db-hw.sql'
    su hw -c 'source $HW_HOME/.bashrc && $HW_BIN/flyway migrate'
fi

sleep 10

##### copy default configuration files ######

if [ ! -f "$HW_HOME/conf/application.conf" ]
then
    cp /usr/local/src/hw_home/conf/application.conf $HW_HOME/conf/application.conf
fi

if [ ! -f "$HW_HOME/conf/krb5.conf" ]
then
    cp /usr/local/src/hw_home/conf/krb5.conf $HW_HOME/conf/krb5.conf
fi

if [ ! -f "$HW_HOME/conf/logback.xml" ]
then
    cp /usr/local/src/hw_home/conf/logback.xml $HW_HOME/conf/logback.xml
fi

touch $HW_HOME/conf/mounted
touch $HW_HOME/logs/mounted
touch $HW_HOME/keys/mounted
touch $HW_HOME/repository/mounted
touch $CATALINA_HOME/logs/mounted

chown -R hw:hw $HW_HOME/conf
chown -R hw:hw $HW_HOME/logs
chown -R hw:hw $HW_HOME/keys
chown -R hw:hw $HW_HOME/repository
chown -R hw:hw $CATALINA_HOME/logs

su hw -c 'source $HW_HOME/.bashrc && cd $CATALINA_HOME/bin && ./startup.sh '
