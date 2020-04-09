'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetchFriendsActivity = async (user) => {
	let userIds = [];

	let attrValues = {};
	let filterExp = '';

	console.log('user: ', user);
	userIds = user.friends.friends;

	if (!userIds || userIds.length === 0) {
		return [];
	}

	let orQuery = '';
	for (let index in userIds) {
		let key = ':id' + index;
		attrValues[key] = userIds[index];
		if (orQuery !== '') {
			orQuery += ' OR ';
		}
		orQuery += 'userId = ' + key;
	}
	if (filterExp !== '') {
		filterExp += ' AND ';
	}
	filterExp += '(' + orQuery + ')';

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

		return res.Items;
	} catch (err) {
		console.log(err);

		return err;
	}
};

exports.fetchFriendsActivity = fetchFriendsActivity;
