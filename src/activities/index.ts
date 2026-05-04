import { getOAuthToken } from "../oauthTokenService";
import { fetchWithRetry, getLast90DaysChunks } from "../utilities";
// Validate YYYY-MM-DD format
const isValidDate = (date: string): boolean =>
    /^\d{4}-\d{2}-\d{2}$/.test(date);

/**
 * Fetches all activities from the OFSC instance.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} [q] - The query string to filter activities.
 * @param {string} [resources] - The resources to filter activities by. Required.
 * @param {string} [fields] - The fields to include in the response.
 * @param {string} [dateFrom] - The date from which to filter activities.
 * @param {string} [dateTo] - The date to which to filter activities.
 * @returns {Promise<any[]>} A promise which resolves to an array of activity objects.
 * @throws {Error} If the date format is invalid or if the resources parameter is missing.
 */
export async function getAllActivities(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    resources: string,
    dateFrom: string,
    dateTo: string,
    q?: string,
    fields?: string,
    includeNonScheduled: boolean = false
): Promise<any[]> {

    // Validate date inputs
    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
        throw new Error(`❌ Invalid date format. Expected YYYY-MM-DD.`);
    }

    let limit = 1000;
    let offset = 0;

    const allItems: any[] = [];

    // Prepare reusable token
    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    while (true) {
        // Build URL cleanly
        const params = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (q) params.append("q", q);
        if (resources) params.append("resources", resources);
        if (fields) params.append("fields", fields);
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (includeNonScheduled) params.append("includeNonScheduled", "true");

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/?${params.toString()}`;
        console.error(url);

        console.log(`➡️ Fetching offset=${offset}, limit=${limit}`);

        const response = await fetchWithRetry(url, clientId, clientSecret, instanceUrl, token);

        const data = response.data;

        if (!data.items || data.items.length === 0) {
            console.log("✔ No more items found. Stopping pagination.");
            break;
        }

        allItems.push(...data.items);
        console.log(`   ✔ Received ${data.items.length} items (Total: ${allItems.length})`);
        limit = data.limit;
        offset += limit;
    }

    return allItems;
}

export async function getActivitybyId(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    activityId: number,
    token: string = ""

): Promise<{ token: string; data: any }> {

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}/`;

    console.log(`➡️ Fetching activity by ID: ${url}`);

    const response = await fetchWithRetry(url, clientId, clientSecret, instanceUrl, token);

    return response;

}



type ActivityResponse = {
    data: any[];
    token: string;
};

const buildUrl = (
    instanceUrl: string,
    endpoint: string,
    params: Record<string, string | boolean>
) => {
    const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
        }, {} as Record<string, string>)
    );

    return `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/${endpoint}?${query}`;
};

export async function searchActivitybyQueryParameter(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    parentResources: string,
    q: string,
    fields: string,
    token: string = ""
): Promise<ActivityResponse> {
    const result: ActivityResponse = {
        data: [],
        token: ""
    };

    const dateRanges = getLast90DaysChunks();

    console.log(`Date chunks: ${JSON.stringify(dateRanges, undefined, 2)}`);

    for (const { start, end } of dateRanges) {
        const url = buildUrl(instanceUrl, "activities", {
            q,
            resources: parentResources,
            dateFrom: start,
            dateTo: end,
            fields:fields
        });
        console.log(`➡️ Fetching activity ${q} by query(Scheduled): ${url}`);
        const response = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        token = response.token;

        const items = response?.data?.items ?? [];

        if (items.length > 0) {
            result.data.push(...items);
            result.token = response.token;
            return result;
        }
    }
    
    const nonScheduledUrl = buildUrl(instanceUrl, "activities", {
        q,
        resources: parentResources,
        includeNonScheduled: true,
        fields:fields
    });
    console.log(`➡️ Fetching activity ${q} by query(NonScheduled): ${nonScheduledUrl}`);

    const nonScheduledResponse = await fetchWithRetry(
        nonScheduledUrl,
        clientId,
        clientSecret,
        instanceUrl,
        token
    );
    token = nonScheduledResponse.token;
    const nonScheduledItems = nonScheduledResponse?.data?.items ?? [];

    result.token = nonScheduledResponse.token;
    if (nonScheduledItems.length > 0) {
        result.data.push(...nonScheduledItems);
        result.token = nonScheduledResponse.token;
    }

    return result;
}


