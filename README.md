## Serverless REST Assignment - Distributed Systems.

__Name:__ Huyi Cui

__Demo:__ [... link to your YouTube video demonstration ......](https://youtu.be/_3cVosGDbxI)

### Context.

I chose to build a web API for a simple Product Management system. The DynamoDB table holds items for each product in a particular store, with the following attributes:

Table item attributes:
+ productName - string (Partition Key)
+ storeName - string (Sort Key)
+ price - number
+ quantity - number
+ translatedNames - Map<string, string> (for caching translations)

### App API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API) you have successfully implemented. ]
e.g.
 
+ POST /products - Add a new product item. (Protected by API Key in my final step)
+ GET /products/{productName} - Get products by name.
+ GET /products/{productName}?minPrice=xxx - Retrieves all records matching the specified productName. Optional query minPrice filters items whose price >= minPrice.the condition .....
+ PUT /products/{productName}/{storeName} - Updates certain attributes (e.g., price, quantity) of a specific item identified by (productName, storeName). (Protected by API Key)
+ GET /products/{productName}/{storeName}/translation?language=xx - Translates productName into a target language (e.g., fr) and returns it, caching the result in DynamoDB for repeated calls. 


### Features.

#### Translation persistence (if completed)

I store the translations in a translatedNames map attribute on each DynamoDB item. After calling the Amazon Translate service once, I write the translated text back to DynamoDB under translatedNames[language]. On subsequent calls for the same language, the code checks if translatedNames[language] exists:

#### API Keys. (if completed)

I implemented API key authentication to protect POST and PUT operations. My CDK code snippet looks like this:

const api = new apig.RestApi(this, 'MyApi', { ... });

// Create API Key
const apiKey = api.addApiKey('MyApiKey');
const plan = api.addUsagePlan('UsagePlan', {
  name: 'BasicPlan',
  apiStages: [{ api, stage: api.deploymentStage }],
});
plan.addApiKey(apiKey);

// Protect the POST route
products.addMethod('POST', new apig.LambdaIntegration(addProductFn), {
  apiKeyRequired: true,
});
When calling the POST or PUT endpoints, I include a header:

x-api-key: [the actual API key value copied from the console]