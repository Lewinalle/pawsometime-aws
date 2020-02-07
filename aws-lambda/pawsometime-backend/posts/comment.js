'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.comment = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let comments = [];

	// validation
	if (typeof data.description !== 'string' || typeof data.userId !== 'string' || typeof data.userName !== 'string') {
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
		TableName: process.env.POSTS_TABLE,
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
					developerMessage: 'Post is not found.',
					userMessage: 'Post is not found.'
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
		TableName: process.env.POSTS_TABLE,
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

module.exports.delete = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let comments = [];
	let newComments = [];

	const searchParams = {
		TableName: process.env.POSTS_TABLE,
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
					developerMessage: 'Post or Comment is not found.',
					userMessage: 'Post or Comment is not found.'
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

	newComments = comments.filter((item) => item.id !== event.pathParameters.commentId);

	const params = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':comments': newComments
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
