import { getOAuthToken } from "../oauthTokenService";
import { fetchWithRetry } from "../utilities";

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
    token: string=""

): Promise<{ token: string; data: any }> {

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/activities/${Number(activityId)}/`;

    console.log(`➡️ Fetching activity by ID: ${url}`);

    const response = await fetchWithRetry(url, clientId, clientSecret, instanceUrl, token);

    return    response;

}
