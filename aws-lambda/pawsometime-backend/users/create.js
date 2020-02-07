'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	// TODO: Upload image and save url to image field (data.avatar)

	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	// validation
	if (typeof data.username !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':username': data.username
		},
		FilterExpression: 'username = :username'
	};

	const params = {
		TableName: process.env.USERS_TABLE,
		Item: {
			id: uuid.v4(),
			email: data.email,
			username: data.username,
			description: data.description,
			avatar: data.avatar ? data.avatar : null,
			friends: {
				pending: [],
				sent: [],
				friends: []
			},
			confirmed: false,
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	try {
		const searchRes = await dynamoDb.scan(searchParams).promise();
		console.log(searchRes);
		if (searchRes.Count !== 0) {
			console.error('Username already exists!');
			return {
				statusCode: 400,
				body: JSON.stringify({
					developerMessage: 'Username is already exists.',
					userMessage: 'Username is already exists.'
				})
			};
		}

		const res = await dynamoDb.put(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(params.Item)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
