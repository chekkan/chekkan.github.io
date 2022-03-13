---
layout: post
title: Thoughts on TDD
date: '2021-04-29 21:00:09'
tags:
- testing
- integration-test
---

I am mainly a C# developer and have some experience with JavaScript. Recently, I’ve been playing around with Ruby on Rails. I was impressed by the way tests are set up for you automatically with a new project. From system, integration, to unit tests. It prompted me to think about which type of test should I write? And how much of each type of test should I write?

I’ve always tried to follow TDD practices in my career. I believed I knew what the goal of TDD is and how to write good unit tests. However, I recently listened to a podcast on [dotnetrocks](https://www.dotnetrocks.com/?show=1735) with Ian Cooper as the guest. In which, the topic of discussion was what is considered a unit when following TDD. In C# land, I’ve always considered class as the smallest unit. Perhaps, even a public static method could be considered a unit. However, Ian explained that unit tests should be written against the smallest observable behavior. He then went on to say that he only writes unit tests at the method level for deterministic functions. This frees him from mocking anything.

I also came across a [video from David Heinemeier Hansson](https://youtu.be/9LfmrkyP81M) from one of the ruby conference keynotes about writing software. One point DHH raised was that following TDD practices is not useful as a software writer. That instead, we should concentrate on readability and clarity when writing code. Having 4 lines of test code for 1 line of shippable code is not the desired outcome. I particularly liked the quote from Kent Beck from the keynote.

> I get paid for code that works, not for tests, so my philosophy is to test as little as possible to reach a given level of confidence.

I’ve also recently noticed how much of my time is spend on writing and cleaning up tests rather than the code under test. Another quote from the keynote video which I am also agreeing with is...

> Splitting up functions to support the testing process, [destroys] your system architecture and code comprehension along with it. Test at a coarser level of granularity. _by James Coplien, "_[_Why Most Unit Testing is Waste_](https://rbcs-us.com/documents/Why-Most-Unit-Testing-is-Waste.pdf)_"_

Outside-in TDD is an approach that advocates writing the test from the boundaries of the system first. Following the TDD practices. I am finding that tests written from the boundaries of the system give me more flexibility in refactoring. I can also rid myself of one interface for one class dilemma when I am not forced to mock my dependencies. I also think that system-level tests yield more value than unit tests. It stops me from introducing regression and gives me far more confidence than unit tests. More often in my experience, unit tests do not deliver on the promise of documentation for your code.

However, I find writing tests only from the boundary means that the number of tests increases in number as the scenarios to account for increases. Keeping in mind the test pyramid, I should have fewer system-level tests as these tend to be more expensive to run.

I am still not anymore closer to an answer to the questions I started off with. I am considering a compromise is to start with writing a system test first to force me to implement the desired test outcome. And then, if there are missing cases that I forgot, I cover these with unit tests; following the TDD approach. Perhaps use simple judgment to decide on whether to write a system test or a unit test or none at all.

