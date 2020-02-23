'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

const performDelete = async (dbTable, id) => {
	const getParams = {
		TableName: dbTable,
		Key: {
			id
		}
	};

	try {
		const getRes = await dynamoDb.get(getParams).promise();

		console.log(getRes);

		if (getRes.Item && getRes.Item.attachment) {
			const s3Params = {
				Bucket: process.env.S3_BUCKET,
				Key: getRes.Item.attachment
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

	const params = {
		TableName: dbTable,
		Key: {
			id
		}
	};

	try {
		const res = await dynamoDb.delete(params).promise();
		console.log('res : ' + JSON.stringify(res));

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

module.exports.typeGeneral = async (event) => {
	const dbTable = process.env.GENERAL_POSTS_TABLE;
	const id = event.pathParameters.id;

	return await performDelete(dbTable, id);
};

module.exports.typeTips = async (event) => {
	const dbTable = process.env.TIPS_POSTS_TABLE;
	const id = event.pathParameters.id;

	return await performDelete(dbTable, id);
};

module.exports.typeQna = async (event) => {
	const dbTable = process.env.QNA_POSTS_TABLE;
	const id = event.pathParameters.id;

	return await performDelete(dbTable, id);
};

module.exports.typeTrade = async (event) => {
	const dbTable = process.env.TRADE_POSTS_TABLE;
	const id = event.pathParameters.id;

	return await performDelete(dbTable, id);
};
