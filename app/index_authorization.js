import express from "express";
import { getServices, readServices } from "@sap/xsenv";
import axios from "axios";
import passport from "passport";
import { JWTStrategy } from "@sap/xssec";
import jwt_decode from 'jwt-decode';

import { checkPerformScope, checkReadScope } from "./utils.mjs";

const app = express();
let PORT = process.env.PORT || 8888;
let destName = process.env.DEST || "sdlocalnode1";

app.use(express.json());

let services, connServ, destServ, xsuaaServ;

//destination service
let destServClientId, destServClientSecret, destinationAccessToken, destinationServiceUrl, destinationConfiguration;

// connectivity service
let onPremProxyHost, onPremProxyPort, connServClientId, connServClientSecret, connectivityAccessToken;

// xsuaa service
let xsuaaUrl;

if(process.env.NODE_ENV === "production") { // this checks if we are running on BTP
    // ----- authentication code start -----
    passport.use(new JWTStrategy(getServices({uaa: {tag: "xsuaa"}}).uaa));

    app.use(passport.initialize());
    app.use(passport.authenticate('JWT', {session: false}));
    // ----- authentication code end -----

    services = readServices();
    
    // fetch service instances binding information
    connServ = getServices({connectivity: {name: "conn-dev"}}).connectivity;
    destServ = getServices({destination: {name: "dest-dev"}}).destination;
    xsuaaServ = getServices({xsuaa: {name: "xsuaa-dev"}}).xsuaa;

    // fetch on-prem connection parameters from connectivity service
    onPremProxyHost = connServ["onpremise_proxy_host"];
    onPremProxyPort = connServ["onpremise_proxy_http_port"];

    // destination service auth parameters
    destServClientId = destServ["clientid"];
    destServClientSecret = destServ["clientsecret"];
    destinationServiceUrl = destServ["uri"];

    // connectivity service auth params
    connServClientId = connServ["clientid"];
    connServClientSecret = connServ["clientsecret"];

    xsuaaUrl = xsuaaServ["url"];
}

app.get("/", (req, res) => {
    console.log("Got request", req.url);
    res.send("Hola");
});

app.get("/services", (req, res) => {
    if(services) {
        res.send(services);
    } else {
        res.send("No services found");
    }
});

app.get("/validate", (req, res) => {
    res.send(validateConfig());
});

app.get("/destToken", async (req, res) => {
    if(validateConfig().valid) {
        let at = await getDestinationServiceAccessToken();
        res.send(at);
    } else {
        res.send("Configuration not valid. Check with /validate");
    }
});

app.get("/connToken", async (req, res) => {
    if(validateConfig().valid) {
        let at = await getConnectivityServiceAccessToken();
        res.send(at);
    } else {
        res.send("Configuration not valid. Check with /validate");
    }
});

app.get("/destConfig", async (req, res) => {
    if(validateConfig().valid) {
        await getDestinationServiceAccessToken();
        let at = await getDestinationConfiguration();
        res.send(at);
    } else {
        res.send("Configuration not valid. Check with /validate");
    }
});

app.get("/getAllOnPremRecords", checkReadScope, async (req, res) => {
    if(validateConfig().valid) {
        await getDestinationServiceAccessToken();
        await getConnectivityServiceAccessToken();
        await getDestinationConfiguration();
        
        try {
            let onPremData = await getAllOnPremRecords();
            res.send(onPremData);
        } catch(e) {
            res.send(e);
        }
    } else {
        res.send("Configuration not valid. Check with /validate");
    }
});

app.get("/readPerm", checkReadScope, async (req, res) => {
    res.send("You have read permissions. You can read data.");
});

app.get("/doPerm", checkPerformScope, async (req, res) => {
    res.send("You have doing permissions. You can create / update / delete data.");
});

app.post("/addNewRecord", checkPerformScope, async (req, res) => {
    if(validateConfig().valid) {
        await getDestinationServiceAccessToken();
        await getConnectivityServiceAccessToken();
        await getDestinationConfiguration();

        let reqBody = req.body;
        
        try {
            let onPremData = await createNewRecord(reqBody);
            res.send(onPremData);
        } catch(e) {
            res.send(e);
        }
    } else {
        res.send("Configuration not valid. Check with /validate");
    }
});

app.get("/env", (req, res) => {
    res.send(process.env);
});

app.get("/auth", (req, res) => {
    // console.log(JSON.stringify(req));
    res.send({
        user: req.user,
        appToken: req.authInfo.getAppToken(),
        tokenDecode: jwt_decode(req.authInfo.getAppToken())
    });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

function validateConfig() {
    if(onPremProxyHost && onPremProxyPort && destServClientId && 
        destServClientSecret && connServClientId && connServClientSecret && xsuaaUrl) {
            return {
                msg: "All is well",
                valid: true,
                onPremProxyHost,
                onPremProxyPort,
                destServClientId,
                destServClientSecret,
                connServClientId,
                connServClientSecret,
                xsuaaUrl
            };
        } else {
            return {
                msg: "All is not well",
                valid: false,
                onPremProxyHost,
                onPremProxyPort,
                destServClientId,
                destServClientSecret,
                connServClientId,
                connServClientSecret,
                xsuaaUrl
            };
        }
}

async function getDestinationServiceAccessToken() {
    let tokenUrl = xsuaaUrl + "/oauth/token?grant_type=client_credentials";

    const tokenResponse = await axios.post(tokenUrl, null, {
        headers: {
            Authorization: "Basic " + Buffer.from(destServClientId + ":" + destServClientSecret).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    destinationAccessToken = tokenResponse.data.access_token;

    return tokenResponse.data;
}

async function getConnectivityServiceAccessToken() {
    let tokenUrl = xsuaaUrl + "/oauth/token?grant_type=client_credentials";

    const tokenResponse = await axios.post(tokenUrl, null, {
        headers: {
            Authorization: "Basic " + Buffer.from(connServClientId + ":" + connServClientSecret).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    connectivityAccessToken = tokenResponse.data.access_token;

    return tokenResponse.data;
}

async function getDestinationConfiguration() {
    // reference the destination config by its name - sdlocalnode1
    let destConfigUrl = destinationServiceUrl + "/destination-configuration/v1/destinations/" + destName;

    const destConfig = await axios.get(destConfigUrl, {
        headers: {
            Authorization: "Bearer " + destinationAccessToken
        }
    });

    destinationConfiguration = destConfig.data["destinationConfiguration"];

    return destConfig.data;
}

async function getAllOnPremRecords() {
    const sourceResponse = await axios({
        method: "GET",
        url: destinationConfiguration["URL"] + "/db/users",
        headers: {
            "Proxy-Authorization": "Bearer " + connectivityAccessToken,
            "SAP-Connectivity-SCC-Location_ID": destinationConfiguration["CloudConnectorLocationId"]
        },
        proxy: {
            host: onPremProxyHost,
            port: onPremProxyPort
        }
    });

    return sourceResponse.data;
}

async function createNewRecord(userData) {
    const sourceResponse = await axios({
        method: "POST",
        url: destinationConfiguration["URL"] + "/db/create/" + userData.type,
        headers: {
            "Proxy-Authorization": "Bearer " + connectivityAccessToken,
            "SAP-Connectivity-SCC-Location_ID": destinationConfiguration["CloudConnectorLocationId"]
        },
        data: userData,
        proxy: {
            host: onPremProxyHost,
            port: onPremProxyPort
        }
    });

    return sourceResponse.data;
}