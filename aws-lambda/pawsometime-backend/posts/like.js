'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.like = async (event) => {
	const data = JSON.parse(event.body);

	let likes = [];
	let newLikes = [];

	// validation
	if (typeof data.userId !== 'string') {
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

		if (!res.Item || !res.Item.likes) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Could not find the item',
					userMessage: 'Post is not found.'
				})
			};
		}

		likes = res.Item.likes;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const alreadyLiked = likes.includes(data.userId);

	if (alreadyLiked) {
		newLikes = likes.filter((item) => item !== data.userId);
	} else {
		likes.push(data.userId);
		newLikes = likes;
	}

	const params = {
		TableName: process.env.POSTS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':likes': newLikes
		},
		UpdateExpression: 'SET likes = :likes',
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
