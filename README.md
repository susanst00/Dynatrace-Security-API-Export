# Security API Work

## How to get this working?

Well first, you need to rename the variables.env.sample file to variables.env. This is an important step as I wanted to ensure that the sample variable file is saved and accessible to github without uploading the real file and exposing sensitive data. Note that within the .gitignore file, there is a line for .env, this will ensure that once you rename your file to variables.env, it will not be tracked by github and will not be posted to the Repository.

From within the variables file it should look as this:

```
PROD=https://YourProdTenantURLHere.com
PROD_TOKEN=""

NON_PROD=https://YourNonProdTenantURLHere.com
NONPROD_TOKEN=""
```

###### *Note: The Token must be within Quotes and include the "Api-Token dt...xxxxxxxxxxx" format, but the Tenant URL should NOT include quotes around it.*


Currently this is just a preview program to export data using the new Dynatrace Security API

## Building Upon This App

To build upon this program, you can add additional controllers, ideally you have a controller for each section of control of the API, allowing for easy segregation of code.

## Requests that are not a GET Request

Currently, within the apiCalls file, is where the headers are generated for API calls. The Method is set to GET. If additional API calls are to be made for POST requests etc, you will have to modify the code. Future implementations may consist of passing the request type in as a parameter to the method, but for now, the focus is on getting the data to export and not making changes with this program.
