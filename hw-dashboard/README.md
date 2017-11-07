DAP Dashboard (JS Frontend)
===========================

JS build instruction 

Prerequisites
---------------------------------
 - nodejs
 - npm
 - grunt
 - bower

Build Information
---------------------------------
### Install JS toolchain (Ubuntu)

```
apt-get update
apt-get install nodejs
apt-get install npm
npm insall grunt
ln -s /usr/bin/nodejs /usr/bin/node
npm install -g bower
npm install -g grunt-cli
```

### Build with Maven
```
mvn install
```


### Build from webapp
```
grunt build:dist
```

