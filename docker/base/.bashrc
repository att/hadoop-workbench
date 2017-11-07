# .bashrc

# Source global definitions
if [ -f /etc/bashrc ]; then
	. /etc/bashrc
fi

export JAVA_HOME=/opt/jdk
export CATALINA_HOME=/opt/tomcat
export FLYWAY_HOME=/opt/flyway
export HW_HOME=/opt/hw

PATH=$JAVA_HOME/bin:$CATALINA_HOME/bin:$FLYWAY_HOME/bin:$HOME/bin:$PATH

export PATH
