const converter = require('../utils/jsonToCSV');
const apiCalls = require('../apiCalls');


exports.getSecurityProblems = async (req, res) => {
    const { securityProblems } = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems?pageSize=500`, process.env.TOKEN);

    const DateFixed = securityProblems.map(problem => {
        const firstSeenTimestampReplaced = new Date(problem.firstSeenTimestamp).toString();
        const lastUpdatedTimestampReplaced = new Date(problem.lastUpdatedTimestamp).toString();

        problem.firstSeenTimestamp = firstSeenTimestampReplaced;
        problem.lastUpdatedTimestamp = lastUpdatedTimestampReplaced;

        return problem;
    })
    //To send the JSON uncomment this line
    // return res.send(securityProblems);

    // To Send the CSV File
    const converted = converter.JSONToCSVConvertor(DateFixed, "SecurityProblems", true);
    return res.send(converted);
}


async function getEntities(type /* string */) {
    let nextpagekey;
    let entities = [];
    const params = `pageSize=4000&entitySelector=TYPE(${type})`;
    do {
        let data = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/entities?${nextpagekey ? `nextPageKey=${nextpagekey}` : params}`, process.env.TOKEN);
        entities = entities.concat(data.entities);
        nextpagekey = data.nextPageKey;
    }
    while(nextpagekey);
    return entities;
}

