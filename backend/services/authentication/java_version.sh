#!/bin/bash

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export JAVA_HOME
PATH=${JAVA_HOME}/bin:${PATH}
export PATH
JRE_HOME=/usr/lib/jvm/jre
export JRE_HOME
JAVA_OPTS="-XX:+AggressiveOpts -Xms256m -Xmx512m -XX:MaxPermSize=256m -XX:+DisableExplicitGC"
export JAVA_OPTS
echo "OK"
exec $SHELL -i