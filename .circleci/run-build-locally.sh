#!/usr/bin/env bash
curl --user ${CIRCLE_TOKEN}: \
  --request POST \
  --form revision=4aaad0ba5f2e9e039398fe1627c34375e98e4131 \
  --form config=@config.yml \
  --form notify=false \
  https://circleci.com/api/v2.0/project/github/SmartWalkieOrg/VoicePing.js/tree/refactor

