'use strict';

const uuid = require('uuid');
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

	if (data.title && typeof data.title === 'string') {
		attrValues[':title'] = data.title;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'title = :title';
	}

	if (data.description && typeof data.description === 'string') {
		attrValues[':description'] = data.description;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'description = :description';
	}

	if (data.latlon && typeof data.latlon === 'object') {
		attrValues[':latlon'] = data.latlon;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'latlon = :latlon';
	}

	if (data.isPrivate && typeof data.isPrivate === 'boolean') {
		attrValues[':isPrivate'] = data.isPrivate;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'isPrivate = :isPrivate';
	}

	if (data.attachment && typeof data.attachment === 'string') {
		attrValues[':attachment'] = data.attachment;
		if (updateExp !== '') {
			updateExp += ', ';
		}
		updateExp += 'attachment = :attachment';
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
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: attrValues,
		UpdateExpression: `SET ${updateExp}`,
		ReturnValues: 'ALL_NEW'
	};

	const getParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	let getRes;
	try {
		getRes = await dynamoDb.get(getParams).promise();
		console.log(getRes);

		if (!getRes || !getRes.Item) {
			return {
				statusCode: 422,
				body: JSON.stringify(err)
			};
		}
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
			resource: 'meetup',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: getRes.Item.userId,
			userName: getRes.Item.userName,
			createdAt: timestamp
		}
	};

	try {
		const res = await dynamoDb.update(params).promise();
		console.log(res);

		const historyRes = await dynamoDb.put(historyParams).promise();
		console.log('historyRes', historyRes);

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