async function getSecurityProblems() {
    let nextpagekey;
    let secProblems = [];
    const params = `?pageSize=500`;
    do {
        let data = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems${nextpagekey ? `?nextPageKey=${nextpagekey}` : params}`, process.env.TOKEN);
        secProblems = secProblems.concat(data.securityProblems);
        nextpagekey = data.nextPageKey;
    }
    while(nextpagekey);
    return secProblems;
}

exports.getDetailedSecurityProblems = async (req, res) => {
    const securityProblems = await getSecurityProblems();

    // WHY DOES the security API work for all problems with a + but when you run the get an individual security problem, it needs to be URL encoded? 
    const securityDetails = await Promise.all(
        securityProblems.map(async (problem) => {
            // const allDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems/${problem.securityProblemId}?fields=+riskAssessment,+vulnerableComponents,+managementZones,+affectedEntities,+exposedEntities,+reachableDataAssets,+relatedEntities,+relatedContainerImages`, process.env.TOKEN)
            const allDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems/${problem.securityProblemId}?fields=%2BriskAssessment%2C%2BmanagementZones%2C%2BvulnerableComponents%2C%2BaffectedEntities%2C%2BexposedEntities%2C%2BreachableDataAssets%2C%2BrelatedEntities%2C%2BrelatedContainerImages%2C%2BrelatedAttacks`, process.env.TOKEN)
            return allDetails;
        }));

    const critical = securityDetails;
    // const critical = securityDetails.filter(sProblem => sProblem.riskAssessment.riskLevel == "CRITICAL" || sProblem.riskAssessment.riskLevel == "HIGH");
    // const critical = securityDetails.filter(sProblem => sProblem.riskAssessment.riskLevel == "CRITICAL");
    const sorted = critical.sort((a, b) => b.riskAssessment.riskScore - a.riskAssessment.riskScore);
    
    const entityNameMap = {};

    let p_pgi = getEntities("PROCESS_GROUP_INSTANCE");

    let p_host = getEntities("HOST");
    let p_service = getEntities("SERVICE");
    let p_application = getEntities("APPLICATION");
    let p_cApplication = getEntities("CUSTOM_APPLICATION");
    let p_mApplication = getEntities("MOBILE_APPLICATION");
    
    let entityList = [
        ...(await p_mApplication),
        ...(await p_cApplication),
        ...(await p_application),
        ...(await p_host),
        ...(await p_service),
        ...(await p_pgi)
    ];

    entityList.forEach(e => entityNameMap[e.entityId] = e.displayName);

    // return res.send(critical);
    // replace Process-Group-Instance-ID with Display Name
    const namedVulnerableEntities = await Promise.all(
        sorted.map(async (problem) => {
            
            const vulnerableComponentsReplaced = problem.vulnerableComponents.map((pgi) => {
                return pgi.displayName;
            });



            const affectedEntitiesReplaced = problem.affectedEntities.map(e => entityNameMap[e]);
  
            problem.affectedEntities = problem.affectedEntities || [];
            problem.relatedEntities = problem.relatedEntities || {};
            problem.relatedEntities.applications = problem.relatedEntities.applications || [];
            problem.relatedEntities.services = problem.relatedEntities.services || [];
            problem.relatedEntities.hosts = problem.relatedEntities.hosts || [];
            problem.relatedEntities.databases = problem.relatedEntities.databases || [];
            problem.managementZones = problem.managementZones || [];
            problem.exposedEntities = problem.exposedEntities || [];
            problem.reachableDataAssets = problem.reachableDataAssets || [];

            const reachableDataAssetsReplaced = problem.affectedEntities.map(e => entityNameMap[e]);
            const relatedEntitiesAppIdReplaced = problem.relatedEntities.applications.map(e => entityNameMap[e.id]);
            const relatedEntitiesServicesReplaced = problem.relatedEntities.services.map(e => entityNameMap[e.id]);
            const relatedEntitiesHostsReplaced = problem.relatedEntities.hosts.map(e => entityNameMap[e.id]);
            const relatedEntitiesDatabasesReplaced = problem.relatedEntities.databases.map(e => entityNameMap[e]);
            const managementZonesReplaced = problem.managementZones.map(e => e.name);
            const exposedEntitiesReplaced = problem.exposedEntities.map(e => entityNameMap[e]);

            problem["Risk Level"]       = problem.riskAssessment.riskLevel;
            problem["Base Risk Score"]  = problem.riskAssessment.baseRiskScore;
            problem["Base Risk Level"]  = problem.riskAssessment.baseRiskLevel;
            problem["Davis Risk Score"] = problem.riskAssessment.riskScore;
            problem["Public Exposure"]  = problem.riskAssessment.exposure;
            problem["Sensitive Data Assets"] = problem.riskAssessment.dataAssets;
            problem["Vulnerable Function Usage"] = problem.riskAssessment.vulnerableFunctionUsage;

            delete problem.riskAssessment;

            problem["Management Zones"]      = managementZonesReplaced;
            problem["Vulnerable Components"] = vulnerableComponentsReplaced;
            problem["Reachable Data Assets"] = reachableDataAssetsReplaced;
            problem["Affected Entities"]     = affectedEntitiesReplaced;
            problem["Exposed Entities"]     = exposedEntitiesReplaced;
            delete problem.exposedEntities
            delete problem.affectedEntities;
            delete problem.vulnerableComponents;
            delete problem.managementZones;
            delete problem.reachableDataAssets;


            // This is to fix it in excel. 
            relatedEntitiesAppIdReplaced.length     > 1 ? problem["Related Applications"] = relatedEntitiesAppIdReplaced : null;
            relatedEntitiesServicesReplaced.length  > 1 ? problem["Related Services"] = relatedEntitiesServicesReplaced : null;
            relatedEntitiesHostsReplaced.length     > 1 ? problem["Related Hosts"] = relatedEntitiesHostsReplaced : null;
            relatedEntitiesDatabasesReplaced.length > 1 ? problem["Related Databases"] = relatedEntitiesDatabasesReplaced : null;
            delete problem.relatedEntities;

            //for excel, comment out in web view
            // const eventsReplaced = problem.events.map(each => {
            //     // problem["Event - Problem Reason"]= problem.reason;
            //     // problem["Event - Number of Affected Entities"]= problem.riskAssessmentSnapshot.numberOfAffectedEntities;
            //     // problem["Event - Public Exploit Available"]= problem.riskAssessmentSnapshot.publicExploit;
            //     // problem["Event - External Exposure"]= problem.riskAssessmentSnapshot.exposure;
            //     // problem["Event - Number of Reachable Data Assets"]= problem.riskAssessmentSnapshot.numberOfReachableDataAssets;
            //     var problemEvent = "Event Reason: " + each.reason;
            //     problemEvent += ", Number Of Affected Entities: " + each.riskAssessmentSnapshot.numberOfAffectedEntities
            //     problemEvent += ", Public Exploit Available: " + each.riskAssessmentSnapshot.publicExploit;
            //     problemEvent += ", External Exposure: " + each.riskAssessmentSnapshot.exposure;
            //     problemEvent += ", Number Of Sensitive Data Assets Affected: " + each.riskAssessmentSnapshot.numberOfReachableDataAssets;

            //     return problemEvent;
            // });
            // problem.events = eventsReplaced;

            const firstSeenTimestampReplaced = new Date(problem.firstSeenTimestamp).toString();
            const lastUpdatedTimestampReplaced = new Date(problem.lastUpdatedTimestamp).toString();

            problem.firstSeenTimestamp = firstSeenTimestampReplaced;
            problem.lastUpdatedTimestamp = lastUpdatedTimestampReplaced;

            if (problem.relatedContainerImages == undefined) {
                problem.relatedContainerImages = { "containerImages": [] };
            }

            const relatedContainerImagesReplaced = await Promise.all(problem.relatedContainerImages.containerImages.map(async (pg) => {
                return pg.imageName;
            }));
            problem.relatedContainerImages = relatedContainerImagesReplaced;


           
            problem["Related Container Images"] = problem.relatedContainerImages;
            delete problem.relatedContainerImages;

            return problem;
        })
    );

    // uncomment this line if you want the JSON in the browser
    return res.send(namedVulnerableEntities);

    const final = converter.JSONToCSVConvertor(namedVulnerableEntities, "SecurityProblemDetails", true);
    res.send(final)
}