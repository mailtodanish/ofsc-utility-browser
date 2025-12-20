
// Export all methods grouped by category
export * as Activity from './activities';
export * as OauthTokenService from './oauthTokenService';


export * as Utilities from './utilities';

// Export types
export * from './types';


export {
  getOAuthToken
} from './oauthTokenService';



export { getActivitybyId, getAllActivities } from './activities';




// Default export with all functionality
const OfscUtility = {
  getOAuthToken: require('./oauthTokenService').getOAuthToken,
  getAllActivities: require('./activities').getAllActivities,
  getActivitybyId: require('./activities').getActivitybyId

};

export default OfscUtility;