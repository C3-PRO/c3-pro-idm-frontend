# C3PRO-IDM-FRONTEND #

C3PRO-IDM-FRONTEND is a web-based application that implements a simple Identity and Demographics Manager system for myC3PRO project. It's used to send enrollment invitations to patients using the mobile iOS app and to link the invitation with the patient's sssid. 

The system manages PHI data, and it's supposed to run in a site's intranet. The system does not access directly any database. Data access is wrapped through [C3PRO-IDM_SERVICE](https://bitbucket.org/ihlchip/c3pro-idm-service) system, whiCH publishes a secured API for this purpose.

# Configuration and Deployment #

## Dependencies ##

[C3PRO-IDM_SERVICE](https://bitbucket.org/ihlchip/c3pro-idm-service): A server deploying this system is needed. The access to C3PRO-IDM_SERVICE api methods can be configured through the config files of the project. See below.

## Installing Node.js ##

The system runs on *Node.js* and uses *npm* to start the server. To install the basic tools in a Debian-based Linux distribution: 

    sudo apt-get clean
    sudo apt-get update
    sudo apt-get -y install nodejs
    sudo apt-get -y install npm
    sudo apt-get -y install nodejs-legacy

## Installing Node.js dependencies ##

The following command installs all the packages listed in *idm/package.json*

```
#!shell
$PROJECT_HOME/idm/npm install
```

## Starting the server ##

The following command starts the web server on port 8080

```
#!shell
$PROJECT_HOME/idm/npm start
```