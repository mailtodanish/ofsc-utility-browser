# Enhanced ofsc utility

A lightweight utility library for interacting with **Oracle Field Service Cloud (OFSC)**.

## Features

- 🚀 **40+ utility methods**
- 📚 **Written in TypeScript** with full type definitions
- 🧪 **Completely tested** with Jest
- 📦 **Zero dependencies**
- 🎯 **Modular architecture** for tree-shaking
- 🔧 **Multiple import styles** for flexibility

## Installation

```bash
npm install ofsc-utility
```

## Functions implemented

### Download

Please see the code snippet below.

#### csv

    downloadWorkZoneCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId)
    downloadAllResourcesCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId)
    downloadAllUsersCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId)
    downloadAllInventoryTypesCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId)
    downloadAllEventsOfDayCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId, process.env.subscriptionId,"2025-12-05")
    // Download Collaboration groups  assigned to users
    generateUsersCollaborationCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId) 
    // Download all resource's inventories
    generateAllOnHandInventoryOfAllResourcesCSV(process.env.clientID, process.env.clientSecret, process.env.instanceId) 

#### records

    getOAuthToken("clientId", "clientSecret", "instanceId")
    getInventoryTypesDetail("clientId", "clientSecret", "instanceId"."inventory_label")
    updateCreateInventoryType("clientId", "clientSecret", "instanceId"."inventory_label")
    getAllActivities("clientId", "clientSecret", "instanceId"."resources","dateFrom","dateTo","q","fields")
    getActivityCustomerInventories("clientId", "clientSecret", "instanceId"."activityId")
    createActivityCustomerInventories( "clientId", "clientSecret", "instanceId"."activityId","payload")
    downloadAllEventsOfDay(process.env.clientID, process.env.clientSecret, process.env.instanceId, process.env.subscriptionId,"2025-12-05")
    getActivitybyId("clientId", "clientSecret", "instanceId"."activityId")

## Usage

downloadWorkZoneCSV("bot", "XXXXXXXXX", "compXXX.test")

### CommonJS

```js
const ofs = require("ofsc-utility");

ofs.User.generateUsersCollaborationCSV(
    process.env.clientID,
    process.env.clientSecret,
    process.env.instanceId,
    process.env.subscriptionId
);
```

```js
async function run() {
  let data = await ofs.InventoryType.getInventoryTypesDetail("clientId", "clientSecret", "instanceId", "inventory_label");
  console.error(data);
}
run();
```

```js
const ofs = require("ofsc-utility");

ofs
  .getOAuthToken("clientId", "clientSecret", "instanceId")
  .then((token) => {
    console.log(token);
  })
  .catch((err) => {
    console.error("Error fetching token:", err);
  });
```

```js
const ofs = require("ofsc-utility");

ofs.WorkZone.downloadWorkZoneCSV("clientId", "clientSecret", "instanceId")
  .then(() => {
    console.log("successful");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

```js
const ofs = require("ofsc-utility");

ofs
  .downloadAllResourcesCSV("clientId", "clientSecret", "instanceId")
  .then(() => {
    console.log("successful");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

```js
const ofs = require("ofsc-utility");

ofs
  .downloadAllUsersCSV("clientId", "clientSecret", "instanceId")
  .then(() => {
    console.log("successful");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

```js
const ofs = require("ofsc-utility");

async function run() {
  const payload = {
    label: "inventory_label",
    name: "Ordered Part",
    unitOfMeasurement: "ea",
    active: true,
    nonSerialized: true,
    modelProperty: "part_item_number_rev",
    quantityPrecision: 0,
    translations: [
      {
        language: "en",
        name: "Ordered Part",
        unitOfMeasurement: "ea",
        languageISO: "en-US",
      },
    ],
  };

  try {
    const result = await updateCreateInventoryType("CLIENT_ID", "CLIENT_SECRET", "INSTANCE_URL", "inventory_label", payload);

    console.log("Updated:", result);
  } catch (err) {
    console.error(err);
  }
}

run();
```

```js
const ofs = require("ofsc-utility");
async function run() {
  try {
    const result = await ofs.getAllActivities(
      (clientId = "CLIENT_ID"),
      (clientSecret = "CLIENT_SECRET"),
      (instanceUrl = "INSTANCE_URL"),
      (resources = "US"),
      (dateFrom = "2025-11-05"),
      (dateTo = "2025-12-05"),
      (q = "status=='pending' and ACTIVITY_NOTES!=''"),
      (fields = "ACTIVITY_NOTES,status,activityId,activityType,date,resourceId")
    );

    console.log("Updated:", result);
  } catch (err) {
    console.error(err);
  }
}

run();
```

```js
ofs.getActivityCustomerInventories("CLIENT_ID", "CLIENT_SECRET", "INSTANCE_URL", "activityId").then((data) => {
  console.log(data);
});
```

```js
const ofs = require("ofsc-utility");
ofs.Events.downloadAllEventsOfDayCSV(
  process.env.clientID,
  process.env.clientSecret,
  process.env.instanceId,
  process.env.subscriptionId,
  "2025-12-05"
);
```

## License

MIT
