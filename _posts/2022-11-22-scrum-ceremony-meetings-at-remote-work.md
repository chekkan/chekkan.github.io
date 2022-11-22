---
layout: post
title: Scrum ceremony meetings at remote work
date: 2022-11-22 21:45 +0000
tags:
  - scrum
  - agile
  - meetings
---

Since almost everyone is working remotely nowadays, all our meetings are
conducted virtually via [Zoom][], [Google Meet][], [Slack][] etc. And I have
developed a distaste for being in meetings. Perhaps we have more meetings now
compared to what we used to have. This might be because we can't physically go
over to someone's desk and talk to them to catch up. It has to be a booked slot
in the calendar. With the booked slot, we now feel obligated to fill the entire
slot with something to discuss.

If you wanted to discuss something with more than one person, it is difficult
to find times when everyone involved is free. People are away from their desks
at different times. They take coffee and lunch breaks at different times. When
I worked from office, most of us went to get lunch together. Those with kids
will be going for school runs at different times too.

I think my grudge is against scheduled repeated meetings involving more than 2
people. I don't mind catching up with someone. Getting on a call ad-hoc for
reviewing their work, pairing, or answering questions. In fact, I think its very
important. You need to have regular one-to-one meetings. Which are scheduled
repeated meetings between 2 people. I have a weekly catchup with my line manager
and I have fortnightly catchup with each person in my team. These meetings last
about 30 minutes.

When working in a Scrum team, there are a few ceremony meetings that every
member of the team needs to attend. These are again, repeated and typically
involves more than 1 other person.

#### Stand up meetings

_Stand up meetings_ usually happen every day and involves all of the team members.
And in my experience, teams usually do a good job of keeping this to a maximum
of 15 minutes. Each person spends 2 minutes to give the rest of the team members
an idea of "what they did the day before", "what the planned work for today is",
and "if there are anything blocking them from progressing".

At my current work, virtual meeting for _Stand up_ is now replaced by a
message that gets posted on a [slack][] channel. We use a service called
[Geekbot][], that posts the 3 questions to each member everyday at 9 o' clock
their local time. This slack app then posts the response to a public slack
channel. Team members can answer these questions anytime they like. They can
catch up with other peoples' response at anytime they prefer.

![Example geekbot response in slack](https://res.cloudinary.com/chekkan/image/upload/v1669150039/Slack-window-1_pzappe.png)

We still have virtual meeting calls for _Stand up_ on mondays and tuesdays. I
find that people do read what others are working on even if its optional for
them to do so. Its common for people to zone out during virtual meetings and
end up not listening until its their turn to speak. And zones out again after
they are done. Some people post updates with links to work items or pull
requests and clear explanations. Where as, others keep their updates short. And
it changes from day to day.

#### Sprint refinement

_Sprint refinement_ meetings are another repeated meeting that we have once a
week. Most of the times, people are not engaged enough in these sessions.
Ideally, each person needs to be aware of the stories that will be discussed in
the call. They need to be told of this atleast 2 days before the refinement
session. The longer each person gets to think about a particular story, the
better. Chances are that they will have questions prepared for the refinement.
Better, they might already have the answers. The team will benefit immensely if
there were alternative solutions to the work item than the one prescribed by the
_technical lead_ or _architect_. Without the time given ahead of the meeting, we
are demanding people to think on the spot about a requirement. And find flows in
the solution that the Product Owner, Business Analysts, and Technical Lead have
come up with.

I think that its not possible to replace _Sprint refinement_ meetings with
asynchronous alternatives. Especially in a team that follows "traditional"
_Agile methodology_. Which makes it more important that we utilise the full 1
hour with the team to its maximum potential. Business Analysts or Product Owners
needs to communicate early with the team about stories that will be discussed in
the meeting. They also need to make sure enough scenarios are captured in the
acceptance criteria of the story so that developers who are interested can make
sense of the requirement and the proposed solution ahead of time.

Developers needs time to think through the scenarios captured in the acceptance
criteria. Are there missing criterias thats not thought through? Are assumptions
made about the code or architecture thats incorrect or outdated? Does the story
require a design discussion? Are there technical debts in this area of the code
base that can be addressed with the work item? And therefore should be included
in the estimation. The team can capture some of the tasks for the work item
that's obvious at this stage. There will be time to add more tasks as work
happens on the work item.

#### Sprint demo

We currently spend a lot of time in meetings designed to prepare us to give a
_live demo_ of the features we delivered in the _current sprint_. And this
innevitably brings along with it a lot of stress to the people who has something
to present. Time is wasted multiple times for each of the preparation sessions
and the actual demo. Time is spend to prepare the environment for the demo and
each of the practise sessions. I say instead, each team spends time every sprint
on writing a blog post in the format of release notes with screenshots and video
recordings. That is end user friendly and post it before the start of the
following sprint. If you use [Confluence][] for example, each space can contain
its own blog. I name the blog post "🚢 Shipped in Sprint X by Team ABC".

One of the problem with _Sprint demo_ meetings are that no watches the recording
afterwards. Except perhaps you were off work that day. Its also not possible to
search for demonstration of a particular functionality across many recordings.
It becomes slightly easier if you've got accompanying slides or audio
transcripts for each demo. Its easier to visualise the progress from these blog
posts every quarter or year.

## Conclusion

Some of the meetings that demand everyone to be available at specific point in
time can be replaced with an alternative. But I admit, there are few
_Scrum ceremonies_ that are important to keep as a meeting. Even if its virtual.
Such as the _retrospective_. It might even be good to conduct _retrospectives_
in person once in a while.

It does seem possible to completly replace all of the _Scrum ceremony meetings_
with an alternative asynchronous counterpart. In some circumstances, it might
even be required. There are certainly tools available to enable this.

[zoom]: https://zoom.us/
[google meet]: https://meet.google.com/
[slack]: https://slack.com
[geekbot]: https://geekbot.com
[confluence]: https://www.atlassian.com/software/confluence
