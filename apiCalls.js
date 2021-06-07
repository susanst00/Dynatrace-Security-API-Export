const fetch = require('node-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

exports.makeAPICall = async (url) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': '*/*',
            'Access-Control-Allow-Origin': '*',
            'Accept-Encoding': "gzip,deflate,br",
            'Connection': 'keep-alive',
            'Authorization': `${process.env.PROD_TOKEN}`
        },
        agent: httpsAgent
    }).catch(e => console.error(e));
    return response.json();
};

exports.makeAPICallNonProd = async (url) => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': '*/*',
            'Access-Control-Allow-Origin': '*',
            'Accept-Encoding': "gzip,deflate,br",
            'Connection': 'keep-alive',
            'Authorization': `${process.env.NONPROD_TOKEN}`
        },
        agent: httpsAgent
    }).catch(e => console.error(e));
    return response.json();
};


