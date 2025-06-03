#!/bin/bash

NETINTF=${1:-eth0}
IPADDRESS=$(ip a s ${NETINTF} | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)

echo $IPADDRESS
zola serve -i $IPADDRESS -u $IPADDRESS
#hugo server --bind $IPADDRESS --baseURL=http://$IPADDRESS
