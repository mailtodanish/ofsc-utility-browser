import { DOMParser } from "xmldom";
import { getOAuthToken } from "../oauthTokenService";

import { CSVRow } from '../types';

/**
 * Fetches a URL with retry logic for expired tokens.
 *
 * @param {string} url - The URL to fetch.
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} token - The current OAuth token.
 *
 * @returns {Promise<{ data: any; token: string }>} A promise which resolves to an object containing the parsed JSON data and the latest OAuth token.
 */
export const fetchWithRetry = async (
    url: string,
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    token: string,
    retries: number = 5,
    baseDelay: number = 500
): Promise<{ data: any; token: string }> => {

    const doFetch = async (bearer: string) => {
        return fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearer}`,
                Accept: "application/json"
            }
        });
    };
    
    // Try with the current token
    let res = await doFetch(token);

    /* ---------- 401: refresh token ONCE per call ---------- */
    if (res.status === 401) {
        console.warn("⚠️ Token expired — renewing token…");
        token = await getOAuthToken(clientId, clientSecret, instanceUrl);

        res = await doFetch(token);
    }

     /* ---------- 429: retry with backoff ---------- */
    if (res.status === 429 && retries > 0) {
        const retryAfter = res.headers.get("Retry-After");
        console.log("⚠️ 429 received. Retrying...",retryAfter);
        const delay = retryAfter ? Number(retryAfter) * 1000 : baseDelay;
        console.warn(`⚠️ 429 received. Retrying in ${delay}ms... (${retries} left)`);

        await new Promise(r => setTimeout(r, delay));

        return fetchWithRetry(
            url,
            clientId,
            clientSecret,
            instanceUrl,
            token,
            retries - 1,
            baseDelay * 2
        );
    }

    // If still not OK → fail
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`❌ Request failed: ${res.status} ${res.statusText}\n${body}`);
    }

    // Return parsed JSON + latest token
    return {
        data: await res.json(),
        token
    };
};





export function stringCsv<T extends Record<string, any>>(rows: T[]): string {
    if (!rows || rows.length === 0) {
        throw new Error("CSV creation failed: no rows provided.");
    }

    // Collect all unique headers from all rows
    const headerSet = new Set<string>();
    rows.forEach(row => {
        Object.keys(row).forEach(key => headerSet.add(key));
    });
    const headers = Array.from(headerSet);

    // Build CSV content
    const csvLines = [
        headers.join(","), // header row
        ...rows.map(row =>
            headers.map(h => escapeCsvValue(row[h])).join(",")
        )
    ];

    return csvLines.join("\n");
}

// Simple CSV escaping
function escapeCsvValue(value: any): string {
    if (value == null) return "";
    const str = String(value);
    // Escape quotes
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function xmlNodeToObjects(
  xmlString: string,
  parentNodeName: string
): Record<string, string>[] {

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");

  const nodes = Array.from(xml.getElementsByTagName(parentNodeName));

  if (nodes.length === 0) {
    throw new Error(`No <${parentNodeName}> nodes found`);
  }

  return nodes.map(node => {
    const obj: Record<string, string> = {};

    const fields = Array.from(node.getElementsByTagName("Field"));

    for (const field of fields) {
      const key = field.getAttribute("name");
      if (!key) continue;

      obj[key] = field.textContent?.trim() ?? "";
    }

    return obj;
  });
}
/**
 * Download an array of objects as a CSV file
 * @param csvData Array of objects representing CSV rows
 */
export const  downloadCSV = (csvData: CSVRow[]): void =>{
  if (!csvData.length) {
    showStatus('No data to download', 'error');
    return;
  }

  const csvContent = stringCsv(csvData);

  // Create Blob and download link
  const blob: Blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link: HTMLAnchorElement = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `data_${Date.now()}.csv`;
  link.click();

  // Clean up object URL after download
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}


function showStatus(message: string, type: 'error' | 'success' | 'info'): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
}