# C3PRO-IDM-FRONTEND #

C3PRO-IDM-FRONTEND is a web-based application that implements a simple Identity and Demographics Manager system for myC3PRO project. It's used to send enrollment invitations to subjects using the mobile iOS app and to link the invitation with the SSSID. 

The system manages PHI data, and it's supposed to run in a site's intranet. The system does not access directly any database. Data access is wrapped through [C3PRO-IDM_SERVICE](https://bitbucket.org/ihlchip/c3pro-idm-service) system, which publishes a secured API for this purpose.

# Configuration and Deployment #

## Dependencies ##

[C3PRO-IDM_SERVICE](https://bitbucket.org/ihlchip/c3pro-idm-service): A server deploying this system is needed. The access to C3PRO-IDM_SERVICE api methods can be configured through the config files of the project. See below.

## Installing Node.js ##

The system runs on **Node.js** and uses **npm** to start the server. To install the basic tools in a Debian-based Linux distribution: 

    sudo apt-get clean
    sudo apt-get update
    sudo apt-get -y install nodejs
    sudo apt-get -y install npm
    sudo apt-get -y install nodejs-legacy

## Installing Node.js dependencies ##

The following command installs all the packages listed in **idm/package.json**

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

## Deployment modes ##

The system can be deployed in the following environments: *test*, *dev*, *qa*, *prod*. It is determined by the value of the system environment variable *NODE_ENV*. For instance, to run the server in production:

```
#!shell
$PROJECT_HOME/idm/export NODE_ENV=prod
$PROJECT_HOME/idm/npm start
```

If *NODE_ENV* is not defined, the application runs in *dev*.
For development purposes, you may want to use **supervisor** to run the app so it gets restarted automatically when you save files.

```
#!shell
cd $PROJECT_HOME/idm
supervisor app.js
```

## Property files

Properties for each environment are defined in the following json files:

    $PROJECT_HOME/idm/config.dev.json
    $PROJECT_HOME/idm/config.qa.json
    $PROJECT_HOME/idm/config.prod.json

They specify the host, port, http protocol and end points of the C3PRO-IDM-SERVICE api methods. 

## The test environment

This environment uses mock services and does not require access to C3PRO-IDM-SERVICE. Is it useful   for purely front-end tests and fast demos. The data that appears there is written in static files in the following locations:

    $PROJECT_HOME/idm/services/testSubjects.json
    $PROJECT_HOME/idm/services/testSubject.json

To run in such environment:

```
#!shell
$PROJECT_HOME/idm/export NODE_ENV=test
$PROJECT_HOME/idm/npm start
```

To access the web app: [http://localhost:8080](http://localhost:8080)

The login is also mocked. Whatever login will be acceptable.
