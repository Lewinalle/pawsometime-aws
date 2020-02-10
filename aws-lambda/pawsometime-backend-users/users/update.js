'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let attrValues = {};
	let updateExp = '';

	// validation
	if (Object.keys(data).length === 0 && data.constructor === Object) {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Empty object provided.',
				userMessage: 'You must provide information to update.'
			})
		};
	}

	if (data.description && typeof data.description === 'string') {
		attrValues[':description'] = data.description;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'description = :description';
	}

	if (data.avatar && typeof data.avatar === 'string') {
		attrValues[':avatar'] = data.avatar;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'avatar = :avatar';
	}

	if (data.confirmed && typeof data.confirmed === 'boolean') {
		attrValues[':confirmed'] = data.confirmed;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'confirmed = :confirmed';
	}

	if (updateExp === '') {
		console.error('No field matching for update');
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Nothing to update.',
				userMessage: 'There is nothing to update.'
			})
		};
	}

	attrValues[':updatedAt'] = timestamp;
	updateExp += ', updatedAt = :updatedAt';

	const params = {
		TableName: process.env.USERS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: attrValues,
		UpdateExpression: `SET ${updateExp}`,
		ReturnValues: 'ALL_NEW'
	};

	try {
		const res = await dynamoDb.update(params).promise();
		console.log(res);

		return {
			statusCode: 200,
			body: JSON.stringify(res.Attributes)
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
