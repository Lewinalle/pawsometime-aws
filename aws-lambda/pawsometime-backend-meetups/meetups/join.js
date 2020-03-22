'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.autoJoin = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let pending = [];
	let joined = [];

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.pending || !res.Item.joined) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		pending = res.Item.pending;
		joined = res.Item.joined;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const isPending = pending.find((item) => item.userId === data.userId);
	const isJoined = joined.find((item) => item.userId === data.userId);

	if (isPending || isJoined) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User already either requested or joined.',
				userMessage: 'The user already either requested or joined.'
			})
		};
	}

	joined.push({
		userId: data.userId,
		userName: data.userName,
		userAvatar: data.userAvatar ? data.userAvatar : null
	});

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':joined': joined
		},
		UpdateExpression: 'SET joined = :joined',
		ReturnValues: 'ALL_NEW'
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'join',
			resource: 'meetup',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: data.userId,
			userName: data.userName,
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

module.exports.request = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let pending = [];
	let joined = [];

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.pending || !res.Item.joined) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		pending = res.Item.pending;
		joined = res.Item.joined;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const isPending = pending.find((item) => item.userId === data.userId);
	const isJoined = joined.find((item) => item.userId === data.userId);

	if (isPending || isJoined) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User already either requested or joined.',
				userMessage: 'The user already either requested or joined.'
			})
		};
	}

	pending.push({
		userId: data.userId,
		userName: data.userName,
		userAvatar: data.userAvatar ? data.userAvatar : null
	});

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':pending': pending
		},
		UpdateExpression: 'SET pending = :pending',
		ReturnValues: 'ALL_NEW'
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'request',
			resource: 'meetup',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: data.userId,
			userName: data.userName,
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

module.exports.accept = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let pending = [];
	let joined = [];

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.pending || !res.Item.joined) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		pending = res.Item.pending;
		joined = res.Item.joined;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const isPending = pending.find((item) => item.userId === data.userId);
	const isJoined = joined.find((item) => item.userId === data.userId);

	if (!isPending || isJoined) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'No request found or user has already joined.',
				userMessage: 'Could not find request or user has already joined.'
			})
		};
	}

	const newPending = pending.filter((item) => item.userId !== data.userId);
	joined.push(isPending);

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':pending': newPending,
			':joined': joined
		},
		UpdateExpression: 'SET pending = :pending, joined = :joined',
		ReturnValues: 'ALL_NEW'
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'accept',
			resource: 'meetup',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: data.userId,
			userName: data.userName,
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

module.exports.reject = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);

	let pending = [];
	let joined = [];

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.pending || !res.Item.joined) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		pending = res.Item.pending;
		joined = res.Item.joined;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const isPending = pending.find((item) => item.userId === data.userId);
	const isJoined = joined.find((item) => item.userId === data.userId);

	if (!isPending || isJoined) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'No request found or user has already joined.',
				userMessage: 'Could not find request or user has already joined.'
			})
		};
	}

	const newPending = pending.filter((item) => item.userId !== data.userId);

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':pending': newPending
		},
		UpdateExpression: 'SET pending = :pending',
		ReturnValues: 'ALL_NEW'
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'reject',
			resource: 'meetup',
			resourceId: event.pathParameters.id,
			resourceType: null,
			userId: data.userId,
			userName: data.userName,
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

module.exports.cancel = async (event) => {
	const data = JSON.parse(event.body);

	let pending = [];
	let joined = [];

	// validation
	if (typeof data.userId !== 'string' || typeof data.userName !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		}
	};

	try {
		let res = await dynamoDb.get(searchParams).promise();

		if (!res.Item || !res.Item.pending || !res.Item.joined) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Resource is not found.',
					userMessage: 'Resource is not found.'
				})
			};
		}

		pending = res.Item.pending;
		joined = res.Item.joined;
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const newPending = pending.filter((item) => item.userId !== data.userId);
	const newJoined = joined.filter((item) => item.userId !== data.userId);

	const params = {
		TableName: process.env.MEETUPS_TABLE,
		Key: {
			id: event.pathParameters.id
		},
		ExpressionAttributeValues: {
			':pending': newPending,
			':joined': newJoined
		},
		UpdateExpression: 'SET pending = :pending, joined = :joined',
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
