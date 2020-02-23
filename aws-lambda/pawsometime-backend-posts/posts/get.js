'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event) => {
	if (!event.queryStringParameters || !event.queryStringParameters.type) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed! type is missing',
				userMessage: 'type of post must be provided'
			})
		};
	}

	let dbTable;
	if (event.queryStringParameters.type.toLowerCase() === 'general') {
		dbTable = process.env.GENERAL_POSTS_TABLE;
	} else if (event.queryStringParameters.type.toLowerCase() === 'tips') {
		dbTable = process.env.TIP_POSTS_TABLE;
	} else if (event.queryStringParameters.type.toLowerCase() === 'qna') {
		dbTable = process.env.QNA_POSTS_TABLE;
	} else if (event.queryStringParameters.type.toLowerCase() === 'trade') {
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
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const res = await dynamoDb.get(params).promise();
		console.log(res);

		TimSort.sort(res.Item.comments, (a, b) => {
			if (a.createdAt === b.createdAt) return 0;
			else if (a.createdAt < b.createdAt) return -1;
			else return 1;
		});

		return {
			statusCode: 200,
			body: JSON.stringify(res.Item)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
