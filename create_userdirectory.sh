#!/bin/bash

U=$1

btrfs subvolume create /home/$U
cp -ar /etc/skel/. /home/$U
chown -R $U:$U /home/$U
chmod 750 /home/$U
