---
layout: post
title: AWS ECS Cluster using CloudFormation template
tags:
- cloudformation
- aws
- docker
- container
---

In Amazon Web Services, its common practice to use CloudFormation templates in order to provision resources. Its similar to Azure's resource templates in concept. In this blog post, we will walk through creating a cloud formation template which will create an Amazon EC2 Container Service.

EC2 Container Service (ECS) allows you to take advantage of AWS EC2 Instances and using them as docker hosts. On top of this, uses Auto Scaling Groups inorder to make sure that you always have the right amount of docker hosts running. I like to think of of ECS as AWS's version of Docker Swarm or Kubernetes.

### Why use CloudFormation templates?

Creating a new ECS cluster through the AWS Web console is easy. You select EC2 Container Service item under Computing group. Full step for creating it through web ui console is available [here](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/create_cluster.html). However, if you ever want to delete, update, make some changes to the EC2 host startup scripts, it becomes really difficult. Just take deleting an existing cluster for example. When you want to delete a cluster, you need to make sure that the Auto Scaling Groups, Instances, Security Groups, Load Balancers, CloudWatch Log Groups, Task Definitions, etc are deleted as well, in that order.

Other obvious benefits of using CloudFormation templates includes Infrastructure as Code, tracibility, version control, reusability etc, to name a few.

I admit that working with CloudFormation is not the ideal way. Just because of the sheer amount of terminologies, way of doing things, wordiness, etc. But, there are tools available to help with it. One such tool is [cfndsl](https://github.com/stevenjack/cfndsl). But, I went with a simple nuget package which will resolve json-references. You can find this tool [here](https://github.com/whitlockjc/json-refs).

## Template

Starting point of this template was from the [AWS provided snippet](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/quickref-ecs.html) from their documentation site.

Make sure to update the ami images in the map with [latest ids](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html).

## Resources

### Cluster

This is the simplest of all the resources in this template and is self explanatory.

    "EcsCluster": {
      "Type": "AWS::ECS::Cluster"
    }

Even though their is an addition property called `ClusterName`, [the documentation](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ecs-cluster.html#aws-resource-servicename-cluster-properties) cautions against using it.

### Security Group

    "EcsSecurityGroup": {
        "Type": "AWS::EC2::SecurityGroup",
        "Properties": {
            "GroupDescription": "ECS Security Group",
            "VpcId": {
                "Ref": "VpcId"
            },
            "SecurityGroupIngress": {
                "IpProtocol": "tcp",
                "FromPort": "22",
                "ToPort": "22",
                "CidrIp": "..."
            }
        }
    }

We will attach the above security group to the docker hosts that will get spun up by our autoscalling group. This will allow us to ssh into the docker hosts.

### Instance Profile

For setting up instance profile, we need a role created. I have used the declaration from the [AWS provided snippet](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/quickref-ecs.html). I have however, added an extra `PolicyDocument.Statement.Action`, `ec2:DescribeInstances`. This allows our instance profile to query for the instance's id, and private ip address from the endpoint `http://169.254.169.254/latest/meta-data` from within the host and containers.

Once you have the role resource added to the template, go ahead and add a resource for creating the instance profile that uses the role.

    "EC2InstanceProfile": {
        "Type": "AWS::IAM::InstanceProfile",
        "Properties": {
            "Path": "/",
            "Roles": [
                {
                    "Ref": "EC2Role"
                }
            ]
        }
    }

### Auto Scaling Group
