'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	// validation
	if (
		typeof data.title !== 'string' ||
		typeof data.description !== 'string' ||
		typeof data.userId !== 'string' ||
		typeof data.userName !== 'string' ||
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
		Item: {
			id: uuid.v4(),
			title: data.title,
			description: data.description,
			latlon: data.latlon,
			isPrivate: data.isPrivate,
			userId: data.userId,
			userName: data.userName,
			pending: [], // array of {userId, userName}
			joined: [], // array of {userId, userName}
			likes: [], // array of userIds
			comments: [], // array of comment object (id, description, userId, userName, userAvatar, createdAt)
			attachment: data.attachment ? data.attachment : null,
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'create',
			resource: 'meetup',
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
