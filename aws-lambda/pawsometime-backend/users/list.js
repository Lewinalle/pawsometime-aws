'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = async (event) => {
	const params = {
		TableName: process.env.POSTS_TABLE
	};

	console.log(event);

	try {
		const res = await dynamoDb.scan(params).promise();
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
