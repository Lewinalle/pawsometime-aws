'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.request = async (event) => {
	const timestamp = new Date().getTime();
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;
	let userFound;
	let friendFound;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
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
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
				userFound = item;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
				friendFound = item;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (userFriendsObj.sent.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request already sent',
				userMessage: 'There is an existing friend request.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	let action;
	if (userFriendsObj.pending.includes(data.friendId)) {
		// remove userId from friendId's sent
		newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

		// remove friendId from userId's pending
		newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

		// add each other's id to both userId's friends and friendId's friends
		newFriendFriendsObj.friends.push(data.userId);
		newUserFriendsObj.friends.push(data.friendId);

		action = 'connect';
	} else {
		// add userId to friendId's pending
		newFriendFriendsObj.pending.push(data.userId);

		// add friendId to userId's sent
		newUserFriendsObj.sent.push(data.friendId);

		action = 'request';
	}

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: action,
			resource: 'user',
			resourceId: userFound.id,
			resourceType: 'friend',
			userId: friendFound.id,
			userName: friendFound.username,
			createdAt: timestamp
		}
	};

	let friendHistoryParams;

	if (action === 'connect') {
		friendHistoryParams = {
			TableName: process.env.HISTORY_TABLE,
			Item: {
				id: uuid.v4(),
				action: action,
				resource: 'user',
				resourceId: friendFound.userId,
				resourceType: 'friend',
				userId: userFound.id,
				userName: userFound.username,
				createdAt: timestamp
			}
		};
	}

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		const historyRes = await dynamoDb.put(historyParams).promise();
		console.log('historyRes', historyRes);

		if (friendHistoryParams) {
			const friendHistoryRes = await dynamoDb.put(friendHistoryParams).promise();
			console.log('friendHistoryRes', friendHistoryRes);
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
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
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;
	let userFound;
	let friendFound;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
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
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
				userFound = item;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
				friendFound = item;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.pending.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request not found',
				userMessage: 'The friend request is not found.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	// add each other's id
	newFriendFriendsObj.friends.push(data.userId);
	newUserFriendsObj.friends.push(data.friendId);

	// remove userId from friendId's sent
	newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

	// remove friendId from userId's pending
	newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

	// remove from sent if any
	if (userFriendsObj.sent.includes(data.friendId)) {
		newUserFriendsObj.sent = userFriendsObj.sent.filter((item) => item !== data.friendId);
	}

	const friendHistoryParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'connect',
			resource: 'user',
			resourceId: userFound.id,
			resourceType: 'friend',
			userId: friendFound.id,
			userName: friendFound.username,
			createdAt: timestamp
		}
	};

	const historyParams = {
		TableName: process.env.HISTORY_TABLE,
		Item: {
			id: uuid.v4(),
			action: 'connect',
			resource: 'user',
			resourceId: friendFound.id,
			resourceType: 'friend',
			userId: userFound.id,
			userName: userFound.username,
			createdAt: timestamp
		}
	};

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		const historyRes = await dynamoDb.put(historyParams).promise();
		console.log('historyRes', historyRes);

		const friendHistoryRes = await dynamoDb.put(friendHistoryParams).promise();
		console.log('friendHistoryRes', friendHistoryRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
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
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
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
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.pending.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request not found',
				userMessage: 'The friend request is not found.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	// remove userId from friendId's sent
	newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

	// remove friendId from userId's pending
	newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
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
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
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
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.sent.includes(data.friendId) || !friendFriendsObj.pending.includes(data.userId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request not found',
				userMessage: "The user hasn't sent a request yet."
			})
		};
	}

	newFriendFriendsObj.pending = friendFriendsObj.pending.filter((item) => item !== data.userId);
	newUserFriendsObj.sent = userFriendsObj.sent.filter((item) => item !== data.friendId);

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};

module.exports.remove = async (event) => {
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
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
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.friends.includes(data.friendId) || !friendFriendsObj.friends.includes(data.userId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend not found',
				userMessage: 'The user is not a friend yet.'
			})
		};
	}

	newFriendFriendsObj.friends = friendFriendsObj.friends.filter((item) => item !== data.userId);
	newUserFriendsObj.friends = userFriendsObj.friends.filter((item) => item !== data.friendId);

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
