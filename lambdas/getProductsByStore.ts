import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: Handler = async (event) => {
  try {
    const productName = event.pathParameters?.productName;
    const minPrice = event.queryStringParameters?.minPrice;

    if (!productName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing productName in path" }),
      };
    }

    const queryResult = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME!,
        KeyConditionExpression: "productName = :productName",
        ExpressionAttributeValues: { ":productName": productName },
      })
    );

    let items = queryResult.Items || [];

    if (minPrice !== undefined) {
      const min = parseFloat(minPrice);
      items = items.filter((item) => item.price >= min);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ products: items }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }
};
