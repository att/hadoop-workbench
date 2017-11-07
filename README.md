Hadoop Workbench
======================

A feature rich tool to manage BigData applications. It supports following: 

* Abstraction over Hadoop clusters from different distributions
* Intermediate application format with parametrized environment properties
* Cluster agnostic application deployment
* Application visual/text editing  
* Application import/export in unified format
* Application execution and monitoring on cluster
* LDAP based user authentication
* Role based user authorization
* Kerberos service layer authentication 
* Integration with Hortonworks and Cloudera



Deployment
-----------

__Prerequisites__

JDK 8.x \
Maven 3.5.0 + \
Node.js 6.11.5 + \
Docker 17.06.1-ce + \
Zinc Server 0.3.5 (optional, significantly improves compilation time) 

__Build__ 

`mvn clean install -Pfrontend,backend,docker`


Startup
---------

__Docker__


To create and run new docker container: \
`bin/start.sh` 

To terminate all docker containers based on HW image: \
`bin/stop.sh` 

Optional environment variables: 

`HW_IMAGE_NAME` - HW image name, default - "dataplatform/hw" \
`HW_IMAGE_VERSION` - HW image version. default - current project version in POM file \
`HW_PORT` - Web application port, default - 8080 \
`HW_HOME` - HW home directory, default - "~/.hw"


Mounted dirs:

`$HW_HOME/db` - Embedded DB files \
`$HW_HOME/repository` - Internal tenant repository files \
`$HW_HOME/conf` - Configuration files \
`$HW_HOME/keys` - Access key files \
`$HW_HOME/logs` - Application log files \
`$HW_HOME/tomcat-logs` - Servlet container log files 


__Maven__

Used in development mode with embedded Jetty server: 

`cd hw-web` \
`mvn jetty:run`

Note in this case default home directory will be used `~/.hw`. \
MySQL/MariaDB should be installed manually and configured in `$HW_HOME/conf/application.conf`    

Mandatory properties: 

`plugin.dir=[project.dir]/hw/plugins` \
`hw.ldap` - External LDAP configuration. Refer to "Configuration" section.
 

__Configuration__

Configuration files in `$HW_HOME/conf` folder: 

`appication.conf` - Application configuration file \
`krb5.conf` - Kerberos client configuration \
`logback.xml` - HW logging configuration

In case running docker container default configuration files automatically added to `$HW_HOME/conf` folder.

Mandatory properties in `appication.conf`: 

`hw.ldap.host=[host]` \
`hw.ldap.port=[port]` \
`hw.ldap.ssl.enabled=[true/false]` \
`hw.ldap.user.name=[user]` \
`hw.ldap.user.password=[password]` \
`hw.ldap.user.base.dn=[dc=xyz,dc=com]` \
`hw.ldap.user.attribute=[uid]` 


Mandatory properties in `krb5.conf` in case of kerberized cluster:

`[libdefaults]` \
`[domain_realm]` \
`[realms]`

URL
---
http://[host]:[port]/hw/


