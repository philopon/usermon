#!/bin/bash -e

U=$1

zfs create tank1/home/$U
cp -ar /etc/skel/. /home/$U
chown -R $U:$U /home/$U
chmod 750 /home/$U
