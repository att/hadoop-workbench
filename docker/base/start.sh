#!/bin/bash

echo "================== Append custom hosts ======="
cat /etc/custom_hosts >> /etc/hosts

echo "================== Copying hw.war to Tomcat ==="
mv /opt/hw/hw.war /opt/tomcat/webapps

/mariadb.sh

/opt/hw/bin/start-hw.sh

sleep infinity

