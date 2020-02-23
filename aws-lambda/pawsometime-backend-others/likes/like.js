'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.like = async (event) => {
	const data = JSON.parse(event.body);

	let likes = [];
	let newLikes = [];

	let tableName;

	// validation
	if (typeof data.resource !== 'string' || typeof data.userId !== 'string') {
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
		TableName: tableName,
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
