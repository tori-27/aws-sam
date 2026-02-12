#!/bin/bash
cd "$(dirname "$0")"

CLIENT_ID="4uf74skihb8pr52e4h64g23g6d"
PASSWORD='Test123!@#'

echo "=========================================="
echo "Resetting daily quotas..."
echo "=========================================="
aws apigateway update-usage-plan --usage-plan-id gbyeun --patch-operations op=replace,path=/quota/limit,value=10000 > /dev/null
aws apigateway update-usage-plan --usage-plan-id ezln6e --patch-operations op=replace,path=/quota/limit,value=10000 > /dev/null
aws apigateway update-usage-plan --usage-plan-id cb49tu --patch-operations op=replace,path=/quota/limit,value=10000 > /dev/null
aws apigateway update-usage-plan --usage-plan-id 67zkph --patch-operations op=replace,path=/quota/limit,value=10000 > /dev/null
aws apigateway update-usage-plan --usage-plan-id hpxh71 --patch-operations op=replace,path=/quota/limit,value=10000 > /dev/null
echo "Quotas reset to 10000"

echo "=========================================="
echo "Getting tokens..."
echo "=========================================="
BASIC_TOKEN=$(aws cognito-idp initiate-auth --client-id $CLIENT_ID --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=tenant-admin-t-cc327c5c,PASSWORD=$PASSWORD" --query 'AuthenticationResult.IdToken' --output text)
STANDARD_TOKEN=$(aws cognito-idp initiate-auth --client-id $CLIENT_ID --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=tenant-admin-t-9a72f0b8,PASSWORD=$PASSWORD" --query 'AuthenticationResult.IdToken' --output text)
PLATINUM_TOKEN=$(aws cognito-idp initiate-auth --client-id $CLIENT_ID --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=tenant-admin-t-cad5c200,PASSWORD=$PASSWORD" --query 'AuthenticationResult.IdToken' --output text)
PREMIUM_NOISY_TOKEN=$(aws cognito-idp initiate-auth --client-id $CLIENT_ID --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=tenant-admin-t-d1cb8ca4,PASSWORD=$PASSWORD" --query 'AuthenticationResult.IdToken' --output text)
PREMIUM_VICTIM_TOKEN=$(aws cognito-idp initiate-auth --client-id $CLIENT_ID --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=tenant-admin-t-46d6c4c8,PASSWORD=$PASSWORD" --query 'AuthenticationResult.IdToken' --output text)

echo "Tokens: BASIC=${#BASIC_TOKEN} STANDARD=${#STANDARD_TOKEN} PLATINUM=${#PLATINUM_TOKEN} NOISY=${#PREMIUM_NOISY_TOKEN} VICTIM=${#PREMIUM_VICTIM_TOKEN}"

k6 run --out json=noisy-neighbor-results.json \
  -e BASIC_TOKEN="$BASIC_TOKEN" \
  -e STANDARD_TOKEN="$STANDARD_TOKEN" \
  -e PLATINUM_TOKEN="$PLATINUM_TOKEN" \
  -e PREMIUM_NOISY_TOKEN="$PREMIUM_NOISY_TOKEN" \
  -e PREMIUM_VICTIM_TOKEN="$PREMIUM_VICTIM_TOKEN" \
  all-tiers-noisy-neighbor-test.js
