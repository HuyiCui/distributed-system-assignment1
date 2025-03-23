import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class Assignment1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'productName', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'storeName', type: dynamodb.AttributeType.STRING },
      tableName: 'Products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const addProductFn = new lambdanode.NodejsFunction(this, 'AddProductFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambdas/addProduct.ts',
      handler: 'handler',
      environment: { TABLE_NAME: productsTable.tableName },
    });
    productsTable.grantWriteData(addProductFn);

    const getProductsByStoreFn = new lambdanode.NodejsFunction(this, 'GetProductsByStoreFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambdas/getProductsByStore.ts',
      handler: 'handler',
      environment: { TABLE_NAME: productsTable.tableName },
    });
    productsTable.grantReadData(getProductsByStoreFn);

    const translateProductFn = new lambdanode.NodejsFunction(this, 'TranslateProductFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambdas/translateProduct.ts',
      handler: 'handler',
      environment: { TABLE_NAME: productsTable.tableName },
    });
    productsTable.grantReadData(translateProductFn);

    translateProductFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText'],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }));

    const updateProductFn = new lambdanode.NodejsFunction(this, 'UpdateProductFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambdas/updateProduct.ts',  
      handler: 'handler',
      environment: { TABLE_NAME: productsTable.tableName },
    });
    productsTable.grantWriteData(updateProductFn);

    const api = new apig.RestApi(this, 'Assignment1Api', {
      endpointConfiguration: {
        types: [apig.EndpointType.REGIONAL],
      },
      deployOptions: { stageName: 'dev' },
      defaultCorsPreflightOptions: {
        allowHeaders: ['Content-Type'],
        allowMethods: ['OPTIONS', 'GET', 'POST'],
        allowCredentials:true,
        allowOrigins: ['*'],
      },
    });

    const products = api.root.addResource('products');
    products.addMethod('POST', new apig.LambdaIntegration(addProductFn));

    const productRoute = products.addResource('{productName}');
    productRoute.addMethod('GET', new apig.LambdaIntegration(getProductsByStoreFn));

    const storeRoute = productRoute.addResource('{storeName}');
    storeRoute.addMethod('PUT', new apig.LambdaIntegration(updateProductFn));

    const translationRoute = storeRoute.addResource('translation');
    translationRoute.addMethod('GET', new apig.LambdaIntegration(translateProductFn));

  }
}
