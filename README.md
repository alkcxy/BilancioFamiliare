# BilancioFamiliare README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

Build Docker production image for ARMv7 platform:

```
  docker buildx build --platform linux/arm/v7 -t username/imagename:version -f Dockerfile.prod .
```

[![Build Status](https://semaphoreci.com/api/v1/alkcxy/bilanciofamiliare/branches/master/badge.svg)](https://semaphoreci.com/alkcxy/bilanciofamiliare)
