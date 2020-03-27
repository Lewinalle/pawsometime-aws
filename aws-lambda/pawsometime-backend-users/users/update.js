'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);
	console.log(data);

	let attrValues = {};
	let updateExp = '';
	let shouldLog = false;

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
		shouldLog = true;
	}

	if (data.avatar && typeof data.avatar === 'string') {
		attrValues[':avatar'] = data.avatar;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'avatar = :avatar';
		shouldLog = true;
	}

	if (data.neverLoggedIn !== undefined && typeof data.neverLoggedIn === 'boolean') {
		attrValues[':neverLoggedIn'] = data.neverLoggedIn;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'neverLoggedIn = :neverLoggedIn';
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

	const getParams = {
		TableName: process.env.USERS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	let getRes;
	try {
		getRes = await dynamoDb.get(getParams).promise();
		console.log(getRes);
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'update',
			resource: 'user',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: getRes.Item.id,
			userName: getRes.Item.userName,
			createdAt: timestamp
		}
	};

	try {
		const res = await dynamoDb.update(params).promise();
		console.log(res);

		if (shouldLog === true) {
			const historyRes = await dynamoDb.put(historyParams).promise();
			console.log('historyRes', historyRes);
		}

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
