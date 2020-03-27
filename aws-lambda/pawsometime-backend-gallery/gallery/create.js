'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string' || typeof data.photo !== 'string') {
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
		TableName: process.env.GALLERY_TABLE,
		Item: {
			id: uuid.v4(),
			description: data.description ? data.description : null,
			userId: data.userId,
			userName: data.userName,
			likes: [], // array of userIds
			comments: [], // array of comment object (id, description, userId, userName, userAvatar, createdAt)
			photo: data.photo,
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'create',
			resource: 'gallery',
			resourceId: params.Item.id,
			resourceType: null,
			userId: data.userId,
			userName: data.userName,
			createdAt: timestamp
		}
	};

	try {
		const res = await dynamoDb.put(params).promise();
		console.log(res);

		const historyRes = await dynamoDb.put(historyParams).promise();

		console.log('historyRes', historyRes);

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
