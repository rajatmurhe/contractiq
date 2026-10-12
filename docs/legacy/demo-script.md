# ContractIQ Demo Script — 5 Minutes

## Audience
Principal engineers, solution architects, and CTOs evaluating ContractIQ.

## Prerequisites
`docker compose up` is running. `make seed` has been executed.

## [0:00] — Stack Overview (30s)
"Welcome to ContractIQ. This is a multi-tenant, agentic contract intelligence platform. It’s built on a modular monolith in .NET 8, with a Python LangGraph agent service, and a React 18 frontend. What you're seeing today is the 'golden path': AI proposes, policies validate, humans approve, and the system executes controlled writes to SAP and Salesforce."

## [0:30] — Upload a Contract (30s)
[Action: Open the Contract Library. Drag and drop the 'High Risk MSA' document.]
"We start by uploading a Master Services Agreement. Behind the scenes, this hits our deterministic ingestion pipeline. It parses the PDF, extracts the section tree, and flags PII. Then, it triggers the LangGraph supervisor, which fans out to our specialist agents."

## [1:00] — Agent Trace Viewer — Live (60s)
[Action: Open the Agent Trace Viewer. Show nodes lighting up as the graph progresses.]
"Here in the Agent Trace Viewer, you can see the LangGraph state machine live. The Extraction, Risk, and Compliance specialists are running in parallel. 
Notice the Critic node. It verifies that every extracted clause actually exists in the source text. If the model hallucinates, the Critic catches it and forces a re-extraction."

## [2:00] — Injection Blocked (30s)
[Action: Switch to the contract with the hidden footnote.]
"Security is paramount. This document has a prompt injection attempt hidden in a footnote. Our safety layer's injection classifier caught it before it ever reached the LLM. You can see the `InjectionDetected` event logged in the immutable audit trail."

## [2:30] — High-Risk Approval (60s)
[Action: Open Approval Inbox. Show SLA countdown and AI recommendation.]
"Because the first contract had an uncapped indemnity clause, the Risk specialist scored it as HIGH risk. This triggers our hard AI Action Boundary. The workflow interrupted itself. The AI *proposed* a change, but it cannot execute it. As a human, I see the AI's recommendation side-by-side with the source text. I'll click 'Approve'."

## [3:30] — Integration Writes (30s)
[Action: Approve the workflow. Trace viewer resumes. Show mock server outputs.]
"Once approved, the LangGraph workflow resumes. It passes the authorized payload to the Integrations service. The integrations service uses an Outbox saga to ensure guaranteed delivery. It just successfully created a Purchase Order in SAP and an Opportunity in Salesforce. If Salesforce had failed, it would have automatically compensated the SAP transaction."

## [4:00] — Audit Chain (45s)
[Action: Show the Audit View with the green verification badge.]
"Every step—the prompts used, the model versions, the tool calls, and the human approval—is recorded in a hash-chained, append-only Audit DB. Right now, the chain verifies as valid."
[Action: Run the tamper script in the terminal.]
"Let's simulate a malicious database admin changing an approval record. If we refresh the Audit View... the badge turns red. The system detected the tamper immediately."

## [4:45] — Summary (15s)
"This is ContractIQ. Multi-tenant, secure by design, agentic but fully deterministic at the boundaries, and ready for the enterprise."
