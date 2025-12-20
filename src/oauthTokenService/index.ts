export async function getOAuthToken(clientId: string, clientSecret: string, instanceUrl: string): Promise<any> {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/oauthTokenService/v2/token`;
    const credentials = btoa(`${clientId}@${instanceUrl}:${clientSecret}`);
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
    };
    const body = new URLSearchParams({
        'grant_type': 'client_credentials'
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error fetching OAuth token:', error);
        throw error;
    }
}
