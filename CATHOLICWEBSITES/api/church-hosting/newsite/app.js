let response;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB();

exports.lambdaHandler = async (event, context) => {

    var bucketname = 'catholicwebhosting-examplechurch';
    var email = event.requestContext.authorizer.claims['email'];
    var tablename = 'catholichosting-bucket-table';

    var createBucketParams = {
        'Bucket': bucketname,
    }

    let createBucketResponse = await s3.createBucket(createBucketParams).promise();

    var insertBucketParams = {
        TableName: tablename,
        Item: {
            "bucket": {
                S: bucketname
            },
            "owner": {
                S: email
            }
        }
    }

    let insertBucketResponse = await dynamodb.putItem(insertBucketParams).promise();

    var websiteConfig = {
        Bucket: bucketname,
        WebsiteConfiguration: {
            ErrorDocument: {
                Key: "error.html"
            }, 
            IndexDocument: {
                Suffix: "index.html"
            }
        }
    }

    let putWebsiteConfigResponse = await s3.putBucketWebsite(websiteConfig).promise();

    var ACLconfig = {
        Bucket: bucketname,
        ACL: "public-read"
    }

    let putACLResponse = await s3.putBucketAcl(ACLconfig).promise();

    var indexHTML = {
        Bucket: bucketname,
        Body: "test index page",
        Key: "index.html",
        ACL: "public-read",
        ContentType: "text/html",
        ContentDisposition: "inline"
    }
    var errorHTML = {
        Bucket: bucketname,
        Body: "test error page",
        Key: "error.html",
        ACL: "public-read",
        ContentType: "text/html",
        ContentDisposition: "inline"
    }
    
    let putErrorResponse = await s3.putObject(errorHTML).promise();
    let putIndexResponse = await s3.putObject(indexHTML).promise();

    response = {
        'statusCode': 200,
        'body': JSON.stringify({
            message: "Success"
        }),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        }
    }

    return response
};
