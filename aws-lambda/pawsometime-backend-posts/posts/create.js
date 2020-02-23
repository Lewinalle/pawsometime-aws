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
		typeof data.type !== 'string'
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

	let dbTable;
	if (data.type.toLowerCase() === 'general') {
		dbTable = process.env.GENERAL_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'tips') {
		dbTable = process.env.TIP_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'qna') {
		dbTable = process.env.QNA_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'trade') {
		dbTable = process.env.TRADE_POSTS_TABLE;
	} else {
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed! type is not valid',
				userMessage: 'Valid type of post must be provided'
			})
		};
	}

	const params = {
		TableName: dbTable,
		Item: {
			id: uuid.v4(),
			title: data.title,
			description: data.description,
			userId: data.userId,
			userName: data.userName,
			likes: [], // array of userId
			comments: [], // array of comment object (id, description, userId, userName, userAvatar, createdAt)
			attachment: data.attachment ? data.attachment : null,
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
