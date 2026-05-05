import { FetchWithRetryResult, Response } from "../types";
import { fetchWithRetry } from "../utilities";
export * from "./activityType";
export * from "./activityTypeGroup";
export * from "./resourceTypes";
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
export async function AllProperties(
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
    const AllProperties = async (
        offset: number,
        token: string
    ): Promise<Response[]> => {
        apiCallCount++;

        // Wait 10 seconds after 20 API calls to avoid server rate limits.
        if (apiCallCount % WAIT_AFTER_CALLS === 0) {
            console.warn(` Waiting 10 seconds after ${apiCallCount} API calls to avoid server rate limits.`);
            await sleep(DELAY_MS);
        }

        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/properties/?offset=${offset}&limit=100`;

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

        const nextItems = await AllProperties(
            offset + totalFetched,
            res.token
        );

        return [...items, ...nextItems];
    };

    return AllProperties(0, initialToken);
}

type Translation = {
  language: string;
  name: string;
  languageISO: string;
};

type FieldDefinition = {
  label: string;
  name: string;
  type: string;
  entity: string;
  gui: string;
  translations: Translation[];
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

export async function compareProperties(
  propEnv1: FieldDefinition[],
  propEnv2: FieldDefinition[],
  e1Instance: string,
  e2Instance: string
): Promise<CompareError[]> {
  const errors: CompareError[] = [];

  const env2Map = new Map(propEnv2.map(p => [p.label, p]));

  for (const prop1 of propEnv1) {
    const prop2 = env2Map.get(prop1.label);

    if (!prop2) {
      errors.push({
        label: prop1.label,
        message: `Missing in ${e2Instance}`,
        env1Value: prop1.label, // prop1
      });
      continue;
    }

    // Primitive fields comparison
    const fields: (keyof FieldDefinition)[] = ["name", "type", "entity", "gui"];

    for (const field of fields) {
      if (prop1[field] !== prop2[field]) {
        errors.push({
          label: prop1.label,
          field,
          message: `${field} mismatch`,
          env1Value: prop1[field],
          env2Value: prop2[field],
          env1Instance: e1Instance,
          env2Instance: e2Instance
        });
      }
    }

    // Translations comparison
    const tMap = new Map(prop2.translations.map(t => [t.languageISO, t]));

    for (const t1 of prop1.translations) {
      const t2 = tMap.get(t1.languageISO);

      if (!t2) {
        errors.push({
          label: prop1.label,
          field: "translations",
          message: `Translation missing in ${e2Instance} - (${t1.languageISO})`,
          env1Value: t1
        });
        continue;
      }

      if (t1.name !== t2.name) {
        errors.push({
          label: prop1.label,
          field: `translations.name[${t1.languageISO}]`,
          message: `Translation name mismatch`,
          env1Value: t1.name,
          env2Value: t2.name,
          env1Instance: e1Instance,
          env2Instance: e2Instance
        });
      }

      if (t1.language !== t2.language) {
        errors.push({
          label: prop1.label,
          field: `translations.language[${t1.languageISO}]`,
          message: `Translation language mismatch`,
          env1Value: t1.language,
          env2Value: t2.language,
          env1Instance: e1Instance,
          env2Instance: e2Instance
        });
      }
    }

    // Missing translations in env1
    const env1LangSet = new Set(prop1.translations.map(t => t.languageISO));

    for (const t2 of prop2.translations) {
      if (!env1LangSet.has(t2.languageISO)) {
        errors.push({
          label: prop1.label,
          field: "translations",
          message: `Translation missing in ${e1Instance} - (${t2.languageISO})`,
          env2Value: t2,
          env1Instance: e1Instance,
          env2Instance: e2Instance
        });
      }
    }
  }

  // Missing properties in env1
  const env1Labels = new Set(propEnv1.map(p => p.label));

  for (const prop2 of propEnv2) {
    if (!env1Labels.has(prop2.label)) {
      errors.push({
        label: prop2.label,
        message: `Missing in ${e1Instance}`,
        env2Value: prop2.label,
        env1Instance: e1Instance,
        env2Instance: e2Instance
      });
    }
  }

  return errors;
}

