'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = async (event) => {
	// TODO: add sorting features with more fields later on

	let username = '';
	let description = '';
	let userIds = [];

	let attrValues = {};
	let filterExp = '';

	// search username
	if (event.queryStringParameters && event.queryStringParameters.username) {
		username = event.queryStringParameters.username;

		attrValues[':username'] = username;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (username, :username)';
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

	// search email
	if (event.queryStringParameters && event.queryStringParameters.email) {
		email = event.queryStringParameters.email;

		attrValues[':email'] = email;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'email = :email';
	}

	// search userIds
	if (event.queryStringParameters && event.queryStringParameters.userIds) {
		try {
			console.log('userIds found!');
			console.log(event.queryStringParameters.userIds);
			userIds = JSON.parse(event.queryStringParameters.userIds);
		} catch (err) {
			console.log(err);

			return {
				statusCode: 422,
				body: JSON.stringify(err)
			};
		}

		let orQuery = '';
		for (let index in userIds) {
			let key = ':id' + index;
			attrValues[key] = userIds[index];
			if (orQuery !== '') {
				orQuery += ' OR ';
			}
			orQuery += 'id = ' + key;
		}
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += '(' + orQuery + ')';
	}

	let params = {
		TableName: process.env.USERS_TABLE
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
			if (a.username === b.username) return 0;
			else if (a.username < b.username) return -1;
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
