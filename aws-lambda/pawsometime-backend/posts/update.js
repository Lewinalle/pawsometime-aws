'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event) => {
	// TODO: Upload image and save url to image field (data.attachment)

	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	// validation
	if (typeof data.title !== 'string' || typeof data.description !== 'string') {
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
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':title': data.title,
			':description': data.description,
			':updatedAt': timestamp
		},
		UpdateExpression: 'SET title = :title, description = :description, updatedAt = :updatedAt',
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
