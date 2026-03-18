import { FetchWithRetryResult } from "../types";
import { fetchWithRetry } from "../utilities";

export async function AllFiles(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    date = ""
): Promise<any> {

    let apiCallCount = 0;

    const WAIT_AFTER_CALLS = 20;
    const DELAY_MS = 10_000;

    const sleep = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

    const fetchAllFiles = async (
  
    ): Promise<any> => {

        apiCallCount++;

        if (apiCallCount % WAIT_AFTER_CALLS === 0) {
            console.warn(
                `Waiting 10 seconds after ${apiCallCount} API calls to avoid rate limits.`
            );
            await sleep(DELAY_MS);
        }

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/folders/dailyExtract/folders/${date}/files`;

        const res: FetchWithRetryResult = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            ""
        );        

        return res.data?.files?.items;
;
    };

  
    return fetchAllFiles();
}