#!/bin/bash

export ORACLE_HOME=/u02/app/oracle/product/19.3.0/dbhome_1
export ORACLE_SID=apexdb19c
export LD_LIBRARY_PATH=$ORACLE_HOME/lib
export PATH=/u01/soft/node18/bin:$ORACLE_HOME/bin:$PATH

cd /opt/chat-server || exit 1

pm2 describe chat-server >/dev/null 2>&1

if [ $? -eq 0 ]; then
pm2 restart chat-server --update-env
else
pm2 start server.js --name chat-server
fi