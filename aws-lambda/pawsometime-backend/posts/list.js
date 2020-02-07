'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = async (event) => {
	// TODO: add sorting features with more fields later on

	let title = '';
	let description = '';
	let userName = '';
	let userId = '';

	let attrValues = {};
	let filterExp = '';

	// search title
	if (event.queryStringParameters && event.queryStringParameters.title) {
		title = event.queryStringParameters.title;

		attrValues[':title'] = title;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (title, :title)';
	}

	// search description
	if (event.queryStringParameters && event.queryStringParameters.description) {
		description = event.queryStringParameters.description;

		attrValues[':description'] = description;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (description, :description)';
	}

	// search userName
	if (event.queryStringParameters && event.queryStringParameters.userName) {
		userName = event.queryStringParameters.userName;

		attrValues[':userName'] = userName;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (userName, :userName)';
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
		TableName: process.env.POSTS_TABLE
	};

	if (filterExp !== '') {
		params.ExpressionAttributeValues = attrValues;
		params.FilterExpression = filterExp;
	}

	try {
		console.log('params: ' + JSON.stringify(params));
		let res = await dynamoDb.scan(params).promise();
		console.log('res: ' + JSON.stringify(res));

		TimSort.sort(res.Items, (a, b) => {
			if (a.updatedAt === b.updatedAt) return 0;
			else if (a.updatedAt > b.updatedAt) return -1;
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
