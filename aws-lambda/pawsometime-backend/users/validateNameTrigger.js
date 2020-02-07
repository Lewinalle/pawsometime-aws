'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Pre-signup trigger lambda function to check uniqueness of username
module.exports.validateName = async (event) => {
	const data = event.request.userAttributes;

	// validation
	if (typeof data.username !== 'string') {
		console.error('Validation Failed!');
		return {};
	}

	const params = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':username': data.username
		},
		FilterExpression: 'username = :username'
	};

	try {
		const res = await dynamoDb.scan(params).promise();
		console.log(res);

		if (res.Count !== 0 || res.Items.length !== 0) {
			console.error('Username already exists!');
			return {};
		}

		return event;
	} catch (err) {
		return {};
	}
};
