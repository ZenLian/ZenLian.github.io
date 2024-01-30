#!/bin/bash

#IPADDRESS=$(ifconfig eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)
IPADDRESS=$(ip a s eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)

echo $IPADDRESS
zola serve -i $IPADDRESS -u $IPADDRESS
#hugo server --bind $IPADDRESS --baseURL=http://$IPADDRESS
