---
layout: post
title: Migrate PostgresSQL databases with dockerized pg_dump
tags:
- PostgreSQL
- Database
date: 2024-01-11 22:12 +0000
---
Credit goes to [Use Docker to Backup and Restore PostgreSQL Databases](https://dbsnapper.com/blog/use-docker-to-backup-and-restore-postgresql-databases) 
blog post. However, some of the instructions on that post is either out of date or doesn't work.

**Word of warning**: *These commands were tested only on windows terminal.*

These instructions, will require docker installed locally. If you don't want to install [PostgreSQL](https://www.postgresql.org/) 
locally but, wants to perform some backup and restore tasks against remote servers, this is a guide for you.

For me, I went searching because I wanted to migrate [Azure PostgreSQL Single Server](https://learn.microsoft.com/en-us/azure/postgresql/single-server/overview-single-server) 
to an [Azure PostgreSQL Flexible server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) as the 
[single server offering will be retired in March 2025](https://learn.microsoft.com/en-us/azure/postgresql/single-server/whats-happening-to-postgresql-single-server). And Azure wasn't letting me do it from their portal because the source database 
was in a different region to my destination. And Azure wasn't letting me create a Flexible server in the target server location 
for some reason. I assume because the service is not available in that region. 

When using `pg_dump`, the general advice is to use the same or later version of postgres. So, if you target server is PostgreSQL 
version `15.4` and your source server is version `11`. You'd atleast use version `15.4` of PostgreSQL tools.   

You can only migrate one database at a time with this approach. So, repeat the steps below for all the databases. 

## Backup database to single file

```pwsh
docker run -it --rm -v .:/backup postgres:15.4 pg_dump -h <source_host> `
    -U <user> -d <database> -f /backup/<file_name>.sql
```

The command above mounts the `\backup` directory in the container as a volume `-v` to the host's current directory. This allows 
`pg_dump` to write the backup sql file to the current directory on your local machine.

Notice `-it` flag as its needed to enter the password for the user after executing the command.

The `--rm` flag tells Docker to remove the container when the command is finished running.

## Restore database from single file

`psql` requires the database to be already  in target host.

```pwsh
docker run -it --rm postgres:15.4 createdb <database> -h <target_host> `
    -p 5432 -U <user>
```

If successful, you will see no output. So, make sure to check if a database is created.

Again, notice `-it` as you will be prompted for password. Also, you are supposed to provide host address and credentials 
**for target server**. 

Now, you can use the `psql` command and point to the .sql dump file we created earlier.

```pwsh
docker run -it --rm -v .:/backup postgres:15.4 psql -h <target_host> `
    -U <user> -f /backup/<file_name>.sql <database>
```

Notice that the database name is provided as that's what file will be executed against.