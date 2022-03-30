## User Status

The following are the user status recognized by the voice server:

    offline: 0
    online: 1
    busy: 2

Send a message with the following format

`|0|5|from_id|0|status_payload|`

The message will be sent as a `group` channel and the `to` field is set to zero, which means it's ignored.

Set the user status as an integer on the status_payload field. Then, server will interpret each of them accordingly.

An `offline` status will indicate the user as offline, and socket connection remains unchanged. Client side should decide when to close connection. 

All status will be distributed to all connected clients. 

**Periodic ping**, to improve user status detection, clients should send a periodic ping data with `voiceping:<user_id>` where `user_id` is an integer value of the user id.

For every 2 minutes, server will query the latest time when the client sends ping data. If there is no ping data after 5 minutes **and** client had sent a ping before with its `user_id`, the user will be considered as offline.

**On login**, mobile clients could get the user status string from the `status` field or an integer from `statusValue` field of `/api/v2/users` and they are also available at `/api/v2/users/:id`.

**Note**: On socket connection, a user will be automatically mapped to each of
their own channels, so imagine these scenarios:

* offline -> online:

There's a transition between disconnected state and connected state. As a
result, the user will be automatically mapped to their own channels, and considered as online. An additional user status will just be forwarded to all the other users.

* online -> busy:

A user should control their own device state (e.g: muted or `do not disturb`). The server will only function as a broadcaster to other users, that the particular user is busy, and it doesn't control the privacy settings of the user.

* busy -> online:

Similar to above, a user should control their own device state (e.g: muted or `do not disturb`). The server will only function as a broadcaster to other users, that the particular user is no longer busy, but it doesn't control the privacy settings of the user.

