'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let attrValues = {};
	let updateExp = '';

	// validation
	if (typeof data.type !== 'string' || (Object.keys(data).length === 0 && data.constructor === Object)) {
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

	let dbTable;
	if (data.type.toLowerCase() === 'general') {
		dbTable = process.env.GENERAL_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'tips') {
		dbTable = process.env.TIP_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'qna') {
		dbTable = process.env.QNA_POSTS_TABLE;
	} else if (data.type.toLowerCase() === 'trade') {
		dbTable = process.env.TRADE_POSTS_TABLE;
	} else {
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed! type is not valid',
				userMessage: 'Valid type of post must be provided'
			})
		};
	}

	const params = {
		TableName: dbTable,
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
