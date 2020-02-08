'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.delete = async (event) => {
	const data = JSON.parse(event.body);

	let comments = [];
	let newComments = [];

	let tableName;

	// validation
	if (typeof data.resource !== 'string') {
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
	} else if (data.resource.toLowerCase() === 'posts') {
		tableName = process.env.POSTS_TABLE;
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

	newComments = comments.filter((item) => item.id !== event.pathParameters.commentId);

	const params = {
		TableName: tableName,
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
