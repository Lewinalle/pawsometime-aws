'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const DEFAULT_NUM_ITEMS = 50;

module.exports.list = async (event) => {
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

		let page =
			event.queryStringParameters &&
			event.queryStringParameters.page &&
			!isNaN(Number(event.queryStringParameters.page)) &&
			Number(event.queryStringParameters.page) > 1
				? ~~Number(event.queryStringParameters.page)
				: 1;

		return {
			statusCode: 200,
			body: JSON.stringify(res.Items.slice((page - 1) * DEFAULT_NUM_ITEMS, page * DEFAULT_NUM_ITEMS - 1))
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
