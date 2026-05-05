import { FetchWithRetryResult, Response } from "../types";
import { fetchWithRetry } from "../utilities";
/**
 * Fetches all proeprties from the OFSC instance.
 *
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} [initialToken] - The OAuth token to use. If not provided, a new token will be fetched.
 *
 * @returns {Promise<any[]>} A promise which resolves to an array of resource objects.
 */
export async function AllResourceType(
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
     * @returns {Promise<Response[]>} A promise which resolves to an array of resource responses.
     */
    const AllResourceType = async (
        offset: number,
        token: string
    ): Promise<Response[]> => {
        apiCallCount++;

        // Wait 10 seconds after 20 API calls to avoid server rate limits.
        if (apiCallCount % WAIT_AFTER_CALLS === 0) {
            console.warn(` Waiting 10 seconds after ${apiCallCount} API calls to avoid server rate limits.`);
            await sleep(DELAY_MS);
        }

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/resourceTypes?offset=${offset}&limit=100`;

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

        const nextItems = await AllResourceType(
            offset + totalFetched,
            res.token
        );

        return [...items, ...nextItems];
    };

    return AllResourceType(0, initialToken);
}

type Translation = {
  language: string;
  name: string;
  languageISO: string;
};

type ResourceType = {
  label: string;
  name: string;
  active: boolean;
  role: string;
  translations?: Translation[];
};

type CompareError = {
  label: string;
  field?: string;
  message: string;
  env1Value?: any;
  env2Value?: any;
  env1Instance?: string;
    env2Instance?: string;
};

export function deepCompareResourceTypes(
  env1: ResourceType[],
  env2: ResourceType[],
  e1Instance: string,
  e2Instance: string
): CompareError[] {
  const errors: CompareError[] = [];

  const env2Map = new Map(env2.map(e => [e.label, e]));
  const env1Map = new Map(env1.map(e => [e.label, e]));

  // ---- compare env1 → env2 ----
  for (const r1 of env1) {
    const r2 = env2Map.get(r1.label);

    if (!r2) {
      errors.push({
        label: r1.label,
        message: "Missing in env2",
        env1Value: r1,
         env1Instance: e1Instance,
                env2Instance: e2Instance
      });
      continue;
    }

    // ---- primitive fields ----
    const fields: (keyof ResourceType)[] = ["name", "active", "role"];

    for (const field of fields) {
      if (r1[field] !== r2[field]) {
        errors.push({
          label: r1.label,
          field: String(field),
          message: `${field} mismatch`,
          env1Value: r1[field],
          env2Value: r2[field],
          env1Instance: e1Instance,
                env2Instance: e2Instance
        });
      }
    }

    // ---- translations ----
    const t1 = r1.translations ?? [];
    const t2 = r2.translations ?? [];

    const t2Map = new Map(t2.map(t => [t.languageISO, t]));
    const t1Set = new Set(t1.map(t => t.languageISO));

    for (const tr1 of t1) {
      const tr2 = t2Map.get(tr1.languageISO);

      if (!tr2) {
        errors.push({
          label: r1.label,
          field: "translations",
          message: `Missing translation in env2 (${tr1.languageISO})`,
          env1Value: tr1,
          env1Instance: e1Instance,
                env2Instance: e2Instance
        });
        continue;
      }

      if (tr1.name !== tr2.name) {
        errors.push({
          label: r1.label,
          field: `translations.name[${tr1.languageISO}]`,
          message: "Translation name mismatch",
          env1Value: tr1.name,
          env2Value: tr2.name,
          env1Instance: e1Instance,
                env2Instance: e2Instance
        });
      }

      if (tr1.language !== tr2.language) {
        errors.push({
          label: r1.label,
          field: `translations.language[${tr1.languageISO}]`,
          message: "Translation language mismatch",
          env1Value: tr1.language,
          env2Value: tr2.language,
          env1Instance: e1Instance,
                env2Instance: e2Instance
        });
      }
    }

    // ---- missing translations in env1 ----
    for (const tr2 of t2) {
      if (!t1Set.has(tr2.languageISO)) {
        errors.push({
          label: r1.label,
          field: "translations",
          message: `Missing translation in env1 (${tr2.languageISO})`,
          env2Value: tr2,
          env1Instance: e1Instance,
                env2Instance: e2Instance
        });
      }
    }
  }

  // ---- missing in env1 ----
  for (const r2 of env2) {
    if (!env1Map.has(r2.label)) {
      errors.push({
        label: r2.label,
        message: "Missing in env1",
        env2Value: r2,
        env1Instance: e1Instance,
                env2Instance: e2Instance
      });
    }
  }

  return errors;
}