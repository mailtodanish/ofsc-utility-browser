import { FetchWithRetryResult, ResourceResponse } from "../types";
import { fetchWithRetry } from "../utilities";

export async function resourcePositionHistoryRange(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    resourceId: string,
    fromDate: string,
    toDate: string,
    initialToken = ""
): Promise<ResourceResponse[]> {

    let apiCallCount = 0;

    const WAIT_AFTER_CALLS = 20;
    const DELAY_MS = 10_000;

    const sleep = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Format date as YYYY-MM-DD (LOCAL, no timezone issues)
     */
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    /**
     * Generate all dates between fromDate and toDate (inclusive)
     */
    const getDatesInRange = (start: string, end: string): string[] => {
        const dates: string[] = [];

        let current = new Date(start);
        const last = new Date(end);

        if (current > last) {
            throw new Error("fromDate cannot be greater than toDate");
        }

        while (current <= last) {
            dates.push(formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    };

    /**
     * Fetch paginated data for a single date
     */
    const fetchByDate = async (
        date: string,
        offset: number,
        token: string
    ): Promise<any> => {

        apiCallCount++;

        // Rate limiting protection
        if (apiCallCount % WAIT_AFTER_CALLS === 0) {
            console.warn(`Waiting 10 seconds after ${apiCallCount} API calls...`);
            await sleep(DELAY_MS);
        }

        console.log(`Calling API for date=${date}, offset=${offset}`);

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/resources/${resourceId}/positionHistory/?date=${date}&offset=${offset}&limit=100`;

        const res: FetchWithRetryResult = await fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token
        );
        token = res.token;
        const { items = [], totalResults = 0 } = res.data || {};
        const totalFetched = items?.length || 0;

        console.log(`[${date}] Received ${totalFetched} items (Total: ${offset + totalFetched}/${totalResults})`);

        // If all data fetched
        if (offset + totalFetched >= totalResults) {
            return { items: items, token: res.token };
        }

        // Fetch next page
        const nextItems = await fetchByDate(
            date,
            offset + totalFetched,
            res.token
        );

        return { items: [...items, ...nextItems], token: res.token };
    };

    /**
     * MAIN EXECUTION
     */
    const dates = getDatesInRange(fromDate, toDate);

    console.log(`Total dates to process: ${dates.length}`);

    let allResults: ResourceResponse[] = [];
    let token = initialToken;

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];

        console.log(`\nProcessing ${i + 1}/${dates.length}: ${date}`);

        const dailyResults = await fetchByDate(date, 0, token);



        // allResults = [...allResults, ...dailyResults.items];
        allResults = [
            ...allResults,
            ...dailyResults.items.map((item: any) => {
                const { acc, alt,dir, i,s,spd,...rest } = item;

                return {                    
                    ResourceId: resourceId,
                    "Accuracy of the position in meters": acc, 
                    Altitude: alt, 
                    "direction (in degrees) in which the vehicle is headed": dir, 
                    "Duration of the position":i,
                    Status: s,
                    Speed: spd,
                    ...rest,
                    
                };
            })
        ];

        token = dailyResults.token;
    }

    console.log(`\n✅ Completed. Total records fetched: ${allResults.length}`);

    return allResults;
}