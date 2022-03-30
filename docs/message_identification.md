## Voice Message Identification

To be able to identify which messages are being sent or delivered, we used the concept of `message_id`, which is tied to each offline message being saved and cached on the server.

After a user has stopped talking, a `message_id` will be included in the `7: ack_stop` (acknowledge stop) message payload buffer to be sent back to the sender.

`|1|7|sender|receiver|message_id|"Acknowledged"|`

A separate `2: stop_talking` message is forwarded to the receiver, with `message_id` included in the JSON payload as a payload buffer. The message information is a JSON payload with the following structure:

```json
# Duration is in milisecond unit
{
    "message_id": "<message_id of the voice / text message>",
    "duration": 3120
}
```

The above message payload is attached to the payload buffer (the last field in the `msgpack` structure).

`|1|2|sender|receiver|{message info}|`

Afterwards, receiver should send a `20: delivered_message` to notify the sender that the message has been received.

If a user has read the message (via whatever means determined by the mobile client), `21: read_message` can be used to notify the sender that, message has been read.

## Text Message Identification

Historically, the sender attached a `message_id` inside a JSON payload sent to the server as a text message in the following format:

    {
        "message_id": channeltype_messagetype_to_from_timestamp.txt,
        "text": "Hello"
    }

Because we need to synchronize timestamp, this value should be calculated by the server. To support older clients, server will always replace the `message_id` value inside the text payload being sent from the sender.

As a result, the JSON payload is still the same, but with a message_id from the server.

    {
        "message_id": <server_generated_message_id>,
        "text": "Hello"
    }


This `message_id` will be forwarded to the receiver to track the text message that is sent, delivered and read. It's also used to store the message as an offline message at AWS S3.

The responsibilities of the sender:

1. Obtain the `message_id` value received from `22: acknowledge_text` message, and use this value to update the data model with both `message_id` and `timestamp` that represents the text message that was sent.
2. Update the state of the text message corresponding to `20: delivered_message` and `21: read_message` messages that were received from the server.

The responsibilities of the receiver:

1. Obtain the `message_id` value from the JSON payload, and tokenize the string to get the timestamp of the message. Both `message_id` and `timestamp` should be used on the data model of the text message on the receiver's side.
2. Send a `20: delivered_message` with this `message_id` immediately after the text message is received.
3. Send a `21: read_message` with this `message_id` after the user has read the message within the user interface.
