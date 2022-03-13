---
layout: post
title: Setting Up Elasticsearch Cluster on Kubernetes - Part 3 - Configuration File
date: '2018-02-14 11:46:00'
tags:
- elasticsearch
- docker
- container
- kubernetes
---

- [Part 1 - Setting up Single Node Elasticsearch]( __GHOST_URL__ /setting-up-elasticsearch-cluster-on-kubernetes-part-1/)
- [Part 2 - Setting up Kibana Service]( __GHOST_URL__ /setting-up-elasticsearch-cluster-on-kubernetes-part-2-kibana/)
- Part 3 - Kubernetes Configuration Files

Now that we have a single node elasticsearch service and kibana to monitor the cluster, lets try to capture the work so far into kubernetes configuration file.

## Kubernetes Configuration File

Our current elasticsearch deployment configuration looks like:

    apiVersion: apps/v1beta2
    kind: Deployment
    metadata:
      name: elasticsearch
    spec:
      selector:
        matchLabels:
          component: elasticsearch
      template:
        metadata:
          labels:
            component: elasticsearch
        spec:
          containers:
            - name: elasticsearch
              image: docker.elastic.co/elasticsearch/elasticsearch:6.2.1
              env:
                - name: discovery.type
                  value: single-node
              ports:
                - containerPort: 9200
                  name: http
                  protocol: TCP

Our elasticsearch service configuration looks like:

    apiVersion: v1
    kind: Service
    metadata:
      name: elasticsearch
      labels:
        component: elasticsearch
    spec:
      type: LoadBalancer
      selector:
        component: elasticsearch
      ports:
        - name: http
          port: 9200
          protocol: TCP

Let’s save these two configurations into a file called `elasticsearch_deployment.yaml` and `elasticsearch_service.yaml` respectively into a folder called `elasticsearch-k8s`.

    elasticsearch-k8s
    ├── elasticsearch_deployment.yaml
    └── elasticsearch_service.yaml

Let’s delete the elasticsearch deployment and service that was created before:

    kubectl delete deployment elasticsearch
    kubectl delete service elasticsearch

To create the resources from the configuration files, run the command from the `elasticsearch-k8s` folder:

    kubectl create -f .

Outputs:

    deployment "elasticsearch" created
    service "elasticsearch" created

Let’s do the same for kibana.

Kibana deployment:

    apiVersion: apps/v1beta2
    kind: Deployment
    metadata:
      name: kibana
    spec:
      selector:
        matchLabels:
          run: kibana
      template:
        metadata:
          labels:
            run: kibana
        spec:
          containers:
            - name: kibana
              image: docker.elastic.co/kibana/kibana:6.2.1
              env:
                - name: ELASTICSEARCH_URL
                  value: http://elasticsearch:9200
                - name: XPACK_SECURITY_ENABLED
                  value: true
              ports:
                - containerPort: 5601
                  name: http
                  protocol: TCP

Kibana service:

    apiVersion: v1
    kind: Service
    metadata:
      name: kibana
      labels:
        run: kibana
    spec:
      type: LoadBalancer
      selector:
        run: kibana
      ports:
        - name: http
          port: 5601
          protocol: TCP

Now you can easily delete and recreate these resource using the commands `kubectl delete -f .` and `kubectl create -f .` respectively.

In the next post of the series, I will try to change the elasticsearch deployment configuration into a statefulset.

