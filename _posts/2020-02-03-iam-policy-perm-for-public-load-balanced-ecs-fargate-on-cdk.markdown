---
layout: post
title: IAM policy permissions for a public load balanced ecs fargate service on 
  AWS CDK
date: '2020-02-03 16:20:00'
permalink: iam-policy-perm-for-public-load-balanced-ecs-fargate-on-cdk
tags:
- aws
- cdk
- iam
- ecs
- docker
- fargate
- container
- cloudformation
---

Using AWS CDK with an admin user is all fine and straight forward. But, when it 
comes to creating a deployment pipeline with an IAM user specifically created 
with the actual permission needed, it can take a long time of trialing and 
failing to get to the final list of IAM policy statements.

For A stack with an Application Load Balanced Fargate Service requires the 
following IAM permissions as a minimum.

### Give access to the cdk toolkit staging s3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "s3:GetAccessPoint",
        "s3:PutAccountPublicAccessBlock",
        "s3:GetAccountPublicAccessBlock",
        "s3:ListAllMyBuckets",
        "s3:ListAccessPoints",
        "s3:ListJobs",
        "s3:CreateJob",
        "s3:HeadBucket"
      ],
      "Resource": "*"
    },
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::cdktoolkit-stagingbucket-*"
    }
  ]
}
```

### Managed policies

- AWSCloudFormationReadOnlyAccess - `arn:aws:iam::aws:policy/AWSCloudFormationReadOnlyAccess`
- AmazonVPCReadOnlyAccess - `arn:aws:iam::aws:policy/AmazonVPCReadOnlyAccess`

### Remaining Custom Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "ec2:AuthorizeSecurityGroupIngress",
        "elasticloadbalancing:ModifyListener",
        "iam:ListRoleTags",
        "iam:UntagRole",
        "iam:TagRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "lambda:GetFunctionConfiguration",
        "iam:PutRolePolicy",
        "cloudformation:CreateChangeSet",
        "cloudformation:DeleteChangeSet",
        "iam:PassRole",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:DeleteRolePolicy",
        "lambda:DeleteFunction",
        "iam:ListRolePolicies",
        "cloudformation:ExecuteChangeSet",
        "iam:GetRole",
        "lambda:InvokeFunction",
        "lambda:GetFunction",
        "iam:DeleteRole",
        "ec2:RevokeSecurityGroupIngress",
        "iam:GetRolePolicy"
      ],
      "Resource": [
        "arn:aws:iam::{{accountId}}:role/{{stackPrefix}}*",
        "arn:aws:cloudformation:*:{{accountId}}:stack/{{stackPrefix}}*/*",
        "arn:aws:ec2:*:{{accountId}}:security-group/*",
        "arn:aws:elasticloadbalancing:*:{{accountId}}:listener/app/{{lbPrefix}}*/*/*",
        "arn:aws:elasticloadbalancing:*:{{accountId}}:listener/net/{{lbPrefix}}*/*/*",
        "arn:aws:lambda:*:{{accountId}}:function:{{stackPrefix}}*"
      ]
    },
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeLoadBalancers",
        "route53:GetChange",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "route53:GetHostedZone",
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets",
        "route53:ListHostedZonesByName",
        "ec2:DescribeSecurityGroups",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "logs:CreateLogGroup",
        "ec2:CreateSecurityGroup"
      ],
      "Resource": "*"
    },
    {
      "Sid": "VisualEditor2",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:ModifyListener",
        "elasticloadbalancing:CreateTargetGroup"
      ],
      "Resource": [
        "arn:aws:elasticloadbalancing:*:{{accountId}}:listener/app/{{lbPrefix}}*/*/*",
        "arn:aws:elasticloadbalancing:*:{{accountId}}:listener/net/{{lbPrefix}}*/*/*",
        "arn:aws:elasticloadbalancing:*:712390586371:targetgroup/*/*"
      ]
    },
    {
      "Sid": "VisualEditor3",
      "Effect": "Allow",
      "Action": ["ecs:UpdateService", "ecs:DescribeServices"],
      "Resource": "arn:aws:ecs:*:{{accountId}}:service/{{namePrefix}}-*/{{stackPrefix}}-*"
    }
  ]
}
```

Replace `{{accountId}}`, `{{stackPrefix}}` and `{{lbPrefix}}` with your values.

### Push Docker image to Elastic Container Registy

If you use build pipelines to push to docker image into ECR registry, you will 
need the following permission

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ManageRepositoryContents",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:*:{{accountId}}:repository/{{repoName}}"
    },
    {
      "Sid": "GetAuthorizationToken",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    }
  ]
}
```

Replace `{{accountId}}` and `{{repoName}}`with your values.

## Summary

I am not sure at present where the IAM permission for the user that deploys CDK 
should reside. It’s a lot of configurations to just be hard coded and changed 
via the AWS Web console. Even though you can track up to 5 revisions. Perhaps 
we should be saving this as json files in source control and creating the user 
via **aws cli** tools. If you know a best practise, please do leave a comment.
