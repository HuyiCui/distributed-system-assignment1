import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: Handler = async (event) => {
  try {
    const productName = event.pathParameters?.productName;

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

    return {
      statusCode: 200,
      body: JSON.stringify({ products: queryResult.Items || [] }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }
};
