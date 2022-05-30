FROM amazonlinux:2 AS base
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
EXPOSE 3000
RUN yum update -y && yum install -y \
    curl \
    gzip \
    tar \
    xz
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs && \
    npm install -g yarn && \
    yum clean all
COPY package.json yarn.lock /app/

FROM base AS deps
RUN yarn install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules /app/node_modules
COPY . /app
RUN yarn build && \
    rm -rf node_modules

FROM base
ENV NODE_ENV=production
COPY --from=builder /app/.next /app/.next
COPY --from=deps /app/node_modules /app/node_modules

RUN mkdir /tmp/ssm
RUN curl https://s3.us-west-1.amazonaws.com/amazon-ssm-us-west-1/latest/linux_amd64/amazon-ssm-agent.rpm -o /tmp/ssm/amazon-ssm-agent.rpm
RUN yum install -y /tmp/ssm/amazon-ssm-agent.rpm
COPY start.sh  start.sh
CMD ["/bin/bash", "./start.sh"]

