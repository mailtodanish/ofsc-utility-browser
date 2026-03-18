import * as Activity from "./activities";
import * as DailyExtract from "./dailyExtract";
import * as GPS from "./gps";
import * as OauthTokenService from "./oauthTokenService";
import * as Resources from "./resources";
import * as Users from "./users";
import * as Utilities from "./utilities";
import { downloadCSV } from "./utilities";

// Export grouped namespaces
export { Activity, DailyExtract, GPS, OauthTokenService, Resources, Users, Utilities };

// Export types
  export * from "./types";

// Default export (for convenience)
export default {
  Activity,
  OauthTokenService,
  Utilities,
  Resources,
  downloadCSV,
  Users,
  DailyExtract,
  GPS
};