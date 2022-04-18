# Useful CLI Commands for SAP BTP

###### Deploy xs-security.json
cf create-service xsuaa <service_plan> <service_instance_name> -c security/xs-security.json
cf update-service xsuaa <service_plan> <service_instance_name> -c security/xs-security.json

###### Deploy an app by providing manifest path
cf push -f <path to manifest file>