'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.confirmUserTrigger = async (event) => {
	// Check event and handle accordingly
};
