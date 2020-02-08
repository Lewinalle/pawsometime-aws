'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.delete = async (event) => {
	// TODO: when user is deleted, cascade delete all posts/meetups/comments of the user
	// TODO: also remove the user from friends(pending, sent, friends) and meetup(pending, joined)
	// TODO: also delete file (avatar) on S3

	const params = {
		TableName: process.env.USERS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const res = await dynamoDb.delete(params).promise();
		console.log(res);

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
