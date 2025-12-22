# Enhanced ofsc utility

A lightweight utility library for interacting with **Oracle Field Service Cloud (OFSC)** using cdn for broswer/html.

## Features

- 🚀 **40+ utility methods**
- 📚 **Written in TypeScript** with full type definitions
- 🧪 **Completely tested** with Jest
- 📦 **Zero dependencies**
- 🎯 **Modular architecture** for tree-shaking
- 🔧 **Multiple import styles** for flexibility

## Latest version:

```html
<script src="https://unpkg.com/ofsc-utility-browser/dist/ofsc-utilities-min.js"></script>
```

## Specific version (recommended)

```html
<script src="https://unpkg.com/ofsc-utility-browser@1.0.1/dist/ofsc-utilities-min.js"></script>
```
## Functions implemented

  ### Activity
    - getAllActivities(clientId: string,clientSecret: string,instanceUrl: string,resources: string,dateFrom: string,dateTo: string,q?: string,fields?: string,ncludeNonScheduled: boolean = false ) 
    - getActivitybyId( clientId: string, clientSecret: string,instanceUrl: string, activityId: number, token: string=")
    - updateResource(clientId: string, clientSecret: string, instanceUrl: string, resourceId: string, payload: any, token: string = "")
    - AllResources(clientId: string,clientSecret: string,instanceUrl: string,initialToken = "")
  
  ### Post Clone
     - resetResourcesEmail(clientId: string,clientSecret: string,instanceUrl: string,newdomain: string = "noreply",token: string = "")

### Uses

```html
<script src="https://unpkg.com/ofsc-utility-browser/dist/ofsc-utilities-min.js"></script>
<script type="module">
  const form = document.getElementById("ofscForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const statusDiv = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    btnText.innerHTML = 'Processing <span class="loading"></span>';

    try {
      const clientIDInput = document.getElementById("clientID");
      const clientSecretInput = document.getElementById("clientSecret");
      const instanceIdInput = document.getElementById("instanceId");
      const regionSelect = document.getElementById("region");
      const startDateInput = document.getElementById("startDate");
      const endDateInput = document.getElementById("endDate");
      const clientID = clientIDInput.value;
      const clientSecret = clientSecretInput.value;
      const instanceId = instanceIdInput.value;
      const region = regionSelect.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      const res = await window.OFSC.Activity.getAllActivities(
        clientID,
        clientSecret,
        instanceId,
        region,
        startDate,
        endDate,
        "status=='pending' and XA_ACTIVITY_NOTES!=''",
        "XA_ACTIVITY_NOTES,status,activityId,activityType,date,resourceId",
        true
      );

      const csvData = res.map((item) => ({
        activityId: item.activityId,
        activityType: item.activityType,
        date: item.date,
        resourceId: item.resourceId,
      }));

      window.OFSC.Utilities.downloadCSV(csvData);     
    } catch (err) {
      console.error(err);
      showStatus(err.message || "Failed", "error");
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = "Download CSV";
    }
  });
</script>
```

## License

MIT
