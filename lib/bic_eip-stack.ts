import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CorsHttpMethod, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class BicEipStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authHandler = new lambda.Function(this, 'WebhookAuthorizer', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda')),
    });

    // create lambde authorizer
    const authorizer = new HttpLambdaAuthorizer('WebhookAuthorizer', authHandler, {
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    const httpApi = new HttpApi(this, 'BIC', {
      description: 'Webhook Handler',
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          // CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          // CorsHttpMethod.PUT,
          // CorsHttpMethod.PATCH,
          // CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
        allowOrigins: ['http://localhost:3000'],
      },
    });

    httpApi.addRoutes({
      path: '/webhook-hendler',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'get-todos-integration',
        authHandler,
      ),
      authorizer
    });

    // Output API Url
    new cdk.CfnOutput(this, 'ApiUrl - ', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: httpApi.url!,
    });


  }
}
