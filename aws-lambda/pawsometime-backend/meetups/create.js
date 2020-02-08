'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	// TODO: Upload image and save url to image field (data.attachment)

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
			pending: [],
			joined: [],
			likes: [], // array of userIds
			comments: [], // array of comment object (id, description, userId, userName, userAvatar, createdAt)
			file: data.attachment ? data.attachment : null,
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	try {
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
