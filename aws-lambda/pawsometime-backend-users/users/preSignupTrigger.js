'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Pre-signup trigger lambda function to check uniqueness of username
module.exports.preSignupTrigger = async (event) => {
	console.log(event);

	const timestamp = new Date().getTime();
	const id = event.userName;
	const email = event.request.userAttributes.email;
	const username = event.request.userAttributes.name;

	const searchParams = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':username': username,
			':id': id
		},
		FilterExpression: 'username = :username OR id = :id'
	};

	const params = {
		TableName: process.env.USERS_TABLE,
		Item: {
			id,
			email,
			username,
			description: null,
			avatar: null,
			friends: {
				pending: [],
				sent: [],
				friends: []
			},
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	try {
		const searchRes = await dynamoDb.scan(searchParams).promise();
		console.log(searchRes);
		if (searchRes.Count !== 0) {
			console.error('Either username or id already exist!');
			return {};
		}

		const res = await dynamoDb.put(params).promise();
		console.log(res);

		return event;
	} catch (err) {
		console.log(err);

		return {};
	}
};
