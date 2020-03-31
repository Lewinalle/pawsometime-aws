'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.list = async (event) => {
	let username = '';
	let description = '';
	let email = '';
	let userIds = [];

	let attrValues = {};
	let filterExp = '';

	// search username
	if (event.queryStringParameters && event.queryStringParameters.username) {
		username = event.queryStringParameters.username;

		attrValues[':username'] = username;
		if (filterExp !== '') {
			filterExp += ' OR ';
		}
		filterExp += 'contains (username, :username)';
	}

	// search description
	if (event.queryStringParameters && event.queryStringParameters.description) {
		description = event.queryStringParameters.description;

		attrValues[':description'] = description;
		if (filterExp !== '') {
			filterExp += ' OR ';
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
		let res = await getAllData(params);
		console.log('res: ' + JSON.stringify(res));

		TimSort.sort(res, (a, b) => {
			if (a.username === b.username) return 0;
			else if (a.username < b.username) return -1;
			else return 1;
		});

		return {
			statusCode: 200,
			body: JSON.stringify(res)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};

const getAllData = async (params) => {
	let allData = [];

	let data = await dynamoDb.scan(params).promise();

	if (data['Items'].length > 0) {
		allData = [ ...allData, ...data['Items'] ];
	}

	while (data.LastEvaluatedKey) {
		console.log('There are more items to search (over 1MB). Fetching More!');
		params.ExclusiveStartKey = data.LastEvaluatedKey;

		let data = await dynamoDb.scan(params).promise();

		if (data['Items'].length > 0) {
			allData = [ ...allData, ...data['Items'] ];
		}
	}

	console.log('Fetching Done!');
	return allData;
};
