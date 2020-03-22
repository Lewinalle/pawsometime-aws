'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

module.exports.delete = async (event) => {
	const timestamp = new Date().getTime();

	const getParams = {
		TableName: process.env.GALLERY_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	let getRes;
	try {
		getRes = await dynamoDb.get(getParams).promise();

		console.log(getRes);

		if (getRes.Item && getRes.Item.photo) {
			const s3Params = {
				Bucket: process.env.S3_BUCKET,
				Key: getRes.Item.photo
			};

			const deleteRes = await s3.deleteObject(s3Params);
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
			action: 'delete',
			resource: 'gallery',
			resourceId: getRes.Item.id,
			resourceType: null,
			userId: getRes.Item.userId,
			userName: getRes.Item.userName,
			createdAt: timestamp
		}
	};

	const params = {
		TableName: process.env.GALLERY_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		const res = await dynamoDb.delete(params).promise();
		console.log(res);

		const historyRes = await dynamoDb.put(historyParams).promise();
		console.log('historyRes', historyRes);

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
