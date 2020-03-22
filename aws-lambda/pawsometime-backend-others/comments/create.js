'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let tableName;

	let comments = [];

	// validation
	if (
		typeof data.resource !== 'string' ||
		typeof data.description !== 'string' ||
		typeof data.userId !== 'string' ||
		typeof data.userName !== 'string'
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

	if (data.resource.toLowerCase() === 'meetups') {
		tableName = process.env.MEETUPS_TABLE;
	} else if (data.resource.toLowerCase() === 'gallery') {
		tableName = process.env.GALLERY_TABLE;
	} else if (data.resource.toLowerCase() === 'posts_tips') {
		tableName = process.env.TIP_POSTS_TABLE;
	} else if (data.resource.toLowerCase() === 'posts_qna') {
		tableName = process.env.QNA_POSTS_TABLE;
	} else if (data.resource.toLowerCase() === 'posts_trade') {
		tableName = process.env.TRADE_POSTS_TABLE;
	} else if (data.resource.toLowerCase() === 'posts_general') {
		tableName = process.env.GENERAL_POSTS_TABLE;
	} else {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Could not find resource in createComments',
				userMessage: 'Resource is not found.'
			})
		};
	}

	const searchParams = {
		TableName: tableName,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.comments) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		comments = res.Item.comments;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const newComment = {
		id: uuid.v4(),
		description: data.description,
		userId: data.userId,
		userName: data.userName,
		userAvatar: data.userAvatar ? data.userAvatar : null,
		createdAt: timestamp
	};

	comments.push(newComment);

	const params = {
		TableName: tableName,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':comments': comments
		},
		UpdateExpression: 'SET comments = :comments',
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
