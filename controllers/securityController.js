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

exports.getDetailedSecurityProblems = async (req, res) => {
    const securityProblems = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems?pageSize=500`, process.env.TOKEN);
    const SecurityArray = Object.values(securityProblems);

    // WHY DOES the security API work for all problems with a + but when you run the get an individual security problem, it needs to be URL encoded? 
    const securityDetails = await Promise.all(
        SecurityArray[2].map(async (app) => {
            // const allDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems/${app.securityProblemId}?fields=+riskAssessment,+vulnerableComponents,+managementZones,+affectedEntities,+exposedEntities,+reachableDataAssets`, process.env.TOKEN)
            const allDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/securityProblems/${app.securityProblemId}?fields=%2BriskAssessment%2C%2BmanagementZones%2C%2BvulnerableComponents%2C%2BaffectedEntities%2C%2BexposedEntities%2C%2BreachableDataAssets%2C%2BrelatedEntities%2C%2BrelatedContainerImages%2C%2BrelatedAttacks`, process.env.TOKEN)
            return allDetails;
        }));
    const sorted = securityDetails.sort((a, b) => b.riskAssessment.riskScore - a.riskAssessment.riskScore);

    // replace Process-Group-Instance-ID with Display Name
    const namedVulnerableEntities = await Promise.all(
        sorted.map(async (problem) => {
            const vulnerableComponentsReplaced = await Promise.all(problem.vulnerableComponents.map(async (pgi) => {
                return pgi.displayName;
            }));
            const affectedEntitiesReplaced = await Promise.all(problem.affectedEntities.map(async (entity) => {
                const entityDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v2/entities/${entity}`, process.env.TOKEN);
                return entityDetails.displayName;
            }));

            if (problem.reachableDataAssets == undefined) {
                problem.reachableDataAssets = [];
            }
            const reachableDataAssetsReplaced = await Promise.all(problem.reachableDataAssets.map(async (service) => {
                const serviceDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v1/entity/services/${service}`, process.env.TOKEN);
                return serviceDetails.displayName;
            }));
            const relatedEntitiesAppIdReplaced = await Promise.all(problem.relatedEntities.applications.map(async (appId) => {
                const appDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v1/entity/applications/${appId.id}`, process.env.TOKEN);
                return appDetails.displayName;
            }));
            const relatedEntitiesServicesReplaced = await Promise.all(problem.relatedEntities.services.map(async (service) => {
                const serviceDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v1/entity/services/${service.id}`, process.env.TOKEN);
                return serviceDetails.displayName;
            }));
            const relatedEntitiesHostsReplaced = await Promise.all(problem.relatedEntities.hosts.map(async (hostId) => {
                const hostDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v1/entity/infrastructure/hosts/${hostId.id}`, process.env.TOKEN);
                return hostDetails.displayName;
            }));
            const relatedEntitiesDatabasesReplaced = await Promise.all(problem.relatedEntities.services.map(async (service) => {
                const serviceDetails = await apiCalls.makeAPICall(`${process.env.TENANT_URL}/api/v1/entity/services/${service.id}`, process.env.TOKEN);
                return serviceDetails.displayName;
            }));
            const managementZonesReplaced = await Promise.all(problem.managementZones.map(async (mz) => {
                return mz.name;
            }));

            problem["Risk Level"] = problem.riskAssessment.riskLevel
            problem["Base Risk Score"] = problem.riskAssessment.baseRiskScore
            problem["Davis Risk Score"] = problem.riskAssessment.riskScore
            problem["Public Exposure"] = problem.riskAssessment.exposure
            problem["Sensitive Data Assets"] = problem.riskAssessment.dataAssets
            problem["Vulnerable Function Usage"] = problem.riskAssessment.vulnerableFunctionUsage

            delete problem.riskAssessment;

            problem["Management Zones"] = managementZonesReplaced;
            problem["Vulnerable Components"] = vulnerableComponentsReplaced;
            problem["Reachable Data Assets"] = reachableDataAssetsReplaced;
            problem["Affected Entities"] = affectedEntitiesReplaced;
            delete problem.affectedEntities;
            delete problem.vulnerableComponents;
            delete problem.managementZones;
            delete problem.reachableDataAssets;


            // This is to fix it in excel. 
            relatedEntitiesAppIdReplaced.length > 1 ? problem["Related Applications"] = relatedEntitiesAppIdReplaced : null;
            relatedEntitiesServicesReplaced.length > 1 ? problem["Related Services"] = relatedEntitiesServicesReplaced : null;
            relatedEntitiesHostsReplaced.length > 1 ? problem["Related Hosts"] = relatedEntitiesHostsReplaced : null;
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


            problem["Exposed Entities"] = problem.exposedEntities;
            delete problem.exposedEntities
            problem["Related Container Images"] = problem.relatedContainerImages;
            delete problem.relatedContainerImages;

            return problem;
        }));

    // uncomment this line if you want the JSON in the browser
    // return res.send(namedVulnerableEntities);

    const final = converter.JSONToCSVConvertor(namedVulnerableEntities, "SecurityProblemDetails", true);
    res.send(final)
}