'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event) => {
	const params = {
		TableName: process.env.GALLERY_TABLE,
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
