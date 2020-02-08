'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event) => {
	// TODO: (after cognito integration) CHECK USERID TO VERIFY PERMISSION (if different, block)
	// TODO: Upload image and save url to image field (data.attachment)

	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	// validation
	if (
		typeof data.title !== 'string' ||
		typeof data.description !== 'string' ||
		typeof data.latlon !== 'object' ||
		typeof data.isPrivate !== 'boolean'
	) {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeNames: {
			'#title': 'title',
			'#description': 'description',
			'#latlon': 'latlon',
			'#isPrivate': 'isPrivate',
			'#updatedAt': 'updatedAt'
		},
		ExpressionAttributeValues: {
			':title': data.title,
			':description': data.description,
			':latlon': data.latlon,
			':isPrivate': data.isPrivate,
			':updatedAt': timestamp
		},
		UpdateExpression:
			'SET #title = :title, #description = :description, #latlon = :latlon, #isPrivate = :isPrivate, #updatedAt = :updatedAt',
		ReturnValues: 'ALL_NEW'
	};

	try {
		const res = await dynamoDb.update(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(res.Attributes)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
