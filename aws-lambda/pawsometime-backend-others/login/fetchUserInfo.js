'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetchUserInfo = async (userId) => {
	const params = {
		TableName: process.env.USERS_TABLE,
		Key: {
			id: userId
		}
	};

	try {
		const res = await dynamoDb.get(params).promise();
		console.log(res);

		return res.Item;
	} catch (err) {
		console.log(err);

		return err;
	}
};

exports.fetchUserInfo = fetchUserInfo;
