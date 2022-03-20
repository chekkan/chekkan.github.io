---
layout: post
title: Organizing Entity Framework Code First Migration Seed Method
date: '2014-07-25 17:36:00'
permalink: organizing-entity-framework-code-first-migration-seed-method
tags:
- migration
- code-first
- refactoring
- seperation-of-concern
---

I recently started working on a complex ASP.NET MVC 5 Project with Entity 
Framework 6. This is the first time I am building an actual, to be production 
ready, deliverable web site on MVC. Of course, there are a lot of challenges 
and I am battling my way out of each one at a time. One of these challenges was 
working with Entity Framework and seeding dummy data using code first 
migration. I found really hard to keep track of the relationships, and the 
errors were mounting up . And no one wanted to dig their hand into the mess.

Here are three of the most common errors I encountered over and over. Each time 
I fixed the issue, I didn’t feel in power and fixing it felt like a miracle. 
Glad that part is over.

The datetime2 to datetime conversion. — Package Manager Console: Have you 
forgot to initialize a DateTime property with value? — Me: maybe… I don’t know. 
Which fields did I forget? — Package Manager Console: I am not going to tell 
you.

Foreign key constraint, insert command terminated — Me: great what was the 
actual INSERT Statement that caused this issue? So that i can find the seed 
data and fix it. — Package Manager Console: no, you can’t ask me that question. 
I wont show you the insert statement.

Sequence contains more than one element (or something of that sort)?

At this point, the `Seed` method was populating ten different tables, which had 
very complex relationships in them. The method was more than 200 lines long. 
Each time we did an `Update-Database`, we would get an error, that much was 
guaranteed.

How would you debug the database seeding? I did find some 
[discussions][so-disc] in Stack Overflow around adding logging into the Seed 
method and using the executable program that comes with code first migration. I 
did not want to try these methods and see how useful they are. You might want 
to try these out and probably share it with me here?

But, the way I came up with a solution was by thinking that there is a lot of 
code in this single method. Is there any way to separate these out and make it 
easy to work with?

Hence, I started creating classes for each of the tables that needed to get 
seeded. I later realized that these classes need dependency on other tables 
because of the foreign keys. I was happy with the end result. I am not sure if 
this is the best way or if there is an even better way to organize the seed 
methods. I did not find any anywhere. If there is, please do share them with me.

Here is the `Seed` method after the clean up

{% highlight csharp %}
protected override void Seed(Data.McrsDbContext context)
{
  var users = new UserSeedData().ToArray();
  var meetings = new MeetingSeedData(users).ToArray();
  var actions = new ActionSeedData(users, meetings).ToArray();

  context.Users.AddOrUpdate(user => user.Id, users);
  context.Meetings.AddOrUpdate(meeting => meeting.Id, meetings);
  context.Actions.AddOrUpdate(log => log.Id, actions);
}
{% endhighlight %}

All of the `SeedData` classes implement `IEnumerable`. ActionSeedData’s 
constructor for example, has dependency on both users and meetings. In the code 
below, I am creating 5 random actions for each meeting.

{% highlight csharp %}
public class ActionSeedData : IEnumerable<Action>
{
  private readonly List _data = new List();

  public ActionSeedData(User[] users, Meeting[] meetings)
  {
    var r = new Random();

    _data = Enumerable.Range(1, 5*meetings.Count()).Select((a, idx) => new Action
    {
      Id = idx + 1,
      Title = string.Format("Action.{0}.{1}.{2}", r.Next(1, 10), r.Next(1, 10), r.Next(1, 10)),
      CreatedBy = users[r.Next(0, 7)],
      DueDate = DateTime.Now.AddDays(r.Next(1, 10)),
      MeetingId = meetings[r.Next(0, meetings.Count())].Id,
      ...
    }).ToList();
  }

  public IEnumerator GetEnumerator()
  {
    return _data.GetEnumerator();
  }

  IEnumerator IEnumerable.GetEnumerator()
  {
    return GetEnumerator();
  }
}
{% endhighlight %}

How is this helping you debug, you might ask. If you get one of the errors 
mentioned above, you can now easily comment out the bit of 
`context.AddOrUpdate()`, run the `Update-Database` command, and see if that has 
fixed the issue. You can now narrow down to the specific table which has got 
the foreign key constraint error or the `datetime2` conversion error. Not only 
that, if you want to spend more time on implementing more complex ways of 
creating dummy data such as getting a list of phrases from an XML and randomly 
assigning it to the title of the action? Adding another table to the Seed 
method should not be a hassle any more. This approach together with logging 
support should also be interesting.


[so-disc]: <http://stackoverflow.com/a/17492050/2267450>
