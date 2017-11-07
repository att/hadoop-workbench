#!/usr/bin/env bash

# resolve links - $0 may be a softlink

PRG="$0"

while [ -h "$PRG" ] ; do
  ls=`ls -ld "$PRG"`
  link=`expr "$ls" : '.*-> \(.*\)$'`
  if expr "$link" : '/.*' > /dev/null; then
    PRG="$link"
  else
    PRG=`dirname "$PRG"`/"$link"
  fi
done

PRG_DIR=`dirname "$PRG"`

if [ -z "$HW_IMAGE_NAME" ]; then
    HW_IMAGE_NAME=dataplatform/hw
fi

if [ -z "$HW_PORT" ]; then
    HW_PORT=8080
fi

if [ -z "$HW_HOME" ]; then
    HW_HOME=~/.hw
fi


start() {

    if [ -z "$HW_IMAGE_VERSION" ]; then
        POM_FILE=$PRG_DIR/../pom.xml
        if [ -f $POM_FILE ]; then
            echo "Retrieving image version from Maven POM file"
            HW_IMAGE_VERSION=`grep --max-count=1 '<version>' $POM_FILE | awk -F '>' '{ print $2 }' | awk -F '<' '{ print $1 }'`
        else
            echo "Can not determine image version"
            exit -1
        fi
    fi


    echo "Creating docker container using $HW_IMAGE_NAME:$HW_IMAGE_VERSION image"
    docker run -d -p $HW_PORT:8080 \
        --volume $HW_HOME/db:/var/lib/mysql \
        --volume $HW_HOME/repository:/opt/hw/repository \
        --volume $HW_HOME/conf:/opt/hw/conf \
        --volume $HW_HOME/keys:/opt/hw/keys \
        --volume $HW_HOME/logs:/opt/hw/logs \
        --volume $HW_HOME/tomcat-logs:/opt/tomcat/logs \
        $HW_IMAGE_NAME:$HW_IMAGE_VERSION
}

stop() {
    echo "Terminating docker containers based on $HW_IMAGE_NAME image"
    CONTAINERS=$(docker ps -a | grep $HW_IMAGE_NAME | cut -d " " -f 1)

    if [ -n "$CONTAINERS" ]; then
        docker rm -f $CONTAINERS
    else
        echo "No containers found"
    fi
}

case $1 in
    start ) start ;;
    stop ) stop  ;;
    * ) echo "usage: docker.sh [start/stop]"; exit -1 ;;

esac