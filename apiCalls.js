const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

exports.makeAPICall = async (url, token) => {
    console.log("Trace_ [" + url + "]");
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json,text/csv',
            'Access-Control-Allow-Origin': '*',
            'Accept-Encoding': "gzip,deflate,br",
            'Connection': 'keep-alive',
            'Authorization': token
        },
        agent: httpsAgent
    }).catch(e => console.error(e));
    
    try {
        return response.json();
    }
    catch(ex) {
        console.error("Formatter", ex);
        return null;
    }
};
