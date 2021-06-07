const converter = require('../utils/jsonToCSV');
const apiCalls = require('../apiCalls');


exports.getSecurityProblems = async (req, res) => {
    const securityProblems = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v2/securityProblems?pageSize=500`);
    res.send(securityProblems);
}

exports.getDetailedSecurityProblems = async (req, res) => {
    const securityProblems = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v2/securityProblems?pageSize=500`);
    const SecurityArray = Object.values(securityProblems);
    const securityDetails = await Promise.all(
        SecurityArray[2].map(async (app) => {
        const allDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v2/securityProblems/${app.securityProblemId}`)
        return allDetails;
    }));
    const sorted = securityDetails.sort((a,b) => b.riskAssessment.riskScore - a.riskAssessment.riskScore);

    // replace Process-Group-Instance-ID with Display Name
    const namedVulnerableEntities = await Promise.all(
        sorted.map(async (problem) => {
        const vulnerabileEntitiesReplaced = await Promise.all(problem.vulnerableEntities.map(async (pgi) => {
            const pgiDetail = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/infrastructure/processes/${pgi}`);
            return pgiDetail.displayName;
        }));
        const vulnerableComponentsReplaced = await Promise.all(problem.vulnerableComponents.map(async (pgi) => {
            const details = await Promise.all(pgi.vulnerableProcesses.map(async id => {
                const pgiDetail = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/infrastructure/processes/${id}`);
                return pgiDetail.displayName;
            }));
            return details;
        }));
        const sensitiveDataAssetsReplaced = await Promise.all(problem.sensitiveDataAssets.map(async (service) => {
            const serviceDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/services/${service}`);
            return serviceDetails.displayName;
        }));
        const affectedEntitiesAppIdReplaced = await Promise.all(problem.affectedEntities.applications.map(async (appId) => {
            const appDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/applications/${appId.id}`);
            return appDetails.displayName;
        }));
        const affectedEntitiesServicesReplaced = await Promise.all(problem.affectedEntities.services.map(async (service) => {
            const serviceDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/services/${service.id}`);
            return serviceDetails.displayName;
        }));
        const affectedEntitiesHostsReplaced = await Promise.all(problem.affectedEntities.hosts.map(async (hostId) => {
            const hostDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/infrastructure/hosts/${hostId.id}`);
            return hostDetails.displayName;
        }));
        const affectedEntitiesDatabasesReplaced = await Promise.all(problem.affectedEntities.services.map(async (service) => {
            const serviceDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/services/${service.id}`);
            return serviceDetails.displayName;
        }));
        const managementZonesReplaced = await Promise.all(problem.managementZones.map(async (mz) => {
            const mzDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/config/v1/managementZones/${mz.id}`);
            return mzDetails.name;
        }));
        
        problem.vulnerableEntities = vulnerabileEntitiesReplaced;
        problem.vulnerableComponents = vulnerableComponentsReplaced;
        problem.sensitiveDataAssets = sensitiveDataAssetsReplaced;
        problem.managementZones = managementZonesReplaced;
        
        //use this for viewing in the web, 
        // problem.affectedEntities.applications = affectedEntitiesAppIdReplaced;
        // problem.affectedEntities.services = affectedEntitiesServicesReplaced;
        // problem.affectedEntities.hosts = affectedEntitiesHostsReplaced;
        // problem.affectedEntities.databases = affectedEntitiesDatabasesReplaced;
        
        // This method is to fix it in excel. Use the above section for viewing in the web nicely.
        problem.affectedEntities = affectedEntitiesAppIdReplaced;
        problem.affectedEntities += affectedEntitiesServicesReplaced;
        problem.affectedEntities += affectedEntitiesHostsReplaced;
        problem.affectedEntities += affectedEntitiesDatabasesReplaced;


        //And this part too for excel view, comment out in web view
        var riskAssessmentReplaced = "Risk Level: " + problem.riskAssessment.riskLevel; 
        riskAssessmentReplaced += ", Base Risk Score: " + problem.riskAssessment.baseRiskScore;
        riskAssessmentReplaced += ", Davis Risk Score: " + problem.riskAssessment.riskScore;
        riskAssessmentReplaced += ", Externally Exposed: " + problem.riskAssessment.exposed;
        riskAssessmentReplaced += ", Sensitive Data Affected: " + problem.riskAssessment.sensitiveDataAffected;
        problem.riskAssessment = riskAssessmentReplaced;

        //for excel, comment out in web view
        const eventsReplaced = problem.events.map( each => {
            var problemEvent = "Event Reason: " + each.reason;
            problemEvent += ", Number Of Affected Processes: " + each.riskAssessmentSnapshot.numberOfAffectedProcesses
            problemEvent += ", Public Exploit Available: " + each.riskAssessmentSnapshot.publicExploitAvailable;
            problemEvent += ", Exposed: " + each.riskAssessmentSnapshot.exposed;
            problemEvent += ", Number Of Sensitve Data Assets Affected: " + each.riskAssessmentSnapshot.numberOfSensitiveDataAssetsAffected;

            return problemEvent;
        });

        const firstSeenTimestampReplaced = new Date(problem.firstSeenTimestamp).toString();
        const lastUpdatedTimestampReplaced = new Date(problem.lastUpdatedTimestamp).toString();
        
        problem.firstSeenTimestamp = firstSeenTimestampReplaced.replace("GMT-0400 (Eastern Daylight Time)", "");
        problem.lastUpdatedTimestamp = lastUpdatedTimestampReplaced.replace("GMT-0400 (Eastern Daylight Time)", "");

        problem.events = eventsReplaced;
        if (problem.affectedContainers == undefined){
            problem.affectedContainers = [];
            
        }
        else {
            const affectedContainersReplaced = await Promise.all(problem.affectedContainers.map(async (pg) => {
                const pgDetails = await apiCalls.makeAPICallNonProd(`${process.env.NON_PROD}/api/v1/entity/infrastructure/process-groups/${pg.id}`);
                return pgDetails.displayName;
            }));
            problem.affectedContainers = affectedContainersReplaced;
        
        }        
        if (problem.affectedContainerImages.containerImages.length < 1){
            problem.affectedContainerImages = [];
        }
        return problem;
    }));

    // res.send(namedVulnerableEntities);

    const final = converter.JSONToCSVConvertor(namedVulnerableEntities, "SecurityDetails", true);
    res.send(final)
}