# Dynatrace Security API Export
###### Currently this is just a preview program to export data using the new Dynatrace Security API. This is not supported by Dyantrace, but just a personal program I wrote.

## How to get this working?

Well First step is downloading the dependencies. To do so, within the base folder of the project use the terminal to run:
```
npm install
```
This will download the required node packages. There is a very limited amount of packages used, however they are needed for environment variables and protecting sensitve data, along with the framework for supporting the web server.

## Setting Environment Variables

Once dependancies are downloaded, you need to rename the variables.env.sample file to variables.env. This is an **important step** as I wanted to ensure that the sample variable file is saved and accessible to github without uploading the real file and exposing sensitive data. Note that within the .gitignore file, there is a line for .env, this will ensure that once you rename your file to variables.env, it will not be tracked by github and will not be posted to the Repository.

variables.env is specific because within the start.js file, I reference the path to variables.env, this can be modified if you prefer something else but make sure to modify the environment variables file name, along with the configuration setup within start.js. 

From within the variables file it should look as this:

```
PROD=https://YourProdTenantURLHere.com
PROD_TOKEN="Api-Token dt...xxxxxxxxxxx"

NON_PROD=https://YourNonProdTenantURLHere.com
NONPROD_TOKEN="Api-Token dt...xxxxxxxxxxx"
```

###### *Note: The Token must be within Quotes and include the "Api-Token dt...xxxxxxxxxxx" format, but the Tenant URL should NOT include quotes around it.*

## Start It Up
You have downloaded your dependancies, set your environment variables, whats next? Well fire this bad boy up and run the command:
```
npm start
```

This will put a link in the console to the local server being hosted at http://localhost:7777. You can change this port within the start.js file. Click the link to begin.

###### Note: Viewing Security Details CSV may take upwards of 30seconds to a minute to execute. This is because I am looping over what could be hundreds of api calls getting the names of the entities vs reporting some ID that makes no sense to any human.

## Building Upon This App

To build upon this program, you can add additional controllers, ideally you have a controller for each section of control of the API, allowing for easy segregation of code.

## Requests that are not a GET Request

Currently, within the apiCalls file, is where the headers are generated for API calls. The Method is set to GET. If additional API calls are to be made for POST requests etc, you will have to modify the code. Future implementations may consist of passing the request type in as a parameter to the method, but for now, the focus is on getting the data to export and not making changes with this program.


