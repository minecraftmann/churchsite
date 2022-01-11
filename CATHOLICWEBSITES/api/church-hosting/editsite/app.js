let response;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB();
const Handlebars = require('handlebars');

exports.lambdaHandler = async (event, context) => {

    var bucketname = 'catholicwebhosting-examplechurch';
    var email = event.requestContext.authorizer.claims['email'];
    var tablename = 'catholichosting-bucket-table';

    var bucketQuery = {
        TableName: tablename,
        Key: {
            "bucket": {
                S: bucketname
            }
        }
    }

    let bucketData = await dynamodb.getItem(bucketQuery).promise();

    let reqParams = JSON.parse(event["body"]);


    let body = "";
    if (reqParams != null && bucketData['Item']['owner']['S'] == email){
        
        if(reqParams['data'] != null){
            bucketData['Item']['data'] = {}
            bucketData['Item']['data']['S'] = reqParams['data']
        }
        if(reqParams['template'] != null){
            bucketData['Item']['template'] = {}
            bucketData['Item']['template']['S'] = reqParams['template']
        }
        
        // construct page if something changed AND both data and template are defined
        // TODO: Needs validation and error handling for bad 'data' input
        if(bucketData['Item']['data'] != null && bucketData['Item']['template'] != null){
        
            let template = Handlebars.compile(bucketData['Item']['template']['S'])
            body = template(JSON.parse(bucketData['Item']['data']['S']))
        
            //Store change in db
            var insertBucketParams = {
                TableName: tablename,
                Item: bucketData['Item']
            }
            let insertBucketResponse = await dynamodb.putItem(insertBucketParams).promise();

            //upload page to bucket
            var indexHTML = {
                Bucket: bucketname,
                Body: body,
                Key: "index.html",
                ACL: "public-read",
                ContentType: "text/html",
                ContentDisposition: "inline"
            }
            let putIndexResponse = await s3.putObject(indexHTML).promise();
        }

    }

    response = {
        'statusCode': 200,
        'body': JSON.stringify({
            message: "Success",
            body: body
        }),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        }
    }

    return response
};
