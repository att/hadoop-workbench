DAP Docker
=========

Docker 

Prerequisites
---------------------------------
 - Maven (3.3.4+).
 - Docker installed
 - JDK 1.7 

Build Information
---------------------------------
### How to build the Docker

Ubuntu base build
```
mvn clean package -P base,ubuntu
```
Centos base build
```
mvn clean package -P base,centos
```
Application build
```
mvn clean package -P application
```

