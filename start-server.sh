#!/bin/bash

IPADDRESS=$(ifconfig eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)
echo $IPADDRESS
hugo server --bind $IPADDRESS --baseURL=http://$IPADDRESS
