---
layout: post
title: Ingesting data from Oracle DB into Elasticsearch with Logstash
permalink: ingesting-data-into-elasticsearch-with-logstash
date: '2017-07-30 00:19:00'
cover: https://images.unsplash.com/photo-1591711584791-455de896b1e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDF8fHR1bm5lbHxlbnwwfHx8fDE2MjE2ODk2NTc&ixlib=rb-1.2.1&q=80&w=2000
tags:
- elasticsearch
- logstash
- oracle-rdbms
- jdbc
- ansible
---

Alternative to Logstash was the [Elasticsearch JDBC tool][es_jdbc]. Which at 
the time of writing was using port `9300` for transfering data. There were 
talks of not exposing this port externally in future releases of elaticsearch 
and hence we went with logstash.

## Setup

- The way we have setup logstash and elasticsearch cluster at present is by 
  using [Ansible][ansible].
- We have one vm with logstash installed which can connect to the elasticsearch 
  cluster.
- [ReadonlyRest][ror] plugin is used for managing access for our cluster.
- Used the [JDBC plugin][jdbc] in order to query for the data with 
  [elasticsearch output plugin][esop].
- Use a cron job for scheduling the logstash to run on a schedule. Our schedule 
  is once every hour.

As of logstash version 5.0, there is an option to enable 
[http compression][htcomp] for **requests** , so make sure to take advantage of 
this. As we saw a reduction of up to 10 fold in the data size.

## Updates

There were two options for getting the updates from oracle db whilst using the 
JDBC input plugin. **Option 1:** Modify the job which insert or updates each 
table that we are ingesting with a `lastupdated` field. The script that would 
run at our schedule of every one hour would then query the elasticsearch index 
for the `max_date` on the index and pass it to the sql thats run by logstash 
jdbc plugin. **Option 2:** Use the `sql_last_value` plugin parameter which will 
persist the `sql_last_value` parameter in the form of a metadata file stored in 
the configured `last_run_metadata_path`. Upon query execution, this file will 
be updated with the current value of `sql_last_value`. In our case, this meant 
that we will need to use an insert or update timestamp in our table.

Primary key in the oracle db table is used as the document id in elasticsearch. 
This means that each updated document will correctly override the document in 
elasticsearch.

{% highlight ruby %}

output {
  elasticsearch {
    hosts => ${HOST_STRING}
    index => "${ES_INDEX}"
    document_id => "%{${ES_DOC_ID}}"
    document_type => "${INDEX_TYPE}"
    flush_size => 1000
    http_compression => true
  }
}

{% endhighlight %}

## Transform data

Make use of filters in order to do basic data transformations.

### Transform table column value to object

{% highlight ruby %}

mutate {
    rename => { "address.line1" => "[address][line1]" }
    rename => { "address.line2" => "[address][line2]" }
}

{% endhighlight %}

### Covert comma delimeted field to array of string

{% highlight ruby %}

ruby {
    init => "require 'csv'"
    code => "['urls'].each { |type|
        if event.include?(type) then
            if event.get(type) == nil || event.get(type) == 'null' then
                event.remove(type)
            else
                # bin data if not valid CSV
                begin
                    event.set(type, CSV.parse(event.get(type))[0])
                rescue
                    event.remove(type)
                end
            end
        end
    }"
}

{% endhighlight %}

## Improvements

The setup described in this article doesn’t work well if we need to also remove 
deleted entries. Consider using a column in our view to indicate if a field was 
removed or not. But that only works for “soft-deletes” in database.

Move towards using a bus queuing system for ingestion. One project by linkedin 
that caught my attention that supports oracle db as source for ingestion was 
[databus][lkndb]. But, haven’t managed to get it setup locally (poor 
documentation at the time of writing).

Full re-index is currently a manual process, even though we a script to perform 
full re-index.

## Further Reading

- 📖 [bottled water: real-time integration of postgresql and kafka](https://www.confluent.io/blog/bottled-water-real-time-integration-of-postgresql-and-kafka/)
- 📖 [data pipeline evolution at linkedin on a few pictures](http://getindata.com/data-pipeline-evolution-at-linkedin-on-a-few-pictures)
- 🎥 [change data capture: the magic wand we forgot](https://www.youtube.com/watch?v=ZAZJqEKUl3U)

_Image credit:_

- [https://flic.kr/p/8wuFEJ](https://flic.kr/p/8wuFEJ)
- [https://creativecommons.org/licenses/by-nc/2.0/](https://creativecommons.org/licenses/by-nc/2.0/)

[es_jdbc]: <https://github.com/jprante/elasticsearch-jdbc>
[ansible]: <https://www.ansible.com/>
[ror]: <https://readonlyrest.com/>
[jdbc]: <https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html>
[esop]: <https://www.elastic.co/guide/en/logstash/current/plugins-outputs-elasticsearch.html>
[htcomp]: <https://www.elastic.co/guide/en/logstash/current/plugins-outputs-elasticsearch.html#_http_compression>
[lkndb]: <https://github.com/linkedin/databus>
