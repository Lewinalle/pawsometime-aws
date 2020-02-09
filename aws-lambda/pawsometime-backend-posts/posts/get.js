'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event) => {
	const params = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const res = await dynamoDb.get(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(res.Item)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
