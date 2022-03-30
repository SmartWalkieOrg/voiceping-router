### 1.6.7 (2017-03-21)


#### Bug Fixes

* **cpu:** [Fix #140461775] 100% CPU Usage ([948e8857](https://github.com/SmartWalkieOrg/voiceover-server/commit/948e88572b884af533a9d0da226dde6a3169f7dc))


### 1.6.7 (2017-03-18)


#### Bug Fixes

* **travis:** testing users password has been changed ([84ed3259](https://github.com/SmartWalkieOrg/voiceover-server/commit/84ed3259cbc84567bd4efb1ee1175e6b3e469f98))


#### Features

* **tracer:** [#140461775] add CPU & HEAP tracers ([3d4e0940](https://github.com/SmartWalkieOrg/voiceover-server/commit/3d4e09403ffd12009689ac4685624eca6e5d70d7))


### 1.6.6 (2017-03-07)


#### Bug Fixes

* **presence:** [Fix #141196075] TypeError: Cannot read property 'id' of undefined ([a3951984](https://github.com/SmartWalkieOrg/voiceover-server/commit/a395198414187ccbad9aa6a5ec494c88b7e141e6))


### 1.6.4.1 (2017-03-04)


### 1.6.4 (2017-03-04)


### 1.4.8 (2016-03-29)

* Cleaned up papertrail logging
* Separate papertrail logging destination for replica instance

### 1.4.7 (2016-03-16)


#### Bug Fixes

* **sockets:** Clear duplicate sockets mapping on connection ([d5e60cf8](https://github.com/2359media/voiceover-server/commit/d5e60cf840f359a7b7dbe4b63fee3874bd91f873))


### 1.4.6 (2016-03-14)


#### Bug Fixes

* **nzero-push:**
  * Updated nzero-push ([765d78ec](https://github.com/2359media/voiceover-server/commit/765d78ec19a59a75c01a5ef23c844be58361a9b2))
  * Updated nzero-push /broadcast and test case ([1a335659](https://github.com/2359media/voiceover-server/commit/1a335659f5ccade2e8c4cba5021665dc4bef3f9d))
* **pushvoip:**
  * Back to using server token ([ad11548d](https://github.com/2359media/voiceover-server/commit/ad11548d6a7be43aa48be7855dd1fbc3b0f61c48))
  * Temporarily config for pushwoosh ([8f59f5e9](https://github.com/2359media/voiceover-server/commit/8f59f5e9276c9729aa908f3fd5ee17a78e7e872e))
  * Updated nzero-push for pushwoosh ([473b4063](https://github.com/2359media/voiceover-server/commit/473b4063c91ec3171d8a097d93acd868baef919a))


#### Features

* **pushvoip:**
  * Put back device token management ([b1ab1b91](https://github.com/2359media/voiceover-server/commit/b1ab1b91a170d171a13e9d44223b411af8985a62))
  * Migrate from zeropush to pubnub ([0113854a](https://github.com/2359media/voiceover-server/commit/0113854a9d85678308dfeadf528038d315bffd78))


### 1.4.5 (2015-11-20)


#### Bug Fixes

* **pushvoip:**
  * Clean up device token is needed ([eaab1847](https://github.com/2359media/voiceover-server/commit/eaab1847e6732bc4b492de7a455f5ab51bed9ce3))
  * device token for android should be set ([c7587a3f](https://github.com/2359media/voiceover-server/commit/c7587a3fc0fcc86cad9fd638cfc8c8dabdffbb02))


### 1.4.4 (2015-10-02)


#### Bug Fixes

* **group:** We don't need to cleanup channel ([f0467b08](https://github.com/2359media/voiceover-server/commit/f0467b088710d4bcea8c14a722c09cfd448a6b82))
* **group text:** Should use S3 bucket key for message id ([46957215](https://github.com/2359media/voiceover-server/commit/4695721561a6a9e313d359e695104e5586240b32))
* **push:** Fix a few push notification issues ([5167a896](https://github.com/2359media/voiceover-server/commit/5167a896b6c2af01892758c54c57ab9052f6e792))


#### Features

* **push:** Send text content in push payload. ([6bc096ae](https://github.com/2359media/voiceover-server/commit/6bc096aedfb103a1c50a13780a2acb94f5f40508))


### 1.4.2 (2015-09-25)

* **push:** Should send push for text and image ([03c20ceb](https://github.com/2359media/voiceover-server/commit/03c20cebc08a4238a62efe79cca04853db93f2e9))


### 1.4.1 (2015-09-21)

* eslint cleanup


## 1.4.0 (2015-09-01)


#### Bug Fixes

* **offline message:** group audio message caching. ([26f0e8c3](https://github.com/2359media/voiceover-server/commit/26f0e8c343024f0844163043158d9adc35f64105))
* **status:** Set last seen timeout to 6 minutes ([f6a56757](https://github.com/2359media/voiceover-server/commit/f6a56757a66002b992aeb9782c7a97e8dcf7fb61))
* **user sockets:** Verify object property. ([7e7bf1fd](https://github.com/2359media/voiceover-server/commit/7e7bf1fd108d4d5059cd4d77156d9d0454b34396))


#### Features

* **offline message:**
  * Limit cache to 100. ([8849b5f6](https://github.com/2359media/voiceover-server/commit/8849b5f6ca000d72b0d9db9ee7a08a31998e39ac))
  * group message cache list ([c1d73575](https://github.com/2359media/voiceover-server/commit/c1d735750efd105c7afafd78093b86d154457e15))
  * Stream group offline message ([7582be85](https://github.com/2359media/voiceover-server/commit/7582be85ce343909d931625841f2a0e329db2f23))
  * private / group offline message compatibility ([f2b42870](https://github.com/2359media/voiceover-server/commit/f2b428705532525f458fc29af0cbc3dbddbb7629))


### 1.3.8 (2015-08-18)


#### Bug Fixes

* **mediarecord:**
  * Separate the format variable ([83bff504](https://github.com/2359media/voiceover-server/commit/83bff504c0900b4253e831f423cb75548c52e983))
  * Fixed resume payload streaming. ([fcd66c14](https://github.com/2359media/voiceover-server/commit/fcd66c1409f288032e85c73982ccf2f67f65ef7e))
  * media format passing on upload ([c4a80a91](https://github.com/2359media/voiceover-server/commit/c4a80a914b3223b695ec35c58535abea612fdbfd))
  * Should pass the full payload on finalize ([edba10b9](https://github.com/2359media/voiceover-server/commit/edba10b9569d59d6091cc4b68c95f738605ea7d4))
* **status:** Set last seen timeout to 6 minutes ([6c20dd83](https://github.com/2359media/voiceover-server/commit/6c20dd83b89bda5908da0e584fbf7be1f6f43ef2))
* **text message:** Generate message_id & timestamp from server ([2a8a309c](https://github.com/2359media/voiceover-server/commit/2a8a309c8e4f4d69613e35a0d6a24f79f85fde1e))


### 1.3.7 (2015-07-28)


#### Bug Fixes

* **cleanup sockets:** cleanup sockets and channels based on userId ([f5e992e6](https://github.com/2359media/voiceover-server/commit/f5e992e6a4458f8677599cbf439f4b1b409bbaee))
* **periodic functions:** Improved periodic checkup ([dc50102c](https://github.com/2359media/voiceover-server/commit/dc50102c0c1bf8b4f7539299deed4a352adc459a))
* **ping pong:** Set last seen time on pong. ([c5d17af4](https://github.com/2359media/voiceover-server/commit/c5d17af46d3a396a85fad08a9fbfe58262413e2f))
* **socket close:** Better way to cleanup socket. ([9bf2b1cc](https://github.com/2359media/voiceover-server/commit/9bf2b1cc693d95cf73e05f6871640f05fca2ed1b))
* **user status:** pong response improvements. ([c2d60f66](https://github.com/2359media/voiceover-server/commit/c2d60f660ff501027feab914d16ec3bfbcbad7cf))


### 1.3.6 (2015-07-16)


#### Bug Fixes

* **broadcast:** Minimize channel / user broadcasts ([3cc8b7b9](https://github.com/2359media/voiceover-server/commit/3cc8b7b902cfa1232baac3fbcae205749d53a1e2))
* **users query:** Made the user authentication more efficient. ([967cb50f](https://github.com/2359media/voiceover-server/commit/967cb50f2437b1d3650be3ebb7c760c60f46bb9f))


#### Features

* **version:** Send version information on connect ([a955695a](https://github.com/2359media/voiceover-server/commit/a955695adadbf615df5be03cc145bc0409dea981))


### 1.3.5 (2015-07-01)


#### Bug Fixes

* **channels:**
  * Fix users verified channels update ([f176f2cc](https://github.com/2359media/voiceover-server/commit/f176f2cc21dff5729a776f1d668b16e2e4b9e44c))
  * Maintain  update of in-memory user's channels ([86d35d16](https://github.com/2359media/voiceover-server/commit/86d35d169794944d18d054fb774b80aea7e2d61f))
* **privilege:** Allow everyone to use voice. ([7a3fe7cb](https://github.com/2359media/voiceover-server/commit/7a3fe7cb399594c27a631b9f9901edfc5413db91))
* **voice schedule:** It should start in 4am ([2ccb8dbe](https://github.com/2359media/voiceover-server/commit/2ccb8dbe8d41237c64accc794fac986a0ca4d667))
* **voicebot cache:** disable messageId caching. ([b2e86247](https://github.com/2359media/voiceover-server/commit/b2e862472ab51e2457272884ac0406eb6035f096))


### 1.3.4 (2015-06-19)


#### Bug Fixes

* **websocket headers:** Improved request headers ([14897d74](https://github.com/2359media/voiceover-server/commit/14897d74c9c9c363a174122a9c69a2008228990b))


#### Features

* **last seen time:** Record user last seen time. ([b0b35127](https://github.com/2359media/voiceover-server/commit/b0b351278e467244886c5fe7633373ba8ec55395))


### 1.3.3 (2015-06-18)


#### Bug Fixes

* **duplicate login:**
  * Fixed callback handlers ([d74a3ade](https://github.com/2359media/voiceover-server/commit/d74a3ade756812ba78383f3b1fd74c250596f5cc))
  * Improved device id detection. ([26c0b58e](https://github.com/2359media/voiceover-server/commit/26c0b58ede9224022df2816bab53614b05d7976b))
  * Improved duplicate login. ([bb51ee90](https://github.com/2359media/voiceover-server/commit/bb51ee90c55c1138c115b0f57fc830f06a3a5219))
* **voicebot:**
  * Make sure duration is from a valid object ([257ec75d](https://github.com/2359media/voiceover-server/commit/257ec75d4d272815e4b8a059da38ee9f223560b0))
  * Fixed bot voice scheduling ([e8b4d9e2](https://github.com/2359media/voiceover-server/commit/e8b4d9e29c41598485854272f4969a219440c970))


### 1.3.2 (2015-06-12)


#### Bug Fixes

* **user_offline:** Improved user offline handling ([44f4e335](https://github.com/2359media/voiceover-server/commit/44f4e3359b4032a78ec6bd6a22388efbf3a6fd3a))


### 1.3.1 (2015-06-12)


#### Bug Fixes

* **voicebot:** Refine the scheduling date. ([909320f7](https://github.com/2359media/voiceover-server/commit/909320f7b46333a5c8cdcaf9c7ff4804790d518f))


## 1.3.0 (2015-06-08)


#### Bug Fixes

* **measurement timer:** Should be cleared when not in use ([1380d735](https://github.com/2359media/voiceover-server/commit/1380d735128f1f1e964ac3f958f56ae188cbbcbe))
* **mediarecord:** Only list valid offline messages ([d9e945be](https://github.com/2359media/voiceover-server/commit/d9e945beb2301a2bc17ed6c440a10c1373c2c48b))
* **voicebot:** JSON payload for the bot message. ([a2ff0597](https://github.com/2359media/voiceover-server/commit/a2ff0597f5972026c43749678ac07eb3211c98d6))


#### Features

* **mediarecord:** Added mime type lookup for the media ([62b8c0ab](https://github.com/2359media/voiceover-server/commit/62b8c0ab14c5f87ed2ec8f62cf870b402a351b0e))
* **voicebot:**
  * Schedule the next voice after the previous one. ([1d53f0f5](https://github.com/2359media/voiceover-server/commit/1d53f0f526105a8e92232ebb2f2b7d570d82cf9f))
  * Improved message id management ([a357cbc0](https://github.com/2359media/voiceover-server/commit/a357cbc03bb6fd7e54543c564b1f064e832a5b88))
  * Improved logging. ([673ea23a](https://github.com/2359media/voiceover-server/commit/673ea23a551c93a1061d745d1ba95e8d372642c9))
  * Track scheduled & sent voice ([30db2c74](https://github.com/2359media/voiceover-server/commit/30db2c743d55d67e9d4d85ed9099a30b6ff3e76f))
  * fix payload and view job status ([77f64b63](https://github.com/2359media/voiceover-server/commit/77f64b630b4bc8c2c6919ba36b8fdb3ba195f896))
  * Initial setup of voicebot jobs ([3d10878b](https://github.com/2359media/voiceover-server/commit/3d10878bc1e131b0d5e51d88df12a8a1cb0f0fc7))


### 1.2.10 (2015-05-15)


#### Features

* **text:**
  * Improved text messaging ([d74af035](https://github.com/2359media/voiceover-server/commit/d74af03579cb6fb4fca199f98a1a2fffe973e0ab)), ([edea6bdd](https://github.com/2359media/voiceover-server/commit/edea6bddf99ca38bb6e417446d67faade8d8b896)).


### 1.2.9 (2015-05-07)


#### Bug Fixes

* **newrelic:** Turn off newrelic for a while. ([023abcc6](https://github.com/2359media/voiceover-server/commit/023abcc69d74ee24acfbf7ae8a8011f6b9c45945))


### 1.2.8 (2015-05-01)


#### Bug Fixes

* **stop_talking:** More reliant stop talking ([e670cbd8](https://github.com/2359media/voiceover-server/commit/e670cbd88e555b18c6a9daf1cd278f1484c1b6e7))


### 1.2.7 (2015-04-29)


#### Bug Fixes

* **channels:** verifiedChannels should be valid ([cb3a1345](https://github.com/2359media/voiceover-server/commit/cb3a13459445f5e87bbb8f7d11d58c91d1087cd9))


### 1.2.6 (2015-04-27)


#### Bug Fixes

* **busy state:** Not checking socket to determine busy ([9d281afe](https://github.com/2359media/voiceover-server/commit/9d281afe220bc0ba347fbd351f74947db0a515a7))


### 1.2.5 (2015-04-27)


#### Bug Fixes

* **busy state:** return if there's channel interruption ([ece401c9](https://github.com/2359media/voiceover-server/commit/ece401c91eb5eec95d35ec2a876157f42a298f77))
* **verify users:** Always cache the users ([1c6cbfc2](https://github.com/2359media/voiceover-server/commit/1c6cbfc2612df2dbd795c1d98268ce179b2f3f18))


### 1.2.4 (2015-04-27)


#### Bug Fixes

* **channel state:**
  * Verify clientId and channelId ([5c4aed05](https://github.com/2359media/voiceover-server/commit/5c4aed05afb0ab8715ccdfe0c75f8b08bb4d723d))
  * Fixed reset busy state. ([0b2572ff](https://github.com/2359media/voiceover-server/commit/0b2572ff6a0fd117209fa97bb1f0e6438bdc27d6))
* **redis:** create redis client on one module. ([6f61560b](https://github.com/2359media/voiceover-server/commit/6f61560bc6a44a27b53179cc10522e1c28b0ef76))
* **reset state:** Channel state and record stream ([aaade511](https://github.com/2359media/voiceover-server/commit/aaade5112fc00cea372ad0943101ebb69f4f11e1))
* **usernames cache:** Should cache after it's populated ([2ecb97bd](https://github.com/2359media/voiceover-server/commit/2ecb97bd91f8b6e51840fb8f3049674570d58c70))


### 1.2.3 (2015-04-15)


#### Bug Fixes

* **channel:** reset busy state after 1 minute talk. ([4990c238](https://github.com/2359media/voiceover-server/commit/4990c238267aa1792f61ecb9935e301321aecdfa))
* **record stream:** Handle stream write errors ([fd08a93f](https://github.com/2359media/voiceover-server/commit/fd08a93fc7c14720db4420de2e4b5272703329b2))


#### Features

* **group message:** Send group message id to sender on ACK_STOP ([7ecfb24b](https://github.com/2359media/voiceover-server/commit/7ecfb24bb114b31720824faddc11f64a93450a1c))


### 1.2.2 (2015-04-08)


#### Bug Fixes

* **ack stop:** Send ACK_STOP for group message. ([5de411ae](https://github.com/2359media/voiceover-server/commit/5de411ae8d57b4d68246c75b4393d93ddd4700e1))
* **user status:**
  * Only publish user offline on the presence handler ([8991654e](https://github.com/2359media/voiceover-server/commit/8991654e64d8c5c72f3c69d4ce2d8fa777321c5c))
  * Decouple user status from socket connection. ([f5bd3a4e](https://github.com/2359media/voiceover-server/commit/f5bd3a4ec41c44fed83da2e25492d1983bcd7a0b))
* **username:** cache username on channel update. ([053d9b72](https://github.com/2359media/voiceover-server/commit/053d9b7220c6683726891c1b04d7167b590f2888))


### 1.2.1 (2015-04-02)


#### Bug Fixes

* **type checking:** For id comparison. ([379ca564](https://github.com/2359media/voiceover-server/commit/379ca5640d08f5110159c129e494b70fb0a53056))

Including comparison of which users to received push notification.


## 1.2.0 (2015-04-02)


#### Bug Fixes


* **channels:**
  * Improving cache for multi-process [#24](https://github.com/2359media/voiceover-server/pull/24).
  * Cache channel states and users with redis.
  * Some operations can also be made more robust with redis data types.
  * Made sure a non-clustered setup could also run.
  * This way we don't always need to rely on updating the in-memory variables by using messaging.
  * At certain events (connection/disconnection, start talking, stop talking) query redis to get the latest data.

* **pingpong:** duplicate pong response. ([11ae071b](https://github.com/2359media/voiceover-server/commit/11ae071b1e2fa9251df403ba20a69eb1a2fdbf94))
* **private message:** Send the message immediately if != STOP_TALKING ([8c6f9817](https://github.com/2359media/voiceover-server/commit/8c6f98178a2f3333420aed04594f97d4f58fb45c))


#### Features

* **ack_start:** Also send payload from clients ([bfb0c2f2](https://github.com/2359media/voiceover-server/commit/bfb0c2f2d577524508091977cb709a01a0317057))


### 1.1.3 (2015-03-29)


#### Bug Fixes

* **pushvoip:** Filter the sender on group notify ([111a9fc4](https://github.com/2359media/voiceover-server/commit/111a9fc4ddaf058e2e5d23d5d4b879da7d58b94b))


### 1.1.2 (2015-03-28)


#### Bug Fixes

* **channel:** Let unrecognized sender send data ([5ebdf291](https://github.com/2359media/voiceover-server/commit/5ebdf291a973fa415232ecc2a6910c0e3a1c97ba))
* **push voip:**
  * Back to using node-redis. ([01cb92d9](https://github.com/2359media/voiceover-server/commit/01cb92d9e50c630fb0fe7308650e35854d0bd2fd))
  * zero push notify error logging. ([c48e1922](https://github.com/2359media/voiceover-server/commit/c48e1922ba48af618d6044bf432f40a266860bd9))
  * Refactor username caching. ([68b25508](https://github.com/2359media/voiceover-server/commit/68b25508f27b082bd3fd55ea12f61dfcf40d4f4d))
  * register device token checking ([d61e6bd6](https://github.com/2359media/voiceover-server/commit/d61e6bd6c14a9a4381dd02f26acfeb9409d77aef))
  * Verify device token for all zpush api calls. ([d4a2973c](https://github.com/2359media/voiceover-server/commit/d4a2973c2cae5f566067f80df56adeb3be96bb2f))


### 1.1.1 (2015-03-27)


#### Bug Fixes

* **push voip:** Validate device token before registering. ([332cef3c](https://github.com/2359media/voiceover-server/commit/332cef3c9dea16cf541b1310d17b30b571bb017b))


## 1.1.0 (2015-03-27)

#### Bug Fixes

* **mediaRecord:** stream offline message callback handler ([43048d85](https://github.com/2359media/voiceover-server/commit/43048d8537717f925c9064f2e48e05a97fde6683))
* **messaging:** Handle control message in its own function ([b0d7bd7f](https://github.com/2359media/voiceover-server/commit/b0d7bd7f60eb7d40862f387cd0580977635ce8bd))
* **nzero-push:** Using the fixed version of nzero-push ([ddfce07f](https://github.com/2359media/voiceover-server/commit/ddfce07f6c2b90f70b2a32bac1e67b2d2b091eae))
* **private message:** Safer stop talking. ([e9d70740](https://github.com/2359media/voiceover-server/commit/e9d70740d1cbaeaf96c4b84035b3fe24a9303e55))
* **user status:** online status and connection ([dc127568](https://github.com/2359media/voiceover-server/commit/dc1275684d295519d38f472dcb9ffa32fb4e7ae6))
* **voice duration:**
  * Error handling ([dd242573](https://github.com/2359media/voiceover-server/commit/dd242573058ad322a0327d043621ba0e49e535eb))
  * Using redis as the source of timestamp cache. ([254049d6](https://github.com/2359media/voiceover-server/commit/254049d65973c811e27383a5d860d7d4693a8309))


#### Features

* Provide duration on the stop talking message ([32d35b60](https://github.com/2359media/voiceover-server/commit/32d35b609603288973165a6b0218b6fd202637fd))
* **connection:** Also send offline messages on connection message. ([7312d8a1](https://github.com/2359media/voiceover-server/commit/7312d8a10638f6a30ddf39caa7243de8801fadfb))
* **group message:** Introduced group message_id ([d649c57c](https://github.com/2359media/voiceover-server/commit/d649c57ca9e809ad0c19643b9c6943af2673260f))
* **voip push:** get usernames from web server ([e4a3161d](https://github.com/2359media/voiceover-server/commit/e4a3161d53f8c1257d13331e899ae82d9e4319bc))
* **voip_push:** Initial setup for voip push ([0954ebe3](https://github.com/2359media/voiceover-server/commit/0954ebe39f4bd7f3d1a01dc6c3aa9676d7f4666f))


#### Breaking Changes

* mobile clients need to parse a json { message_id: ..., duration: ... }

 ([32d35b60](https://github.com/2359media/voiceover-server/commit/32d35b609603288973165a6b0218b6fd202637fd))


### 1.0.4 (2015-03-16)

#### Bug Fixes

* **user status:** Publish user status with sails.io ([0dda0d5f](https://github.com/2359media/voiceover-server/commit/0dda0d5f387c17d499bc31a947a1df1165cc9bc5))

### 1.0.3 (2015-03-15)

#### Bug Fixes

* **broadcastExceptWS:** When linter is not working. ([73525c38](https://github.com/2359media/voiceover-server/commit/73525c389de412997a037e3476a9c07dc691d3fa))
* **media type:** Get the type from filename. ([9860bf7f](https://github.com/2359media/voiceover-server/commit/9860bf7fe64690c3fafbc7b55fc920796b870f05))
* **offline message:** type parameter is not being used. ([84003530](https://github.com/2359media/voiceover-server/commit/8400353046c16ed71a7d44565c4bd61e0faff452))
* **user_status:** user status should be published. ([bf165b8f](https://github.com/2359media/voiceover-server/commit/bf165b8fb107651cad99af4fe84f6b62d662a9e6))


#### Features

* Added user status message support.
* **online:** Another way to set user as online. ([4933c5b8](https://github.com/2359media/voiceover-server/commit/4933c5b8ad8b3084fe08104cf32c5ff20da38235))
* **user status:** Publish online and offline status ([8511bac6](https://github.com/2359media/voiceover-server/commit/8511bac6d8ecf37b63e55d1feac413d443a931f4))
* **user_status:** handle user online in one place ([8a3b6d4a](https://github.com/2359media/voiceover-server/commit/8a3b6d4a47e5a7f9816cd1b68b872e678ffbea37))

### 1.0.2 (2015-03-10)

#### Bug Fixes

* **offline message:** media filename & type. ([576cab04](https://github.com/2359media/voiceover-server/commit/576cab041afca5d4e33a1122986f8a791874a908))

## 1.0.1 (2015-03-10)

#### Features

* Some extra processing for image & text.
* Introduced message_id concept for read and delivered message
* Sender should be able to know whether the message is read / delivered.

#### Bug Fixes

* Delivered message direction.

## 1.0.0 (2015-03-10)

Initial release.

