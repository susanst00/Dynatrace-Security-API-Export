const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

exports.makeAPICall = async (url, token) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': '*/*',
            'Access-Control-Allow-Origin': '*',
            'Accept-Encoding': "gzip,deflate,br",
            'Connection': 'keep-alive',
            'Authorization': token
        },
        agent: httpsAgent
    }).catch(e => console.error(e));
    // return response;
    return response.json();
};


