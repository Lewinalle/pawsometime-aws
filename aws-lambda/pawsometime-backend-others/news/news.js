'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event) => {
	const params = {
		TableName: process.env.NEWS_TABLE
	};

	try {
		const res = await dynamoDb.scan(params).promise();
		console.log(res.Items);

		if (res.Items.length > 0) {
			TimSort.sort(res.Items, (a, b) => {
				if (a.publishedAt === b.publishedAt) return 0;
				else if (a.publishedAt > b.publishedAt) return -1;
				else return 1;
			});
		}

		return {
			statusCode: 200,
			body: JSON.stringify(res.Items)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
