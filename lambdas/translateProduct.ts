import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const translateClient = new TranslateClient({});

export const handler: Handler = async (event) => {
  try {
    const productName = event.pathParameters?.productName;
    const storeName = event.pathParameters?.storeName;
    const language = event.queryStringParameters?.language;

    if (!productName || !storeName || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing parameters" }),
      };
    }

    const getRes = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { productName, storeName },
      })
    );
    if (!getRes.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const translateRes = await translateClient.send(
      new TranslateTextCommand({
        SourceLanguageCode: "auto",
        TargetLanguageCode: language,
        Text: getRes.Item.productName,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        productName: getRes.Item.productName,
        translated: translateRes.TranslatedText,
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }
};