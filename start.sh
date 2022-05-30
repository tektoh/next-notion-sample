#!/bin/bash
amazon-ssm-agent -register -code "${SSM_ACTIVATION_CODE}" -id "${SSM_ACTIVATION_ID}" -region "${SSM_REGION}"
nohup amazon-ssm-agent > /dev/null &
yarn start