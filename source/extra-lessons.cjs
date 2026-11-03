// Authored content for the orientation and review chapters, plus module-level flashcards.
// Exam facts come from the supplied exam guide; see docs/guide-diff.md for differences from the current official pages.
module.exports = {
  "lessons": {
    "orientation:certification-map": {
      "title": "Certification map",
      "topics": [
        {
          "title": "Overview",
          "blocks": [
            {
              "type": "text",
              "body": "This lesson is your map of the AWS Certified Solutions Architect - Professional (SAP-C02) exam and of this course. It contains no deep service content; it tells you what the exam measures, how it is scored, which course lesson covers each of the 20 official task statements, and how to use the Well-Architected Framework to break ties between plausible answers. Everything about the exam itself is taken from the official AWS exam guide pages retrieved for this build, and differences from the guide supplied with the course are recorded in the build notes (see the discrepancy list for this lesson)."
            },
            {
              "type": "key",
              "title": "Read this first: SAP-C02 is being replaced",
              "body": "The official SAP-C03 comparison page states that SAP-C02 is in use until November 16, 2026 and that SAP-C03 is in use beginning November 17, 2026. If your exam date is after that, this course (which is aligned to SAP-C02) is not the right blueprint; read the SAP-C03 guide. The topic 'Format, scoring and the SAP-C03 transition' explains what changed."
            },
            {
              "type": "bullets",
              "items": [
                "Prerequisites: working knowledge of core AWS services (VPC, EC2, S3, IAM, RDS) at associate level.",
                "You will be able to state the four exam domains, their weights, and the number of scored and unscored questions.",
                "You will be able to name the lesson in this course that covers any of the 20 task statements.",
                "You will be able to use the six Well-Architected pillars to choose between two technically valid answers.",
                "You will be able to explain how multiple-response questions are scored and why guessing is rational.",
                "You will be able to plan your study using the lesson order and the review lesson."
              ]
            },
            {
              "type": "text",
              "body": "Why it matters: scenario questions on this exam are long, and several options usually work technically. Candidates who know the structure (domain weights, scoring, tie-breakers) spend their study time where points are, and read questions with the right filter."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "SAP-C02 vs SAP-C03 comparison",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-03/sap-03-comparison.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Exam purpose and target candidate",
          "blocks": [
            {
              "type": "text",
              "body": "The guide says the exam is intended for individuals who perform a solutions architect role and that it validates advanced technical skills and experience in designing optimized AWS solutions based on the AWS Well-Architected Framework. It validates four abilities, matching the four domains: design for organizational complexity, design for new solutions, continuously improve existing solutions, and accelerate workload migration and modernization."
            },
            {
              "type": "text",
              "body": "The target candidate has 2 or more years of experience using AWS services to design and implement cloud solutions, can evaluate cloud application requirements and make architectural recommendations for deploying applications on AWS, and can give expert guidance on architecture that spans multiple applications and projects within a complex organization."
            },
            {
              "type": "table",
              "headers": [
                "Out of scope for the candidate (per the guide)",
                "Meaning for your study"
              ],
              "rows": [
                [
                  "Frontend development for mobile apps",
                  "Do not spend time on mobile UI frameworks; backend services such as API Gateway still matter."
                ],
                [
                  "12-factor app methodology",
                  "You need not memorize the methodology, although stateless and decoupled design appear throughout."
                ],
                [
                  "In-depth knowledge of operating systems",
                  "Know what an OS-level task is (patching, agents) but not kernel internals."
                ]
              ]
            },
            {
              "type": "text",
              "body": "The guide marks this list as non-exhaustive."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Format, scoring and the SAP-C03 transition",
          "blocks": [
            {
              "type": "table",
              "headers": [
                "Item",
                "Value (official SAP-C02 guide)"
              ],
              "rows": [
                [
                  "Scored questions",
                  "65"
                ],
                [
                  "Unscored questions",
                  "10, not identified on the exam; used by AWS to evaluate future questions"
                ],
                [
                  "Question types",
                  "Multiple choice (1 correct, 3 distractors); multiple response (2 or more correct out of 5 or more options)"
                ],
                [
                  "Multiple-response credit",
                  "You must select all correct responses to receive credit"
                ],
                [
                  "Guessing",
                  "No penalty; unanswered questions are scored incorrect"
                ],
                [
                  "Result",
                  "Pass or fail, reported as a scaled score of 100-1,000; minimum passing score 750"
                ],
                [
                  "Scoring model",
                  "Compensatory: you do not need to pass each section, only the overall exam"
                ]
              ]
            },
            {
              "type": "bullets",
              "items": [
                "Because unanswered questions are scored as incorrect and there is no penalty for guessing, never leave a question blank.",
                "Compensatory scoring means a weak domain can be offset by strength elsewhere, but domain weights still make Domain 2 (29%) the largest domain.",
                "The AWS certification page for this exam lists a duration of 180 minutes, 75 questions (65 scored plus 10 unscored), a cost of 300 USD, and availability in English, Japanese, Korean, Portuguese (Brazil), Simplified Chinese, and Spanish (Latin America). Price and languages can change, so confirm them when you register."
              ]
            },
            {
              "type": "text",
              "body": "Emerging topics: the current guide adds an 'Emerging Topics' section (design security and responsible AI controls, for example Amazon Bedrock Guardrails, AgentCore Identity, and human-approval workflows with AWS Step Functions). The guide says these may appear as pretest questions that do not affect your score."
            },
            {
              "type": "key",
              "title": "SAP-C03 timeline",
              "body": "From the official blog and comparison page: registration for SAP-C03 opened October 27, 2026; general delivery begins November 17, 2026; the last day to take SAP-C02 is November 16, 2026. SAP-C03 has five domains weighted 25/25/15/15/20 and adds content such as generative AI, IPv6 dual-stack, data lakes and post-quantum cryptography. This course does not teach that new content."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "SAP-C02 vs SAP-C03 comparison",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-03/sap-03-comparison.html"
                },
                {
                  "label": "SAP-C03 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-03/solutions-architect-professional-03.html"
                },
                {
                  "label": "Certification updates blog, September 2026",
                  "url": "https://aws.amazon.com/blogs/training-and-certification/september-2026-new-offerings/"
                }
              ]
            }
          ]
        },
        {
          "title": "Domains, weights and task map",
          "blocks": [
            {
              "type": "table",
              "headers": [
                "Domain",
                "Weight (scored content)",
                "Tasks"
              ],
              "rows": [
                [
                  "1. Design Solutions for Organizational Complexity",
                  "26%",
                  "1.1 to 1.5"
                ],
                [
                  "2. Design for New Solutions",
                  "29%",
                  "2.1 to 2.6"
                ],
                [
                  "3. Continuous Improvement for Existing Solutions",
                  "25%",
                  "3.1 to 3.5"
                ],
                [
                  "4. Accelerate Workload Migration and Modernization",
                  "20%",
                  "4.1 to 4.4"
                ]
              ]
            },
            {
              "type": "text",
              "body": "Approximate scored-question count per domain if you assume 65 scored questions spread exactly by weight: about 17, 19, 16 and 13. This is arithmetic on the published weights, not an AWS statement; real forms vary."
            },
            {
              "type": "text",
              "body": "The 20 official task statements map one-to-one to the 20 lessons below. The task titles are the official ones; the lesson column is this course's lesson title and its id."
            },
            {
              "type": "table",
              "headers": [
                "Task",
                "Official task statement",
                "Course lesson title",
                "Lesson id"
              ],
              "rows": [
                [
                  "1.1",
                  "Architect network connectivity strategies",
                  "Network connectivity strategies",
                  "org-complexity:network-connectivity"
                ],
                [
                  "1.2",
                  "Prescribe security controls",
                  "Prescribe security controls (Task 1.2)",
                  "org-complexity:security-controls"
                ],
                [
                  "1.3",
                  "Design reliable and resilient architectures",
                  "Design reliable and resilient architectures",
                  "org-complexity:resilient-architectures"
                ],
                [
                  "1.4",
                  "Design a multi-account AWS environment",
                  "Design a multi-account AWS environment",
                  "org-complexity:multi-account"
                ],
                [
                  "1.5",
                  "Determine cost optimization and visibility strategies",
                  "Cost optimization and visibility strategies",
                  "org-complexity:cost-visibility"
                ],
                [
                  "2.1",
                  "Design a deployment strategy to meet business requirements",
                  "Design a deployment strategy to meet business requirements",
                  "new-solutions:deployment-strategy"
                ],
                [
                  "2.2",
                  "Design a solution to ensure business continuity",
                  "Business continuity and disaster recovery (Task 2.2)",
                  "new-solutions:business-continuity"
                ],
                [
                  "2.3",
                  "Determine security controls based on requirements",
                  "Security controls from requirements (Task 2.3)",
                  "new-solutions:security-requirements"
                ],
                [
                  "2.4",
                  "Design a strategy to meet reliability requirements",
                  "Designing a strategy to meet reliability requirements (Task 2.4)",
                  "new-solutions:reliability"
                ],
                [
                  "2.5",
                  "Design a solution to meet performance objectives",
                  "Design a solution to meet performance objectives (Task 2.5)",
                  "new-solutions:performance"
                ],
                [
                  "2.6",
                  "Determine a cost optimization strategy to meet solution goals and objectives",
                  "Cost optimization strategy for new solutions",
                  "new-solutions:cost-strategy"
                ],
                [
                  "3.1",
                  "Determine a strategy to improve overall operational excellence",
                  "Operational excellence: monitoring, automation, deployments and recovery exercises",
                  "continuous-improvement:operational-excellence"
                ],
                [
                  "3.2",
                  "Determine a strategy to improve security",
                  "Improve security of existing solutions",
                  "continuous-improvement:improve-security"
                ],
                [
                  "3.3",
                  "Determine a strategy to improve performance",
                  "Improve performance of existing solutions",
                  "continuous-improvement:improve-performance"
                ],
                [
                  "3.4",
                  "Determine a strategy to improve reliability",
                  "Improve the reliability of existing solutions",
                  "continuous-improvement:improve-reliability"
                ],
                [
                  "3.5",
                  "Identify opportunities for cost optimizations",
                  "Identify cost optimizations in existing solutions",
                  "continuous-improvement:improve-cost"
                ],
                [
                  "4.1",
                  "Select existing workloads and processes for potential migration",
                  "Select existing workloads and processes for migration",
                  "migration-modernization:select-workloads"
                ],
                [
                  "4.2",
                  "Determine the optimal migration approach for existing workloads",
                  "Optimal migration approach: 7 Rs, MGN, DMS/SCT, DataSync, Snow family, Storage Gateway and cutover",
                  "migration-modernization:migration-approach"
                ],
                [
                  "4.3",
                  "Determine a new architecture for existing workloads",
                  "New architecture for existing workloads",
                  "migration-modernization:new-architecture"
                ],
                [
                  "4.4",
                  "Determine opportunities for modernization and enhancements",
                  "Modernization: serverless, containers, purpose-built databases and decoupling",
                  "migration-modernization:modernization"
                ]
              ]
            },
            {
              "type": "exam",
              "body": "Domains overlap in practice. A migration question (Domain 4) can hinge on a networking or security detail from Domain 1. Use the review lesson to practice crossing domains."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "Domain 1 tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Domain 2 tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain2.html"
                },
                {
                  "label": "Domain 3 tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain3.html"
                },
                {
                  "label": "Domain 4 tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain4.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Well-Architected pillars as the tie-breaker",
          "blocks": [
            {
              "type": "text",
              "body": "The exam is built on the AWS Well-Architected Framework, which is based on six pillars: operational excellence, security, reliability, performance efficiency, cost optimization and sustainability. When two options both satisfy the functional requirement, the question stem usually contains a keyword pointing to one pillar. That pillar usually decides."
            },
            {
              "type": "table",
              "headers": [
                "Pillar",
                "Keyword cues in a question stem",
                "Typical decision"
              ],
              "rows": [
                [
                  "Operational excellence",
                  "least operational overhead, automate, repeatable, runbook",
                  "Managed service or automation over self-managed"
                ],
                [
                  "Security",
                  "least privilege, encrypt, audit, isolate, compliance",
                  "Preventive control and narrowest permission"
                ],
                [
                  "Reliability",
                  "highly available, RTO, RPO, failover, no single point of failure",
                  "Multi-AZ/Region and automatic recovery meeting the stated RTO/RPO"
                ],
                [
                  "Performance efficiency",
                  "low latency, throughput, scale, right tool",
                  "Purpose-built service, caching, right instance or database"
                ],
                [
                  "Cost optimization",
                  "most cost-effective, minimize cost, spiky or predictable usage",
                  "Pricing model, tiering, managed vs self-managed total cost"
                ],
                [
                  "Sustainability",
                  "reduce energy, minimize provisioned resources (rare in stems)",
                  "Higher utilization, right-sizing, Region choice"
                ]
              ]
            },
            {
              "type": "bullets",
              "items": [
                "Hard requirements (RTO, compliance, data residency) are filters, not preferences: eliminate options that violate them first.",
                "Only then apply the pillar keyword to choose among what remains.",
                "If a stem has two pillar keywords, the explicit numeric constraint wins (for example RPO of seconds over 'cost-effective')."
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "The pillars of the Well-Architected Framework",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                },
                {
                  "label": "Well-Architected definitions",
                  "url": "https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/definitions.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scope: in-scope and out-of-scope services",
          "blocks": [
            {
              "type": "text",
              "body": "The guide publishes a non-exhaustive, subject-to-change list of in-scope services grouped into categories: Analytics, Application Integration, Blockchain, Business Applications, Cloud Financial Management, Compute, Containers, Database, Developer Tools, End User Computing, Frontend Web and Mobile, Internet of Things (IoT), Machine Learning, Media Services, Management and Governance, Migration and Transfer, Networking and Content Delivery, Security, Identity, and Compliance, and Storage."
            },
            {
              "type": "bullets",
              "items": [
                "Examples listed in scope include Amazon Athena, AWS Glue, Amazon Kinesis Data Streams, Amazon MSK, Amazon EventBridge, Amazon SQS, Amazon SNS, AWS Step Functions, AWS Budgets, AWS Cost Explorer, Savings Plans, AWS Lambda, AWS Outposts, Amazon ECS/EKS, Amazon Aurora, Amazon DynamoDB, Amazon ElastiCache, Amazon Redshift, AWS CodePipeline, Amazon API Gateway, and Amazon SageMaker AI (previously known as Amazon SageMaker).",
                "Out-of-scope (non-exhaustive): the Game Tech category, listing Amazon GameLift.",
                "The in-scope page lists the full set of services under each category, including the Management and Governance, Migration and Transfer, Networking and Content Delivery, Security, Identity, and Compliance, and Storage categories; consult it for the complete list."
              ]
            },
            {
              "type": "text",
              "body": "A service being out of scope means questions on it are not expected; a service being in scope does not mean equal depth. Spend study time proportionally to how often a service solves the problem types in the 20 tasks."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "In-scope AWS services (SAP-C02)",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/sap-02-in-scope-services.html"
                },
                {
                  "label": "Out-of-scope AWS services (SAP-C02)",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/sap-02-out-of-scope-services.html"
                }
              ]
            }
          ]
        },
        {
          "title": "How to use this course",
          "blocks": [
            {
              "type": "steps",
              "items": [
                "Work lessons in task order within a domain, or by weakness. Each lesson ends with a Lesson summary topic and 4-5 knowledge checks.",
                "Attempt each knowledge check before reading its explanation; the explanation says why every wrong option fails.",
                "Use the practice question bank after each lesson; tag misses by lesson id and revisit the mapped topic.",
                "Do the Architect toolkit lesson early so your lab account and budget guardrails exist before you build anything.",
                "Finish with the Scenario review lesson to practice cross-domain reasoning, then timed full-length practice."
              ]
            },
            {
              "type": "bullets",
              "items": [
                "Every topic ends with a 'learn' block of AWS documentation links: read at least one per topic for the services new to you.",
                "Knowledge checks are separate from the question bank and use original scenarios.",
                "Facts the build could not confirm from AWS documentation are flagged in the text as not verified."
              ]
            },
            {
              "type": "key",
              "title": "Lesson summary",
              "body": "1) SAP-C02 = 65 scored + 10 unscored questions, scaled 100-1,000, pass 750, compensatory. 2) Weights 26/29/25/20. 3) Multiple response needs all correct selections; no guessing penalty. 4) Six pillars break ties after hard constraints. 5) The last day to take SAP-C02 is November 16, 2026; SAP-C03 has different domains. 6) 20 tasks map to 20 lessons in this course."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "SAP-C02 vs SAP-C03 comparison",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-03/sap-03-comparison.html"
                }
              ]
            }
          ]
        }
      ]
    },
    "orientation:study-toolkit": {
      "title": "Architect toolkit",
      "topics": [
        {
          "title": "Overview",
          "blocks": [
            {
              "type": "text",
              "body": "Passing a professional-level architecture exam needs hands-on familiarity, but hands-on work costs money and can leave behind resources. This lesson sets up a safe, cheap lab, shows the command-line tooling you will use in other lessons, and teaches a method for reading long scenario questions. It is a skills lesson, not a service-depth lesson, so quotas and prices are deliberately not quoted here except where AWS documentation is cited."
            },
            {
              "type": "bullets",
              "items": [
                "Prerequisites: an email address you can dedicate to a lab account and basic terminal use.",
                "You will be able to set up an isolated lab account with budget alerts and cost allocation tags.",
                "You will be able to authenticate the AWS CLI with IAM Identity Center or use AWS CloudShell.",
                "You will be able to tear down a lab with a single CloudFormation stack delete and know what DeletionPolicy retains.",
                "You will be able to decompose a scenario question into requirement, constraints and distractors.",
                "You will be able to follow a time and study plan for a 75-question exam."
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "Creating a member account with AWS Organizations",
                  "url": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_create.html"
                },
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Lab account and Organizations",
          "blocks": [
            {
              "type": "text",
              "body": "Use a dedicated lab account, never a production account. AWS Organizations lets you create a member account from the management account; Organizations automatically creates an IAM role in the new account (default name OrganizationAccountAccessRole) that grants administrator permissions to principals in the management account, so you can administer the lab without a separate root login. Invited accounts do not get this role automatically."
            },
            {
              "type": "code",
              "label": "CLI",
              "body": "aws organizations create-account \\\n  --email <lab-account-email> \\\n  --account-name \"sapc02-lab\"\n\n# check progress using the request id returned above\naws organizations describe-create-account-status \\\n  --create-account-request-id <car-id>"
            },
            {
              "type": "bullets",
              "items": [
                "The email address must not already be associated with another AWS account.",
                "An account created through Organizations can be removed from the organization only after it has the information a standalone account requires (contact information, a verified phone number, a valid payment method, and a support plan), because that information is not collected automatically at creation. Complete these steps before you try to delete the organization.",
                "One account per workload or purpose gives separate cost, quota and blast-radius boundaries; this is the same reasoning the multi-account lesson uses."
              ]
            },
            {
              "type": "exam",
              "body": "Exam link: multi-account structure appears in Task 1.4. A sandbox or experimentation account separated from dev, test and prod is a standard pattern."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "Creating a member account with AWS Organizations",
                  "url": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_create.html"
                },
                {
                  "label": "Large vs micro accounts decision flow (AWS blog)",
                  "url": "https://aws.amazon.com/blogs/mt/deciding-between-large-accounts-or-micro-accounts-for-distributed-operations-at-aws/"
                }
              ]
            }
          ]
        },
        {
          "title": "Budgets and cost allocation tags",
          "blocks": [
            {
              "type": "text",
              "body": "AWS Budgets tracks cost or usage against an amount and alerts when actual or forecasted spend crosses a threshold. A threshold can be an absolute value or a percentage of the budget, and a notification can have up to 10 email addresses and can also publish to an Amazon SNS topic. Budget actions can additionally apply responses such as IAM policies, service control policies, or targeting specific Amazon EC2 or Amazon RDS instances, when a threshold is exceeded."
            },
            {
              "type": "code",
              "label": "CLI + JSON",
              "body": "aws budgets create-budget \\\n  --account-id <account-id> \\\n  --budget file://budget.json \\\n  --notifications-with-subscribers file://notifications.json\n\n# budget.json\n{\n  \"BudgetLimit\": { \"Amount\": \"100\", \"Unit\": \"USD\" },\n  \"BudgetName\": \"lab-monthly\",\n  \"BudgetType\": \"COST\",\n  \"TimeUnit\": \"MONTHLY\"\n}\n\n# notifications.json\n[\n  {\n    \"Notification\": {\n      \"ComparisonOperator\": \"GREATER_THAN\",\n      \"NotificationType\": \"ACTUAL\",\n      \"Threshold\": 80,\n      \"ThresholdType\": \"PERCENTAGE\"\n    },\n    \"Subscribers\": [\n      { \"Address\": \"<your-email>\", \"SubscriptionType\": \"EMAIL\" }\n    ]\n  },\n  {\n    \"Notification\": {\n      \"ComparisonOperator\": \"GREATER_THAN\",\n      \"NotificationType\": \"FORECASTED\",\n      \"Threshold\": 100,\n      \"ThresholdType\": \"PERCENTAGE\"\n    },\n    \"Subscribers\": [\n      { \"Address\": \"<your-email>\", \"SubscriptionType\": \"EMAIL\" }\n    ]\n  }\n]"
            },
            {
              "type": "text",
              "body": "Cost allocation tags: for tags to appear in billing reports you must activate the tag key in the Billing and Cost Management console (or with the UpdateCostAllocationTagsStatus API). After you create and apply user-defined tags it can take up to 24 hours for the keys to appear for activation, and then up to 24 hours for activation to take effect. Activation affects all values that share the key."
            },
            {
              "type": "bullets",
              "items": [
                "Pick a small tag set up front, for example Project, Owner, Environment, and apply it from your IaC templates.",
                "Set a budget at an amount you are comfortable losing, with an actual-spend alert (for example 80%) and a forecasted alert (for example 100%).",
                "Budget alerts only notify; they do not stop spend by themselves unless you configure a budget action."
              ]
            },
            {
              "type": "exam",
              "body": "Exam link: Task 1.5 asks for tagging strategies that map costs to business units; remember activation is a separate step from tagging."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "AWS Budgets CLI examples",
                  "url": "https://docs.aws.amazon.com/cli/latest/userguide/cli_budgets_code_examples.html"
                },
                {
                  "label": "Configuring a budget action",
                  "url": "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-action-configure.html"
                },
                {
                  "label": "Activating user-defined cost allocation tags",
                  "url": "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/activating-tags.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Region choice, guardrails and identity",
          "blocks": [
            {
              "type": "text",
              "body": "Choose one or two lab Regions and keep to them: fewer Regions means fewer forgotten resources. You can enforce this with a service control policy (SCP) that denies actions outside approved Regions using the aws:RequestedRegion condition key. AWS guidance shows this as a Deny with a NotAction list that exempts global services. The list of exempt actions below is illustrative; check each global service you use."
            },
            {
              "type": "code",
              "label": "SCP (illustrative)",
              "body": "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"DenyOutsideAllowedRegions\",\n      \"Effect\": \"Deny\",\n      \"NotAction\": [\"iam:*\", \"organizations:*\", \"route53:*\", \"cloudfront:*\", \"support:*\"],\n      \"Resource\": \"*\",\n      \"Condition\": {\n        \"StringNotEquals\": { \"aws:RequestedRegion\": [\"<allowed-region-1>\", \"<allowed-region-2>\"] }\n      }\n    }\n  ]\n}"
            },
            {
              "type": "text",
              "body": "For human access, AWS IAM Identity Center is the recommended service for centralized access management of human users across multiple accounts, and it can supply temporary CLI credentials. The CLI documentation describes two ways to configure it: an SSO token provider configuration (recommended) and a legacy non-refreshable configuration. The aws configure sso wizard walks you through the start URL, Region, account and role."
            },
            {
              "type": "code",
              "label": "CLI",
              "body": "aws configure sso\n# follow prompts: SSO start URL, SSO Region, account, role, default Region, profile name\n\naws sso login --profile <profile>\naws sts get-caller-identity --profile <profile>"
            },
            {
              "type": "bullets",
              "items": [
                "Use an Identity Center permission set with least privilege that fits the lab; avoid long-lived access keys.",
                "SCPs do not grant permissions; they set the maximum permissions available to IAM users and roles in member accounts.",
                "SCPs have no effect on users and roles in the management account, so do not run labs there."
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "IAM Identity Center with the AWS CLI",
                  "url": "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html"
                },
                {
                  "label": "Preventive controls with SCPs (Regions)",
                  "url": "https://aws.amazon.com/blogs/mt/identity-guide-preventive-controls-with-aws-identity-scps/"
                }
              ]
            }
          ]
        },
        {
          "title": "CloudShell and cleanup",
          "blocks": [
            {
              "type": "text",
              "body": "AWS CloudShell is a browser-based shell that inherits the credentials of the console user, so no local credential setup is needed. It includes the AWS CLI, AWS SAM CLI, runtimes for Python and Node.js, shells such as Bash, PowerShell and Zsh, Git, and npm/pip. You get up to 1 GB of persistent storage per Region in your home directory at no additional cost; if you stop using CloudShell in a Region, the data is retained for 120 days after your last session. VPC environments have no persistent storage."
            },
            {
              "type": "code",
              "label": "CLI",
              "body": "aws --version\naws sts get-caller-identity\naws ec2 describe-regions --query 'Regions[].RegionName' --output text\naws cloudformation create-stack --stack-name lab1 --template-body file://lab.yaml\naws cloudformation delete-stack --stack-name lab1\naws cloudformation wait stack-delete-complete --stack-name lab1"
            },
            {
              "type": "text",
              "body": "Cleanup by stack deletion: when you delete a CloudFormation stack, all resources in it are deleted unless a DeletionPolicy says otherwise. Retain keeps the resource, which continues to incur applicable charges; Snapshot creates a snapshot first for resources that support snapshots, and the snapshot also continues to incur charges. The default for RDS DB clusters and for DB instances without DBClusterIdentifier is Snapshot instead of Delete. Deletion cannot be stopped once started; a stack can enter DELETE_FAILED, after which you can retry delete and choose to retain the failed resources."
            },
            {
              "type": "code",
              "label": "CloudFormation",
              "body": "AWSTemplateFormatVersion: \"2010-09-09\"\nDescription: Lab stack - everything here is removed when the stack is deleted\nResources:\n  LabBucket:\n    Type: AWS::S3::Bucket\n    Properties:\n      Tags:\n        - Key: Project\n          Value: sapc02-lab\n  KeepBucket:\n    Type: AWS::S3::Bucket\n    DeletionPolicy: Retain\n    Properties:\n      Tags:\n        - Key: Project\n          Value: sapc02-lab"
            },
            {
              "type": "bullets",
              "items": [
                "Build every lab from a template so cleanup is one delete.",
                "After deleting, check Cost Explorer or the Budgets page next day for lingering charges such as retained buckets, snapshots, and Elastic IPs.",
                "For a non-empty S3 bucket, stack deletion succeeds only after all objects in the bucket are deleted, so empty the bucket first."
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "What is AWS CloudShell?",
                  "url": "https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html"
                },
                {
                  "label": "Delete a stack from the console",
                  "url": "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html"
                },
                {
                  "label": "DeletionPolicy attribute",
                  "url": "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-attribute-deletionpolicy.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Reading scenario questions",
          "blocks": [
            {
              "type": "text",
              "body": "Scenario questions pack a company situation, a requirement and several constraints into a paragraph, then offer options that each solve the problem at some cost. A repeatable method turns this into elimination."
            },
            {
              "type": "steps",
              "items": [
                "Read the last sentence first: it states the ask (for example 'which solution meets these requirements with the least operational overhead?').",
                "Underline the primary requirement (what must be achieved) and the constraints (numbers, compliance, existing technology, deadlines).",
                "Classify keywords: RTO/RPO, 'minimal changes', 'near-zero downtime', 'cost-effective', 'least operational overhead', 'must be encrypted', 'existing on-premises'.",
                "Eliminate options that violate any hard constraint, even if they look elegant.",
                "Among survivors apply the pillar from the qualifier; if still tied prefer the managed, simpler or native option.",
                "Re-read the stem against your choice to check you did not assume facts it did not give."
              ]
            },
            {
              "type": "table",
              "headers": [
                "Qualifier",
                "Steers you toward",
                "Steers you away from"
              ],
              "rows": [
                [
                  "Least operational overhead",
                  "Managed or serverless service; automation",
                  "Self-managed software on EC2; custom scripts"
                ],
                [
                  "Most cost-effective",
                  "Right pricing model, tiering, managed vs run-yourself total cost",
                  "Over-provisioned always-on capacity"
                ],
                [
                  "Minimal changes to the application",
                  "Rehost/replatform; compatible engines; lift-and-shift tooling",
                  "Refactor or rewrite"
                ],
                [
                  "Near-zero RPO/RTO",
                  "Multi-site or warm standby, synchronous or continuous replication",
                  "Backup and restore"
                ],
                [
                  "Most secure / least privilege",
                  "Narrow IAM, encryption, private connectivity",
                  "Broad managed policies, public endpoints"
                ]
              ]
            },
            {
              "type": "exam",
              "body": "Multi-response questions: the stem tells you how many to choose. Each option must be judged independently against the stem; if you can only confirm one, choose the best remaining candidate rather than leave it blank, since no penalty applies for guessing. Credit requires every correct response."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "The pillars of the Well-Architected Framework",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Time management and study plan",
          "blocks": [
            {
              "type": "text",
              "body": "The exam has 65 scored plus 10 unscored questions, all indistinguishable, so plan for 75 questions. The AWS certification page lists a duration of 180 minutes, which is about 2.4 minutes per question (180 divided by 75); confirm the duration in your registration confirmation, and hold a buffer for review."
            },
            {
              "type": "bullets",
              "items": [
                "First pass: answer what you can in about your per-question budget; mark long or uncertain items and move on.",
                "Second pass: return to marked questions; use elimination before guessing.",
                "Final minutes: make sure no question is unanswered.",
                "Do not spend extra time hunting for which questions are unscored; you cannot tell."
              ]
            },
            {
              "type": "table",
              "headers": [
                "Week",
                "Focus",
                "Output"
              ],
              "rows": [
                [
                  "1",
                  "Toolkit lesson, lab account, Domain 1 lessons (network, security, resilience, multi-account, cost)",
                  "Lab with budget; notes by lesson"
                ],
                [
                  "2",
                  "Domain 2 lessons (largest weight, 29%)",
                  "Knowledge checks 80% or more"
                ],
                [
                  "3",
                  "Domain 3 and Domain 4 lessons",
                  "Question bank misses logged by lesson id"
                ],
                [
                  "4",
                  "Scenario review lesson; timed full practice; revisit weakest lessons",
                  "Error log, final weak-area pass"
                ]
              ]
            },
            {
              "type": "text",
              "body": "The schedule is a suggestion; shorten or lengthen by experience. The guide calls for 2+ years of relevant experience, so adjust hands-on time to what you have not touched."
            },
            {
              "type": "key",
              "title": "Lesson summary",
              "body": "Use a dedicated lab account with Budgets alerts and activated cost allocation tags. Authenticate the CLI with IAM Identity Center or use CloudShell. Build labs from CloudFormation and delete the stack to clean up, remembering DeletionPolicy. Read the question's last sentence first, eliminate on hard constraints, then apply the pillar keyword. Answer every question."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                }
              ]
            }
          ]
        }
      ]
    },
    "review:scenario-review": {
      "title": "Scenario review",
      "topics": [
        {
          "title": "Overview",
          "blocks": [
            {
              "type": "text",
              "body": "This review lesson stitches the course together with five cross-domain scenarios. Each scenario lists requirements, constraints, a chosen architecture, rejected alternatives and a pointer table to the lesson that teaches each piece. The designs are illustrative: service limits, prices and exact feature behavior are covered, with sources, in the referenced lessons and are not re-verified here."
            },
            {
              "type": "bullets",
              "items": [
                "Prerequisites: at least the lessons you reference in each scenario.",
                "You will be able to decompose a multi-domain scenario into pieces and name the lesson for each.",
                "You will be able to justify a design by requirement and reject alternatives by constraint.",
                "You will be able to turn missed questions into a targeted study list."
              ]
            },
            {
              "type": "text",
              "body": "Exam questions are scored individually, but real questions often cross domains. The domain weights (26/29/25/20) come from the official guide."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scenario 1: Multi-account landing zone with hybrid network and DR",
          "blocks": [
            {
              "type": "key",
              "title": "Requirements",
              "body": "A company is moving 30 workload teams to AWS. It needs separate prod and non-prod isolation, central audit logging, private connectivity from two data centers, and a disaster recovery plan with an RTO of 1 hour and an RPO of 5 minutes for its tier-1 database."
            },
            {
              "type": "key",
              "title": "Constraints",
              "body": "Security team must prevent use of unapproved Regions; network teams want a single place to manage routing; budget is limited, so only tier-1 gets a standby; engineers should not use IAM users."
            },
            {
              "type": "text",
              "body": "Architecture: AWS Organizations with OUs per environment and a landing zone; SCPs for Region restriction; a central logging account; IAM Identity Center for access; a hub network (Transit Gateway) with Direct Connect plus VPN backup to data centers; tier-1 database replicated to a second Region and run as warm standby, other tiers on backup and restore. Specific limits and features are taught in the linked lessons and are not re-verified here."
            },
            {
              "type": "table",
              "headers": [
                "Rejected alternative",
                "Why it fails"
              ],
              "rows": [
                [
                  "Single account with many VPCs",
                  "No billing/permission isolation and a larger blast radius; cannot apply SCPs per environment."
                ],
                [
                  "Full multi-site active/active for every tier",
                  "Exceeds the stated RTO/RPO need and the limited budget; warm standby fits 1 h / 5 min for the tier-1 database only."
                ],
                [
                  "Full-mesh VPC peering",
                  "Peering is non-transitive and the number of connections grows quickly; a hub is easier to manage."
                ]
              ]
            },
            {
              "type": "table",
              "headers": [
                "Piece of the design",
                "Lesson that teaches it (id)"
              ],
              "rows": [
                [
                  "Account structure, SCPs, central logging",
                  "org-complexity:multi-account"
                ],
                [
                  "Hybrid network, Transit Gateway, Direct Connect, VPN",
                  "org-complexity:network-connectivity"
                ],
                [
                  "Identity Center, cross-account roles",
                  "org-complexity:security-controls"
                ],
                [
                  "RTO/RPO and DR strategy choice",
                  "org-complexity:resilient-architectures"
                ],
                [
                  "Multi-Region failover routing and replication",
                  "new-solutions:business-continuity"
                ]
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 Domain tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scenario 2: Migration plus modernization",
          "blocks": [
            {
              "type": "key",
              "title": "Requirements",
              "body": "A retailer has 200 on-premises servers, an Oracle database and a monolithic order system. Leadership wants the data center exited in 9 months, with the order system modernized into decoupled services afterwards."
            },
            {
              "type": "key",
              "title": "Constraints",
              "body": "Limited time; few teams can refactor now; cutover downtime must be minutes; the Oracle license is expensive."
            },
            {
              "type": "text",
              "body": "Architecture: Discover and assess with migration tooling and group into waves; rehost most servers first with a continuous-replication migration service; use a database migration service with schema conversion to move Oracle to an open-source-compatible engine where the schema allows; bulk-copy file data online or with devices depending on bandwidth; later, strangle the monolith by placing queues/events between components and adopting containers or serverless. Verify tool behavior in the linked lessons."
            },
            {
              "type": "table",
              "headers": [
                "Rejected alternative",
                "Why it fails"
              ],
              "rows": [
                [
                  "Refactor everything before migrating",
                  "Cannot meet the 9-month exit; time constraint favours rehost then modernize."
                ],
                [
                  "Move the database as-is to EC2",
                  "Keeps the license cost and operational burden; a managed engine reduces both."
                ],
                [
                  "Copy all file data over the existing internet link",
                  "May miss the deadline if bandwidth is limited; transfer method depends on data size and bandwidth."
                ]
              ]
            },
            {
              "type": "table",
              "headers": [
                "Piece of the design",
                "Lesson that teaches it (id)"
              ],
              "rows": [
                [
                  "Discovery, assessment, wave planning",
                  "migration-modernization:select-workloads"
                ],
                [
                  "7 Rs, MGN, DMS/SCT, DataSync, Snow, cutover",
                  "migration-modernization:migration-approach"
                ],
                [
                  "Target compute/storage/database design",
                  "migration-modernization:new-architecture"
                ],
                [
                  "Serverless, containers, decoupling",
                  "migration-modernization:modernization"
                ]
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 Domain tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scenario 3: Security incident hardening",
          "blocks": [
            {
              "type": "key",
              "title": "Requirements",
              "body": "A GuardDuty-style alert shows an access key from a developer laptop was used from an unknown address, and an S3 bucket policy allowed public read. The company must contain, investigate and harden."
            },
            {
              "type": "key",
              "title": "Constraints",
              "body": "No downtime for customer-facing apps; evidence must be preserved; findings from all accounts must reach one team."
            },
            {
              "type": "text",
              "body": "Architecture: Revoke the exposed credentials and replace long-lived keys with role-based temporary credentials; review CloudTrail for the key's activity; enable S3 Block Public Access and use IAM Access Analyzer to find external access; encrypt with KMS and restrict key policies; aggregate findings in a central security account with Security Hub; add preventive SCPs for risky actions; automate remediation with event-driven rules."
            },
            {
              "type": "table",
              "headers": [
                "Rejected alternative",
                "Why it fails"
              ],
              "rows": [
                [
                  "Delete the affected account's resources",
                  "Destroys evidence and causes downtime."
                ],
                [
                  "Rely on security groups only",
                  "They do not govern IAM or bucket policy exposure."
                ],
                [
                  "Manual weekly review of each account",
                  "Does not scale across accounts and has high operational overhead."
                ]
              ]
            },
            {
              "type": "table",
              "headers": [
                "Piece of the design",
                "Lesson that teaches it (id)"
              ],
              "rows": [
                [
                  "Cross-account access, KMS, CloudTrail, Access Analyzer, Security Hub",
                  "org-complexity:security-controls"
                ],
                [
                  "Least privilege, endpoints, WAF/GuardDuty, secrets",
                  "new-solutions:security-requirements"
                ],
                [
                  "Improving an existing environment's security",
                  "continuous-improvement:improve-security"
                ],
                [
                  "Automated remediation and logging",
                  "continuous-improvement:operational-excellence"
                ]
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 Domain tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scenario 4: Cost and performance optimization of a running workload",
          "blocks": [
            {
              "type": "key",
              "title": "Requirements",
              "body": "A web application on always-on EC2 behind a load balancer has a rising bill and slow reports. Traffic is spiky, the database is read-heavy, and old logs sit on the most expensive storage."
            },
            {
              "type": "key",
              "title": "Constraints",
              "body": "No re-platforming of the core app this quarter; must show savings by business unit; response times for reads must improve."
            },
            {
              "type": "text",
              "body": "Architecture: Use Cost Explorer, Compute Optimizer and tags to find savings; right-size instances and use Auto Scaling for the spiky tier; cover steady baseline with a commitment-based pricing model and keep spiky capacity on-demand or Spot where tolerant; add read replicas or a cache for read-heavy queries; move cold data to cheaper storage tiers with lifecycle rules; use a CDN for static content."
            },
            {
              "type": "table",
              "headers": [
                "Rejected alternative",
                "Why it fails"
              ],
              "rows": [
                [
                  "Buy commitments for peak capacity",
                  "Peak is spiky; committing to it wastes money on idle hours."
                ],
                [
                  "Scale the database vertically only",
                  "Raises cost without addressing read load; replicas/caching are cheaper."
                ],
                [
                  "Rewrite the app to serverless",
                  "Not allowed this quarter and not required to meet the goals."
                ]
              ]
            },
            {
              "type": "table",
              "headers": [
                "Piece of the design",
                "Lesson that teaches it (id)"
              ],
              "rows": [
                [
                  "Cost tools, tagging, purchasing options",
                  "org-complexity:cost-visibility"
                ],
                [
                  "Performance design: caching, replicas, instance families",
                  "new-solutions:performance"
                ],
                [
                  "Improving existing performance",
                  "continuous-improvement:improve-performance"
                ],
                [
                  "Finding savings in existing solutions",
                  "continuous-improvement:improve-cost"
                ],
                [
                  "Cost strategy for new solutions, tiering",
                  "new-solutions:cost-strategy"
                ]
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 Domain tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "Scenario 5: Resilience improvement for a regional outage",
          "blocks": [
            {
              "type": "key",
              "title": "Requirements",
              "body": "A payment API runs in one Region with a single-AZ database. After an outage, the business sets an RTO of 15 minutes and an RPO of near zero for the database."
            },
            {
              "type": "key",
              "title": "Constraints",
              "body": "Must be cost-conscious; deployments must be repeatable; failures must recover without humans at 3 a.m."
            },
            {
              "type": "text",
              "body": "Architecture: Move to multi-AZ for the database and compute behind a load balancer with Auto Scaling; add cross-Region replication and health-checked DNS failover for the regional scenario; use IaC pipelines for identical stacks; schedule failure drills. The choice between warm standby and multi-site depends on the stated RTO/RPO and budget."
            },
            {
              "type": "table",
              "headers": [
                "Rejected alternative",
                "Why it fails"
              ],
              "rows": [
                [
                  "Backup and restore only",
                  "Restore time normally exceeds a 15-minute RTO."
                ],
                [
                  "Larger single-AZ instance",
                  "Does not remove the single point of failure."
                ],
                [
                  "Manual runbook failover",
                  "Conflicts with automatic recovery and the 3 a.m. constraint."
                ]
              ]
            },
            {
              "type": "table",
              "headers": [
                "Piece of the design",
                "Lesson that teaches it (id)"
              ],
              "rows": [
                [
                  "Multi-AZ, auto recovery, scale options",
                  "org-complexity:resilient-architectures"
                ],
                [
                  "Replication and DNS routing, quotas",
                  "new-solutions:reliability"
                ],
                [
                  "Failover and DR testing",
                  "new-solutions:business-continuity"
                ],
                [
                  "IaC and pipelines",
                  "new-solutions:deployment-strategy"
                ],
                [
                  "Reliability fixes to existing systems",
                  "continuous-improvement:improve-reliability"
                ]
              ]
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 Domain tasks",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02-domain1.html"
                },
                {
                  "label": "Well-Architected pillars",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        },
        {
          "title": "How to review mistakes",
          "blocks": [
            {
              "type": "steps",
              "items": [
                "Log each missed or guessed question: lesson id, task number, what the stem asked, which keyword you missed.",
                "Classify the cause: knowledge gap, misread constraint, fell for a distractor, or time pressure.",
                "For knowledge gaps, re-read the lesson topic and its AWS doc links; write the decision rule in one line.",
                "For misreads, redo the question using the method in the Architect toolkit lesson: ask first, constraints second, eliminate, then pillar.",
                "Re-test the same concept with a different scenario after 2-3 days, not the same question.",
                "Track by domain weight: a recurring miss in Domain 2 costs more than one in Domain 4 (29% vs 20%)."
              ]
            },
            {
              "type": "table",
              "headers": [
                "Cause",
                "Fix"
              ],
              "rows": [
                [
                  "Missed qualifier (e.g. least overhead)",
                  "Highlight the qualifier first; map to pillar"
                ],
                [
                  "Chose a technically valid but over-built design",
                  "Re-check stem for stated RTO/RPO/budget; choose the minimum that meets them"
                ],
                [
                  "Confused two similar services",
                  "Write a one-line distinguishing rule in the lesson summary"
                ],
                [
                  "Ran out of time",
                  "Practice first-pass pacing; mark and move"
                ]
              ]
            },
            {
              "type": "key",
              "title": "Lesson summary",
              "body": "Cross-domain scenarios are solved by separating the ask, hard constraints and qualifier, then mapping each piece to a lesson. Reject alternatives by naming the violated constraint. Review mistakes by cause, not just by answer."
            },
            {
              "type": "learn",
              "links": [
                {
                  "label": "SAP-C02 exam guide",
                  "url": "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/solutions-architect-professional-02.html"
                },
                {
                  "label": "The pillars of the Well-Architected Framework",
                  "url": "https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html"
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "flashcards": {
    "orientation": [
      {
        "front": "Passing score",
        "back": "The exam guide states a minimum passing scaled score of 750 (scale 100-1,000)."
      },
      {
        "front": "Scored vs unscored questions",
        "back": "65 questions affect your score; 10 unscored questions are not identified."
      },
      {
        "front": "Domain weights",
        "back": "Org complexity 26%, new solutions 29%, continuous improvement 25%, migration and modernization 20%."
      }
    ],
    "org-complexity": [
      {
        "front": "DR strategies named in the exam guide",
        "back": "Backup and restore, pilot light, warm standby and multi-site, plus AWS Elastic Disaster Recovery."
      },
      {
        "front": "Multi-account services named in the exam guide",
        "back": "AWS Organizations and AWS Control Tower."
      },
      {
        "front": "Purchasing options named in the exam guide",
        "back": "Reserved Instances, Savings Plans and Spot Instances."
      }
    ],
    "new-solutions": [
      {
        "front": "Route 53 routing policies named in the exam guide",
        "back": "Latency-based, geolocation and simple routing."
      },
      {
        "front": "Application integration services named in the exam guide",
        "back": "Amazon SNS, Amazon SQS and AWS Step Functions."
      },
      {
        "front": "Managed security services named in the exam guide",
        "back": "AWS Shield, AWS WAF, Amazon GuardDuty and AWS Security Hub."
      }
    ],
    "continuous-improvement": [
      {
        "front": "Deployment strategies named in the exam guide",
        "back": "Blue/green, all-at-once and rolling."
      },
      {
        "front": "Config management tool named in the exam guide",
        "back": "AWS Systems Manager."
      },
      {
        "front": "Monitoring service named in the exam guide",
        "back": "Amazon CloudWatch."
      }
    ],
    "migration-modernization": [
      {
        "front": "Serverless compute named in the exam guide",
        "back": "AWS Lambda."
      },
      {
        "front": "Container services named in the exam guide",
        "back": "Amazon ECS, Amazon EKS and AWS Fargate."
      },
      {
        "front": "Integration services named in the exam guide",
        "back": "Amazon SQS, Amazon SNS, Amazon EventBridge and AWS Step Functions."
      }
    ],
    "review": []
  }
};
