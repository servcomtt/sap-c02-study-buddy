// Course structure for the SAP-C02 Study Buddy. Domains, tasks and objectives come from the exam guide in docs/
// (each objective is a verbatim "Skills in" bullet). Durations are authored study-time estimates.
module.exports = {
  "AS_OF": "the SAP-C02 exam guide supplied in docs/ (4 content domains)",
  "domains": [
    {
      "id": "org-complexity",
      "title": "Design Solutions for Organizational Complexity",
      "weight": "26%",
      "low": 26,
      "high": 26
    },
    {
      "id": "new-solutions",
      "title": "Design for New Solutions",
      "weight": "29%",
      "low": 29,
      "high": 29
    },
    {
      "id": "continuous-improvement",
      "title": "Continuous Improvement for Existing Solutions",
      "weight": "25%",
      "low": 25,
      "high": 25
    },
    {
      "id": "migration-modernization",
      "title": "Accelerate Workload Migration and Modernization",
      "weight": "20%",
      "low": 20,
      "high": 20
    }
  ],
  "modules": [
    {
      "id": "orientation",
      "title": "Course Orientation",
      "shortTitle": "Orientation",
      "accent": "#556b2f",
      "domain": "Exam map and AWS architecture mindset",
      "weight": "Foundation",
      "duration": "1.5 hrs",
      "overview": "Start with the SAP-C02 content domains, the question formats and scoring, and how to use this study app. Then set up the AWS account and lab habits you need for the four technical chapters.",
      "objectives": [
        "Identify the four content domains and their weights",
        "Describe the target candidate and the question formats",
        "Plan a study sequence that uses chapters, labs, flashcards and the practice quiz"
      ],
      "takeaways": [
        "SAP-C02 tests scenario judgement: pick the design that meets every stated constraint, then the one that best fits the optimisation keyword.",
        "Domain weights are 26/29/25/20; the 20 task statements are the study map for this course.",
        "The exam guide supplied with this course is SAP-C02; AWS publishes a successor exam, so check the current exam page before booking.",
        "Use a dedicated lab account with budgets and delete every lab stack when finished."
      ],
      "lessons": [
        {
          "id": "certification-map",
          "title": "Certification map",
          "duration": "40 min",
          "summary": "Map your study plan to the SAP-C02 content domains and task statements.",
          "objectives": [
            "Identify the four content domains and their weights",
            "Describe the target candidate and the question formats",
            "Plan a study sequence that uses chapters, labs, flashcards and the practice quiz"
          ],
          "practice": [
            "Write down which of the 20 task statements you already use at work and which are new to you.",
            "Open the Dashboard and note the domain weights; schedule more time for the heavier domains."
          ],
          "sources": [
            "exam-page"
          ]
        },
        {
          "id": "study-toolkit",
          "title": "Architect toolkit",
          "duration": "50 min",
          "summary": "Choose tools, prepare a safe lab account, and apply the Well-Architected lens.",
          "objectives": [
            "Choose between the AWS Management Console, AWS CLI and infrastructure as code for a task",
            "Plan a lab account with budgets, regions and cleanup habits",
            "Apply the Well-Architected pillars when comparing answer options"
          ],
          "practice": [
            "Create an AWS Budget with an alert and a tag policy for lab resources.",
            "List the lab resources you plan to deploy and mark which ones bill by the hour."
          ],
          "sources": [
            "wa",
            "aws-docs"
          ]
        }
      ]
    },
    {
      "id": "org-complexity",
      "title": "Design Solutions for Organizational Complexity",
      "shortTitle": "Organizational complexity",
      "accent": "#b45309",
      "domain": "Design Solutions for Organizational Complexity",
      "weight": "26%",
      "duration": "3.8 hrs",
      "overview": "Content Domain 1 of the SAP-C02 exam guide (26% of scored content). 5 lessons, one per task statement.",
      "takeaways": [
        "Choose connectivity by scale and routing needs: peering for a few VPCs, Transit Gateway for many, PrivateLink for one-way service exposure, Direct Connect plus VPN for resilient hybrid.",
        "Layer account-level guardrails (SCPs, Control Tower) over identity-level permissions; SCPs never grant access.",
        "Map RTO and RPO to a disaster recovery strategy before picking services.",
        "Use organisation-wide tagging, Cost Explorer, Budgets and purchasing commitments for cost visibility."
      ],
      "lessons": [
        {
          "id": "network-connectivity",
          "title": "Network connectivity strategies",
          "duration": "45 min",
          "summary": "Task 1.1: Architect network connectivity strategies.",
          "objectives": [
            "Evaluating connectivity options for multiple VPCs",
            "Evaluating connectivity options for on-premises, co-location, and cloud integration",
            "Selecting AWS Regions and Availability Zones based on network and latency requirements",
            "Troubleshooting traffic flows by using AWS tools",
            "Using service endpoints for service integrations"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "vpc"
          ]
        },
        {
          "id": "security-controls",
          "title": "Security controls",
          "duration": "45 min",
          "summary": "Task 1.2: Prescribe security controls.",
          "objectives": [
            "Evaluating cross-account access management",
            "Integrating with third-party identity providers",
            "Deploying encryption strategies for data at rest and data in transit",
            "Developing a strategy for centralized security event notifications and auditing"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "resilient-architectures",
          "title": "Reliable and resilient architectures",
          "duration": "50 min",
          "summary": "Task 1.3: Design reliable and resilient architectures.",
          "objectives": [
            "Designing disaster recovery solutions based on RTO and RPO requirements",
            "Implementing architectures to automatically recover from failure",
            "Developing the optimal architecture by considering scale-up and scale-out options",
            "Designing an effective backup and restoration strategy"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "dr"
          ]
        },
        {
          "id": "multi-account",
          "title": "Multi-account environments",
          "duration": "45 min",
          "summary": "Task 1.4: Design a multi-account AWS environment.",
          "objectives": [
            "Evaluating the most appropriate account structure for organizational requirements",
            "Recommending a strategy for central logging and event notifications",
            "Developing a multi-account governance model"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "orgs",
            "control-tower"
          ]
        },
        {
          "id": "cost-visibility",
          "title": "Cost optimization and visibility",
          "duration": "40 min",
          "summary": "Task 1.5: Determine cost optimization and visibility strategies.",
          "objectives": [
            "Monitoring cost and usage with AWS tools",
            "Developing an effective tagging strategy that maps costs to business units",
            "Understanding how purchasing options affect cost and performance"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "cost"
          ]
        }
      ],
      "objectives": [
        "Evaluating connectivity options for multiple VPCs",
        "Evaluating connectivity options for on-premises, co-location, and cloud integration",
        "Selecting AWS Regions and Availability Zones based on network and latency requirements",
        "Troubleshooting traffic flows by using AWS tools",
        "Using service endpoints for service integrations",
        "Evaluating cross-account access management",
        "Integrating with third-party identity providers",
        "Deploying encryption strategies for data at rest and data in transit"
      ]
    },
    {
      "id": "new-solutions",
      "title": "Design for New Solutions",
      "shortTitle": "New solutions",
      "accent": "#0f766e",
      "domain": "Design for New Solutions",
      "weight": "29%",
      "duration": "4.5 hrs",
      "overview": "Content Domain 2 of the SAP-C02 exam guide (29% of scored content). 6 lessons, one per task statement.",
      "takeaways": [
        "Design from the requirement: deployment, continuity, security, reliability, performance and cost each have a decision rule you can apply to any scenario.",
        "Prefer managed services and infrastructure as code when the question rewards least operational overhead.",
        "Multi-AZ gives high availability; multi-Region is for disaster recovery or latency, and costs more.",
        "Match the data store, cache and compute family to the access pattern before sizing."
      ],
      "lessons": [
        {
          "id": "deployment-strategy",
          "title": "Deployment strategy",
          "duration": "45 min",
          "summary": "Task 2.1: Design a deployment strategy to meet business requirements.",
          "objectives": [
            "Determining an application or upgrade path for new services and features",
            "Selecting services to develop deployment strategies and implement appropriate rollback mechanisms",
            "Adopting managed services as needed to reduce infrastructure provisioning and patching overhead",
            "Making advanced technologies accessible by delegating complex development and deployment tasks to AWS"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "business-continuity",
          "title": "Business continuity",
          "duration": "50 min",
          "summary": "Task 2.2: Design a solution to ensure business continuity.",
          "objectives": [
            "Configuring disaster recovery solutions",
            "Configuring data and database replication",
            "Performing disaster recovery testing",
            "Architecting a backup solution that is automated, is cost-effective, and supports business continuity across multiple Availability Zones or AWS Regions",
            "Designing an architecture that provides application and infrastructure availability in the event of a disruption",
            "Using processes and components for centralized monitoring to proactively recover from system failures"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "dr"
          ]
        },
        {
          "id": "security-requirements",
          "title": "Security controls from requirements",
          "duration": "50 min",
          "summary": "Task 2.3: Determine security controls based on requirements.",
          "objectives": [
            "Specifying IAM users and IAM roles that adhere to the principle of least privilege access",
            "Specifying inbound and outbound network flows by using security group rules and network ACL rules",
            "Developing attack mitigation strategies for large-scale web applications",
            "Developing encryption strategies for data at rest and data in transit",
            "Specifying service endpoints for service integrations",
            "Developing strategies for patch management to remain compliant with organizational standards"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "reliability",
          "title": "Reliability requirements",
          "duration": "50 min",
          "summary": "Task 2.4: Design a strategy to meet reliability requirements.",
          "objectives": [
            "Designing highly available application environments based on business requirements",
            "Using advanced techniques to design for failure and ensure seamless system recoverability",
            "Implementing loosely coupled dependencies",
            "Operating and maintaining high-availability architectures (for example, application failovers, database failovers)",
            "Using AWS managed services for high availability",
            "Implementing DNS routing policies (for example, Route 53 latency-based routing, geolocation routing, simple routing)"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "performance",
          "title": "Performance objectives",
          "duration": "45 min",
          "summary": "Task 2.5: Design a solution to meet performance objectives.",
          "objectives": [
            "Designing large-scale application architectures for a variety of access patterns",
            "Designing an elastic architecture based on business objectives",
            "Applying design patterns to meet performance objectives with caching, buffering, and replicas",
            "Developing a process methodology for selecting purpose-built services for required tasks",
            "Designing a rightsizing strategy"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "cost-strategy",
          "title": "Cost optimization strategy",
          "duration": "40 min",
          "summary": "Task 2.6: Determine a cost optimization strategy to meet solution goals and objectives.",
          "objectives": [
            "Identifying opportunities to select and rightsize infrastructure for cost-effective resources",
            "Identifying appropriate pricing models",
            "Performing data transfer modeling and selecting services to reduce data transfer costs",
            "Developing a strategy and implementing controls for expenditure and usage awareness"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "cost"
          ]
        }
      ],
      "objectives": [
        "Determining an application or upgrade path for new services and features",
        "Selecting services to develop deployment strategies and implement appropriate rollback mechanisms",
        "Adopting managed services as needed to reduce infrastructure provisioning and patching overhead",
        "Making advanced technologies accessible by delegating complex development and deployment tasks to AWS",
        "Configuring disaster recovery solutions",
        "Configuring data and database replication",
        "Performing disaster recovery testing",
        "Architecting a backup solution that is automated, is cost-effective, and supports business continuity across multiple Availability Zones or AWS Regions"
      ]
    },
    {
      "id": "continuous-improvement",
      "title": "Continuous Improvement for Existing Solutions",
      "shortTitle": "Continuous improvement",
      "accent": "#6d28d9",
      "domain": "Continuous Improvement for Existing Solutions",
      "weight": "25%",
      "duration": "3.8 hrs",
      "overview": "Content Domain 3 of the SAP-C02 exam guide (25% of scored content). 5 lessons, one per task statement.",
      "takeaways": [
        "Improvement questions start from evidence: metrics, logs, findings and cost data identify the change.",
        "Automate detection and remediation (CloudWatch, EventBridge, Config, Systems Manager) instead of fixing by hand.",
        "Rightsize and re-platform before buying commitments; commit only to steady usage.",
        "Harden existing workloads incrementally without breaking availability."
      ],
      "lessons": [
        {
          "id": "operational-excellence",
          "title": "Operational excellence",
          "duration": "45 min",
          "summary": "Task 3.1: Determine a strategy to improve overall operational excellence.",
          "objectives": [
            "Determining the most appropriate logging and monitoring strategy",
            "Evaluating current deployment processes for improvement opportunities",
            "Prioritizing opportunities for automation within a solution stack",
            "Recommending the appropriate AWS solution to enable configuration management automation",
            "Engineering failure scenario activities to support and exercise an understanding of recovery actions"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "improve-security",
          "title": "Improving security",
          "duration": "45 min",
          "summary": "Task 3.2: Determine a strategy to improve security.",
          "objectives": [
            "Evaluating a strategy for the secure management of secrets and credentials",
            "Auditing an environment for least privilege access",
            "Reviewing implemented solutions to ensure security at every layer",
            "Reviewing comprehensive traceability of users and services",
            "Prioritizing automated responses to the detection of vulnerabilities",
            "Designing and implementing a patch and update process",
            "Designing and implementing a backup process",
            "Employing remediation techniques"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "improve-performance",
          "title": "Improving performance",
          "duration": "40 min",
          "summary": "Task 3.3: Determine a strategy to improve performance.",
          "objectives": [
            "Translating business requirements to measurable metrics",
            "Testing potential remediation solutions and making recommendations",
            "Proposing opportunities for the adoption of new technologies and managed services",
            "Assessing solutions and applying rightsizing based on requirements",
            "Identifying and examining performance bottlenecks"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        },
        {
          "id": "improve-reliability",
          "title": "Improving reliability",
          "duration": "45 min",
          "summary": "Task 3.4: Determine a strategy to improve reliability.",
          "objectives": [
            "Understanding application growth and usage trends",
            "Evaluating existing architecture to determine areas that are not sufficiently reliable",
            "Remediating single points of failure",
            "Enabling data replication, self-healing, and elastic features and services"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa",
            "dr"
          ]
        },
        {
          "id": "improve-cost",
          "title": "Finding cost optimizations",
          "duration": "40 min",
          "summary": "Task 3.5: Identify opportunities for cost optimizations.",
          "objectives": [
            "Analyzing usage reports to identify underutilized and overutilized resources",
            "Using AWS solutions to identify unused resources",
            "Designing billing alarms based on expected usage patterns",
            "Investigating AWS Cost and Usage Reports at a granular level",
            "Using tagging for cost allocation and reporting"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "cost"
          ]
        }
      ],
      "objectives": [
        "Determining the most appropriate logging and monitoring strategy",
        "Evaluating current deployment processes for improvement opportunities",
        "Prioritizing opportunities for automation within a solution stack",
        "Recommending the appropriate AWS solution to enable configuration management automation",
        "Engineering failure scenario activities to support and exercise an understanding of recovery actions",
        "Evaluating a strategy for the secure management of secrets and credentials",
        "Auditing an environment for least privilege access",
        "Reviewing implemented solutions to ensure security at every layer"
      ]
    },
    {
      "id": "migration-modernization",
      "title": "Accelerate Workload Migration and Modernization",
      "shortTitle": "Migration and modernization",
      "accent": "#be123c",
      "domain": "Accelerate Workload Migration and Modernization",
      "weight": "20%",
      "duration": "3.0 hrs",
      "overview": "Content Domain 4 of the SAP-C02 exam guide (20% of scored content). 4 lessons, one per task statement.",
      "takeaways": [
        "Classify workloads (7 Rs) and assess dependencies before choosing a migration tool.",
        "Match the transfer tool to data size, bandwidth and cut-over window; replicate continuously for low downtime.",
        "Several migration services have changed or closed to new customers; verify current availability in AWS docs.",
        "Modernise by decoupling and adopting managed or serverless services where the business case supports it."
      ],
      "lessons": [
        {
          "id": "select-workloads",
          "title": "Selecting workloads to migrate",
          "duration": "40 min",
          "summary": "Task 4.1: Select existing workloads and processes for potential migration.",
          "objectives": [
            "Completing an application migration assessment",
            "Evaluating applications according to the seven common migration strategies (7Rs)",
            "Evaluating total cost of ownership (TCO)"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "mig-guide"
          ]
        },
        {
          "id": "migration-approach",
          "title": "Choosing a migration approach",
          "duration": "50 min",
          "summary": "Task 4.2: Determine the optimal migration approach for existing workloads.",
          "objectives": [
            "Selecting the appropriate database transfer mechanism",
            "Selecting the appropriate application transfer mechanism",
            "Selecting the appropriate data transfer service and migration strategy",
            "Applying the appropriate security methods to migration tools",
            "Selecting the appropriate governance model"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "mig-strategies"
          ]
        },
        {
          "id": "new-architecture",
          "title": "Architecture for migrated workloads",
          "duration": "45 min",
          "summary": "Task 4.3: Determine a new architecture for existing workloads.",
          "objectives": [
            "Selecting the appropriate compute platform",
            "Selecting the appropriate container hosting platform",
            "Selecting the appropriate storage service",
            "Selecting the appropriate database platform"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "mig-guide"
          ]
        },
        {
          "id": "modernization",
          "title": "Modernization opportunities",
          "duration": "45 min",
          "summary": "Task 4.4: Determine opportunities for modernization and enhancements.",
          "objectives": [
            "Identifying opportunities to decouple application components",
            "Identifying opportunities for serverless solutions",
            "Selecting the appropriate service for containers",
            "Identifying opportunities for purpose-built databases",
            "Selecting the appropriate application integration service"
          ],
          "practice": [
            "Whiteboard: redraw an architecture from the Scenarios topic of this lesson from memory, then change one requirement (a tighter RTO, a compliance rule, a cost cap) and note which service choice changes and why.",
            "Sketch the architecture for one scenario from this lesson and name the trade-off you accepted."
          ],
          "sources": [
            "wa"
          ]
        }
      ],
      "objectives": [
        "Completing an application migration assessment",
        "Evaluating applications according to the seven common migration strategies (7Rs)",
        "Evaluating total cost of ownership (TCO)",
        "Selecting the appropriate database transfer mechanism",
        "Selecting the appropriate application transfer mechanism",
        "Selecting the appropriate data transfer service and migration strategy",
        "Applying the appropriate security methods to migration tools",
        "Selecting the appropriate governance model"
      ]
    },
    {
      "id": "review",
      "title": "Final Review",
      "shortTitle": "Review",
      "accent": "#5c6770",
      "domain": "Exam readiness and scenario synthesis",
      "weight": "Capstone",
      "duration": "1.5 hrs",
      "overview": "Tie the four domains together with service-selection tables, trade-off patterns and exam reading strategy, then finish with the practice quiz.",
      "takeaways": [
        "Practise reading the requirement, constraints and optimisation keyword separately.",
        "Eliminate options that violate a hard constraint before comparing the rest.",
        "Review every wrong answer by naming the constraint it breaks."
      ],
      "lessons": [
        {
          "id": "scenario-review",
          "title": "Scenario review",
          "duration": "60 min",
          "summary": "Practice choosing architectures from requirement-driven scenarios that span several domains.",
          "objectives": [
            "Select a multi-account and network design from requirements",
            "Select a DR strategy from RTO and RPO",
            "Select a migration approach and target architecture for a workload",
            "Identify the cost, security and reliability trade-off in an answer option"
          ],
          "practice": [
            "For each scenario in this lesson, write the architecture and the one constraint that decided it before reading the answer."
          ],
          "sources": [
            "wa"
          ]
        }
      ],
      "objectives": [
        "Select a multi-account and network design from requirements",
        "Select a DR strategy from RTO and RPO",
        "Select a migration approach and target architecture for a workload",
        "Identify the cost, security and reliability trade-off in an answer option"
      ]
    }
  ],
  "learnByTopic": {},
  "LABELS": {
    "exam-page": "AWS Certified Solutions Architect - Professional",
    "aws-docs": "AWS documentation home",
    "wa": "AWS Well-Architected Framework",
    "vpc": "What is Amazon VPC?",
    "orgs": "What is AWS Organizations?",
    "control-tower": "What is AWS Control Tower?",
    "dr": "Disaster recovery of workloads on AWS",
    "cost": "What is AWS Cost Management?",
    "mig-guide": "AWS large migrations guide",
    "mig-strategies": "Migration strategies (the 7 Rs)"
  },
  "mindMaps": {
    "org-complexity": {
      "title": "Organizational complexity",
      "body": "Study order for this chapter: network connectivity strategies, security controls, reliable and resilient architectures, multi-account environments, cost optimization and visibility.",
      "branches": [
        "Network connectivity strategies: AWS Global Infrastructure, AWS networking concepts, Hybrid DNS concepts",
        "Security controls: AWS Identity and Access Management (IAM) and AWS IAM Identity Center, Route tables, security groups, and network ACLs, Encryption keys and certificate management",
        "Reliable and resilient architectures: Recovery time objectives (RTOs) and recovery point objectives (RPOs), Disaster recovery strategies, Data backup and restoration",
        "Multi-account environments: AWS Organizations and AWS Control Tower, Multi-account event notifications, AWS resource sharing across environments",
        "Cost optimization and visibility: AWS cost and usage monitoring tools, AWS purchasing options, AWS rightsizing visibility tools"
      ]
    },
    "new-solutions": {
      "title": "New solutions",
      "body": "Study order for this chapter: deployment strategy, business continuity, security controls from requirements, reliability requirements, performance objectives, cost optimization strategy.",
      "branches": [
        "Deployment strategy: Infrastructure as code (IaC), Continuous integration and continuous delivery (CI/CD), Change management processes",
        "Business continuity: AWS Global Infrastructure, AWS networking concepts, RTOs and RPOs",
        "Security controls from requirements: IAM, Route tables, security groups, and network ACLs, Encryption options for data at rest and data in transit",
        "Reliability requirements: AWS Global Infrastructure, AWS storage services and replication strategies (for example Amazon S3, Amazon RDS, Amazon ElastiCache), Multi-AZ and multi-Region architectures",
        "Performance objectives: Performance monitoring technologies, Storage options on AWS, Instance families and use cases",
        "Cost optimization strategy: AWS cost and usage monitoring tools, Pricing models, Storage tiering"
      ]
    },
    "continuous-improvement": {
      "title": "Continuous improvement",
      "body": "Study order for this chapter: operational excellence, improving security, improving performance, improving reliability, finding cost optimizations.",
      "branches": [
        "Operational excellence: Alerting and automatic remediation strategies, Disaster recovery planning, Monitoring and logging solutions",
        "Improving security: Data retention, data sensitivity, and data regulatory requirements, Automated monitoring and remediation strategies, Secrets management",
        "Improving performance: High-performing systems architectures, Global service offerings, Monitoring tool sets and services",
        "Improving reliability: AWS Global Infrastructure, Data replication methods, Scaling methodologies",
        "Finding cost optimizations: Cost-conscious architecture choices, Price model adoptions, Networking and data transfer costs"
      ]
    },
    "migration-modernization": {
      "title": "Migration and modernization",
      "body": "Study order for this chapter: selecting workloads to migrate, choosing a migration approach, architecture for migrated workloads, modernization opportunities.",
      "branches": [
        "Selecting workloads to migrate: Migration assessment and tracking tools, Portfolio assessment, Asset planning",
        "Choosing a migration approach: Data migration options and tools, Application migration tools, AWS networking services and DNS",
        "Architecture for migrated workloads: Compute services, Containers, AWS storage services",
        "Modernization opportunities: Serverless compute offerings, Containers, AWS storage services"
      ]
    }
  }
};
