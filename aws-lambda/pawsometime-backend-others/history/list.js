'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = async (event) => {
	let userId = '';

	let attrValues = {};
	let filterExp = '';

	// search userName
	if (event.queryStringParameters && event.queryStringParameters.from && event.queryStringParameters.to) {
		from = event.queryStringParameters.from;
		to = event.queryStringParameters.to;

		attrValues[':from'] = from;
		attrValues[':to'] = to;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'createdAt between :from and :to';
	}

	// search userId
	if (event.queryStringParameters && event.queryStringParameters.userId) {
		userId = event.queryStringParameters.userId;

		attrValues[':userId'] = userId;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'userId = :userId';
	}

	let params = {
		TableName: process.env.HISTORY_TABLE
	};

	if (filterExp !== '') {
		params.ExpressionAttributeValues = attrValues;
		params.FilterExpression = filterExp;
	}

	try {
		console.log('params: ' + JSON.stringify(params));

		let res = await dynamoDb.scan(params).promise();

		console.log('res: ' + JSON.stringify(res.Items));

		TimSort.sort(res.Items, (a, b) => {
			if (a.createdAt === b.createdAt) return 0;
			else if (a.createdAt > b.createdAt) return -1;
			else return 1;
		});

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
