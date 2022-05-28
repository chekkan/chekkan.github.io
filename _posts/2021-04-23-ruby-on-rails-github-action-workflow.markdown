---
layout: post
title: Ruby on Rails GitHub Action Workflow
date: '2021-04-23 22:36:43'
permalink: ruby-on-rails-github-action-workflow
cover: https://images.unsplash.com/photo-1522776851755-3914469f0ca2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDQxfHxydWJ5JTIwb24lMjByYWlsc3xlbnwwfHx8fDE2MTkyMTcyMjA&ixlib=rb-1.2.1&q=80&w=2000
tags:
- rails
- ruby
- github
- ci
---

The goal is to start running tests that is part of my code base with each push
to `main` and also any pull requests to `main` branch. This blog post will not
cover any linting or deployment of the ruby on rails web application. The final
yaml is tested with ruby version `3.0.0` and ruby on rails version `6.1.3.1`
at the time of writing. Skip to end of the post to view the finished yaml.

We will start with [recommended ruby starter workflow yaml file][] from GitHub
actions page. The starter file provides you with a matrix with various ruby
versions. Because, the workflow I am setting up is for a web application that
will be deployed to an environment with a specific ruby version install, I
will delete the `strategy` section completely and also specify my ruby version
to `3.0`.

```yaml
runs-on: ubuntu-latest
steps:
    - uses: actions/checkout@v2
    - name: Set up Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: 3.0.0 # Not needed with a .ruby-version file
        bundler-cache: true # runs 'bundle install' and caches installed gems automatically
```

I am planning on deploying the application in a docker container running on
linux. Therefore, I've set my build environment to be an `ubuntu` base image.
If you are developing on something other than linux (which is my case), you
will also need to add support for linux with your bundle.

    bundle lock --add-platform x86_64-linux

After the ruby setup step, the next step thats already provided is the test
step with `bundle rake` command. I have my project setup to run with mysql
database. Therefore, we need to define a service for mysql for the tests to
pass. Read more about service containers at [GitHub documentation site][].

```yaml
test:
...
services:
  # Label used to access the service container
  mysql:
    # Docker Hub image and tag
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: my-secret-password
      MYSQL_DATABASE: <db_name> # replace with actual name
      MYSQL_USER: test_user
      MYSQL_PASSWORD: password
    # Set health checks to wait until mysql has started
    options: >-
      --health-cmd "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

steps:
  ...
```

Now a container will be spun up my GitHub action and made available on the port
you specified. The `options` section specifies that the service is only ready
when `mysqladmin ping` command succeeds. The next step is to setup the database
required for your tests. To do that, we will make use of the `DATABASE_URL`
environment variable and the `bin/rails db:setup` [command][]. Make sure to use
the prefix `bin`. You can read more about configuration and order of preference
at [ruby on rails documentation site][].

```yaml
- name: Setup test database
  run: bin/rails db:setup
  env:
    DATABASE_URL: mysql2://test_user:password@127.0.0.1:3306/<db_name>
```

Make sure that `DATABASE_URL` environment variable starts with `mysql2`. For
some reason, I can't seem to use `localhost` for the hostname part. If someone
could point me to the reason, that will be much appreciated 🙏.

Pin down to a particular node.js major version and also install javascript
dependencies with caching.

```yaml
- name: Setup Node
  uses: actions/setup-node@v2
  with:
    node-version: '14'
    cache: 'yarn'

- name: Install packages
  run: yarn install --pure-lockfile
```

The final yaml file...

```yaml
name: Ruby

on:
push:
branches: [main]
pull_request:
branches: [main]

jobs:
  test:

    runs-on: ubuntu-latest

    services:
      # Label used to access the service container
      mysql:
        # Docker Hub image and tag
        image: mysql:8.0
        ports:
          - 3306:3306
        env:
          MYSQL_ROOT_PASSWORD: my-secret-password
          MYSQL_DATABASE: <db_name> #replace with name
          MYSQL_USER: test_user
          MYSQL_PASSWORD: password
        # Set health checks to wait until mysql has started
        options: >-
          --health-cmd "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    - name: Set up Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: 3.0.0 # Not needed with a .ruby-version file
        bundler-cache: true # runs 'bundle install' and caches installed gems automatically
    
    - name: Setup Node
      uses: actions/setup-node@v2
      with:
        node-version: '14'
        cache: 'yarn'

    - name: Setup test database
      run: bin/rails db:setup
      env:
        DATABASE_URL: mysql2://test_user:password@127.0.0.1:3306/<db_name>

    - name: Install packages
      run: yarn install --pure-lockfile

    - name: Run tests
      run: bundle exec rake
```

[recommended ruby starter workflow yaml file]: <https://github.com/actions/starter-workflows/blob/ffb4bccd2d52e308ec66fa63f218d93db6dd94a1/ci/ruby.yml>
[GitHub documentation site]: <https://docs.github.com/en/actions/guides/about-service-containers#about-service-containers>
[command]: <https://guides.rubyonrails.org/active_record_migrations.html#setup-the-database>
[ruby on rails documentation site]: <https://guides.rubyonrails.org/configuring.html#configuring-a-database>
