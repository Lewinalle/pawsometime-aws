'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.delete = async (event) => {
	const params = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		// TODO: get item and delete file in s3 if there is any

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
