import { FetchWithRetryResult, ResourceResponse } from "../types";
import { fetchWithRetry, patchWithRetry } from "../utilities";
/**
 * Fetches all resources from the OFSC instance.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} [initialToken] - The OAuth token to use. If not provided, a new token will be fetched.
 *
 * @returns {Promise<any[]>} A promise which resolves to an array of resource objects.
 */
export async function AllResources(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    initialToken = ""
): Promise<any[]> {

    /**
     * The number of API calls made so far.
     * Used to determine if we should wait 10 seconds to avoid server rate limits.
     */
    let apiCallCount = 0;

    /**
     * The number of API calls after which we should wait 10 seconds.
     */
    const WAIT_AFTER_CALLS = 20;

    /**
     * The delay in milliseconds to wait after reaching the API call limit.
     */
    const DELAY_MS = 10_000; // 10 seconds

    /**
     * Sleeps for the given amount of milliseconds.
     *
     * @param {number} ms - The amount of milliseconds to sleep.
     * @returns {Promise<void>} A promise which resolves when the sleep is over.
     */
    const sleep = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Fetches resources from the OFSC instance.
     *
     * @param {number} offset - The offset from which to fetch resources.
     * @param {string} token - The OAuth token to use.
     * @returns {Promise<ResourceResponse[]>} A promise which resolves to an array of resource responses.
     */
    const fetchResources = async (
        offset: number,
        token: string
    ): Promise<ResourceResponse[]> => {
        apiCallCount++;

        // Wait 10 seconds after 20 API calls to avoid server rate limits.
        if (apiCallCount % WAIT_AFTER_CALLS === 0) {
            console.warn(` Waiting 10 seconds after ${apiCallCount} API calls to avoid server rate limits.`);
            await sleep(DELAY_MS);
        }

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/?offset=${offset}&limit=100`;

        const res: FetchWithRetryResult = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );

        const { items, totalResults } = res.data;
        const totalFetched = items.length;

        console.log(`Received ${totalFetched} items (Total: ${offset + totalFetched})`);

        if (offset + totalFetched >= totalResults) {
            return items;
        }

        const nextItems = await fetchResources(
            offset + totalFetched,
            res.token
        );

        return [...items, ...nextItems];
    };

    return fetchResources(0, initialToken);
}
/**
 * Updates a resource with the given payload.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} resourceId - The ID of the resource to update.
 * @param {any} payload - The data to update the resource with.
 * @param {string} [token] - The OAuth token to use. If not provided, a new token will be fetched.
 * @returns {Promise<any>} A promise which resolves to the updated resource data.
 */
export async function updateResource(clientId: string, clientSecret: string, instanceUrl: string, resourceId: string, payload: any, token: string = ""): Promise<any> {

    return patchWithRetry(
        `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/${resourceId}`,
        clientId,
        clientSecret,
        instanceUrl,
        token,
        payload
    );
}

/**
 * Resets the email addresses of all resources to the given domain.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} [newdomain] - The new domain to update the resource emails to. Defaults to "noreply".
 * @param {string} [token] - The OAuth token to use. If not provided, a new token will be fetched.
 * @returns {Promise<any[]>} A promise which resolves to an array of objects containing the resource ID, original email, new email, and a comment.
 */
export async function resetResourcesEmail(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    newdomain: string = "noreply.com",
    token: string = ""
): Promise<any[]> {

    const resources = await AllResources(
        clientId,
        clientSecret,
        instanceUrl,
        token
    );

    const resourcesWithEmails = resources.filter(
        (resource: any) => resource.email
    );

    const updatedResources: any[] = [];

    const BATCH_SIZE = 200; // Update in batches of 200 to avoid server rate limits
    const DELAY_MS = 10_000; // Wait 10 seconds between batches

    for (let i = 0; i < resourcesWithEmails.length; i += BATCH_SIZE) {
        const batch = resourcesWithEmails.slice(i, i + BATCH_SIZE);

        for (const resource of batch) {
            console.log(`Total : ${resourcesWithEmails.length}`, `Total updated: ${updatedResources.length}`);

            if (!resource.email) continue;

            if (!resource.resourceId) {
                console.warn(`⚠️ Resource ID not found for ${JSON.stringify(resource)}`);
                continue;
            }

            let email = resource.email;

            if (!email.includes("@")) {
                email = email.replace(newdomain, `@${newdomain}`);
            }

            if (email.includes(newdomain)) {
                updatedResources.push({
                    id: resource.resourceId,
                    email: resource.email,
                    newEmail: "",
                    comment: "Email already updated"
                });

                continue;
            }

            email = resource.email.replace(/@.*/, `@${newdomain}`);

            console.log(`Updating email for ${resource.resourceId} (${resource.email} -> ${email}) on ${instanceUrl}`);
            const payload = {
                email: email
            };
            const response = await updateResource(
                clientId,
                clientSecret,
                instanceUrl,
                resource.resourceId,
                payload,
                token
            );
            token = response.token;
            updatedResources.push({
                id: response.data.resourceId,
                email: resource.email,
                newEmail: response.data.email
            });
        }


        if (i + BATCH_SIZE < resourcesWithEmails.length) {
            console.warn("⏳ Waiting 10 seconds before next batch...to avoid server rate limits.");
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    return updatedResources;
}
