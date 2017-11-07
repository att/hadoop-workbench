FROM ubuntu:14.04

################## BEGIN INSTALLATION ######################
RUN apt-get -y update && \
    apt-get -y install \
        bzip2  \
        ca-certificates \
        curl \
        e2fsprogs \
        expect \
        git \
        krb5-user \
        ldap-utils \
        libssl1.0.0 \
        mariadb-client \
        mariadb-server \
        openssh-client \
        python-selinux \
        software-properties-common \
        supervisor \
        tar \
        unzip \
        vim \
        wget

ADD my.cnf /etc/mysql/my.cnf

RUN groupadd -r hw &&  useradd -c "hw" -d /opt/hw -g hw -s /bin/bash hw && mkdir -p /opt/hw/bin

# Install Hotspot
RUN wget --no-cookies --no-check-certificate --header "Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com%2F; \
oraclelicense=accept-securebackup-cookie" \
"http://download.oracle.com/otn-pub/java/jdk/8u151-b12/e758a0de34e24606bca991d704f6dcbf/jre-8u151-linux-x64.tar.gz" -P /opt
RUN tar -xzf /opt/jre-8u151-linux-x64.tar.gz -C /opt
RUN mv /opt/jre1.8.0_151 /opt/jdk
ADD ./jce_policy/local_policy.jar /opt/jdk/lib/security/local_policy.jar
ADD ./jce_policy/US_export_policy.jar /opt/jdk/lib/security/US_export_policy.jar

# Install Flyway

RUN wget "https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.2.0/flyway-commandline-4.2.0.tar.gz" -P /opt
RUN tar -xzf /opt/flyway-commandline-4.2.0.tar.gz -C /opt
RUN mv /opt/flyway-4.2.0 /opt/flyway
RUN chmod +x /opt/flyway/flyway
RUN chown -R hw:hw /opt/flyway

# Install Tomcat
RUN wget "http://archive.apache.org/dist/tomcat/tomcat-8/v8.0.47/bin/apache-tomcat-8.0.47.tar.gz" -P /opt
RUN tar -xzf /opt/apache-tomcat-8.0.47.tar.gz -C /opt
RUN mv /opt/apache-tomcat-8.0.47 /opt/tomcat
ADD tomcat/bin/setenv.sh /opt/tomcat/bin/setenv.sh
ADD tomcat/conf/tomcat-users.xml /opt/tomcat/conf/tomcat-users.xml
RUN chown -R hw:hw /opt/tomcat
##################### INSTALLATION END #####################

##################### System Fixes #########################
# Warning: Does not work. Fix /etc/default/docker on Docker host (DOCKER_OPTS="--dns x.x.x.x")
ADD hosts /etc/custom_hosts

########################## HW  ############################
ADD ./sudo.hw /etc/sudoers.d/hw
ADD ./mariadb.sh /mariadb.sh
RUN chmod +x /mariadb.sh
ADD ./start-hw.sh /opt/hw/bin/start-hw.sh
ADD ./start.sh /start.sh
RUN chmod +x /start.sh
RUN chmod +x /opt/hw/bin/start-hw.sh

ADD ./.bashrc /opt/hw/.bashrc
ADD ./hw_home  /usr/local/src/hw_home
RUN chown -R hw:hw /usr/local/src/hw_home
RUN ln -s /opt/flyway/flyway /opt/hw/bin/flyway
ADD ./flyway.conf /opt/flyway/conf/flyway.conf
RUN chown -R hw:hw /opt/flyway/conf
RUN chown -R hw:hw /opt/hw