import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { productName, storeName, price, quantity } = body;

    if (!productName || !storeName || price === undefined || quantity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const item = {
      productName,
      storeName,
      price,
      quantity,
      translatedNames: {},
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: item,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Product added successfully" }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }
};
