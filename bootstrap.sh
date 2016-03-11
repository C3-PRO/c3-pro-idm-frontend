#!/usr/bin/env bash

# Set the proxy to enable http connections from the VM
# Only enable the line if inside BCH, or replace proxy properly
# export http_proxy=http://proxy.tch.harvard.edu:3128

# Install basic tools
sudo apt-get clean
sudo apt-get update
sudo apt-get -y install unzip
sudo apt-get -y install nodejs
sudo apt-get -y install npm
sudo apt-get -y install nodejs-legacy
/vagrant/idm/npm install
