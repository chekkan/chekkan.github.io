---
layout: post
title: Using Domain Types with NHibernate
date: '2021-11-21 22:06:21'
tags:
- nhibernate
- software-engineering
- aspnet
- csharp
---

Primitive obsession is a code smell. The proposal is to replace strings, and other primitive data types with domain types. For example, user's id in system can be represented by an `integer` or `Guid` (`UUID`), or `string` (username). However, there are benefits that come along with creating a type called `UserId` using that in place of primitive types.

One advantage is that you cannot accidentally call the following method with another `integer` or `Guid`. You must do the right thing otherwise code will not compile.

    public void AcceptedBy(UserId id)
    { ... }

One of the hurdles you will have when replacing this code smell is that now, there might be places in the website where you need to display the `integer` value or include the `Guid` in the link to a user's profile. On the other end, you might have to store the user's Id in to some database or make an API call with it.

The first instinct might be to translate the `UserId` object to the type that's required. Instead, stop the urge to map / translate the type and use the same type through out.

Most of the Entity Relational Object mappers allows you to specify how to translate from an domain type to a database type. For NHibernate, there are a couple of things that needs to be setup.

First, the mapping needs to specify the database type and where to store the value.

    public class UserMapping : ClassMap<User>
    {
        public UserMapping()
        {
            Id(x => x.Id)
              .CustomType<string>.Access.CamelCaseField(Prefix.None);
        }
    }

The Access configuration tells NHibernate to look for a private field on the class `User` that has the camel cased name of the property and is not prefixed. Therefore, NHibernate will then look for a field with name `id` in class `User`.

    public class User
    {
        string id;
        public virtual UserId Id
        {
            get
            {
                UserId.TryParse(id, out var result);
                return result;
            }
            set => id = value?.Value;
        }
    }

The `Id` property on `User` class will return the parse value of the string `id` and set the field appropriately from `UserId` object. In the example, I expose a get only property for the `string`. With the mapping and the private field usage, NHibernate will be able to store domain type into and retrieve from database.

> I would have preferred if I didn't have the need to expose `Value` property. However, the creation is the `UserId` still needs to happen through the constructor. So, its OK for now.

For using the `Id` property on [LINQ](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/linq/) queries however with NHibernate, you will need to do one more change.

    var userById = session.Query<User>(u => u.Id == new UserId("chekkan"));

The above query will fail with an exception when trying to convert `UserId` type to string. What I gathered is happening behind the scene is that NHibernate was trying to covert the right hand side of the expression to string because `Id` column in `User` table is a `nvarchar` type. But, `UserId` cannot be converted to `string`.

If we try to compare `Id` to `UserId.Value`, that's not going to compile.

    var userById = session.Query<User>(u => u.Id == new UserId("chekkan").Value);

If we were to rewrite the query in [hql](https://nhibernate.info/doc/nhibernate-reference/queryhql.html) however, it will work.

    var userToFind = new UserId("chekkan");
    var query = session.CreateQuery("from User u where u.Id = :Id");
    query.SetParameter("Id", userToFind.Value);
    var userById = query.List<User>();

But, its not type safe. We want the [LINQ](https://nhibernate.info/doc/nhibernate-reference/querylinq.html)queries to work. For that, we will create an implicit coverter from `UserId` to `string` in our `UserId` type.

    public static implicit operator string(UserId id) => id.Value;

With this change, the above LINQ query that was not compiling before will start to compile.

    // with implicit string converter
    var userById = session.Query<User>(u => u.Id == new UserId("chekkan").Value);
    
    // with explicit string converter
    var userById = session.Query<User>(u => 
        (string) u.Id == new UserId("chekkan").Value
    );

