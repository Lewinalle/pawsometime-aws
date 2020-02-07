'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	const params = {
		TableName: process.env.POSTS_TABLE,
		Item: {
			id: uuid.v4(),
			title: data.title,
			createdAt: timestamp,
			updatedAt: timestamp
		}
	};

	try {
		const res = await dynamoDb.put(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(params.Item)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
