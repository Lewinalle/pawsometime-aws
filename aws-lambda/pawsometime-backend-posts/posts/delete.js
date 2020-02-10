'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

module.exports.delete = async (event) => {
	const getParams = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const getRes = await dynamoDb.get(getParams).promise();

		console.log(getRes);

		if (getRes.Item && getRes.Item.attachment) {
			const s3Params = {
				Bucket: process.env.S3_BUCKET,
				Key: getRes.Item.attachment
			};

			const deleteRes = await s3.deleteObject(s3Params);
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const params = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const res = await dynamoDb.delete(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(res)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
