#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== ContractIQ E2E Demo ===${NC}"


echo -e "\n${YELLOW}[1/6] Authenticating as bank-tenant Admin...${NC}"
# Mock obtaining a token (in reality, query Keycloak)
TOKEN="mock-jwt-token-bank-tenant-admin"
echo -e "${GREEN}✅ Token acquired.${NC}"

echo -e "\n${YELLOW}[2/6] Triggering workflow for Injection Footnote Contract...${NC}"
# Mock starting workflow
RUN_ID="demo-run-$(date +%s)"
echo -e "Started Workflow Run ID: ${RUN_ID}"

echo -e "\n${YELLOW}[3/6] Polling Workflow Status...${NC}"
# Mock polling
echo " -> IngestionPipeline: Started"
sleep 1
echo " -> IngestionPipeline: Completed"
echo " -> LangGraph Supervisor: Started"
sleep 1
echo " -> Node: extraction_node (Running...)"
sleep 2
echo " -> Node: risk_node (Running...)"
sleep 1
echo " -> Node: compliance_node (Running...)"
sleep 1
echo " -> Node: critic_node (Running...)"
sleep 1
echo " -> Node: approval_gate_node (Interrupt: Risk is HIGH)"
echo -e "${GREEN}✅ Workflow paused awaiting approval.${NC}"

echo -e "\n${YELLOW}[4/6] Approving the Workflow...${NC}"
# Mock approval
echo "Submitting approval..."
sleep 1
echo " -> Node: integration_node (Running...)"
sleep 2
echo " -> Node: audit_node (Running...)"
sleep 1
echo -e "${GREEN}✅ Workflow Completed.${NC}"

echo -e "\n${YELLOW}[5/6] Verifying Integration & Audit Chain...${NC}"
# Mock verification
echo "SAP System: Purchase Order Created (ID: PO-99812)"
echo "Salesforce: Opportunity Created (ID: 006Dn00000XXXXX)"
echo "Audit Chain: Verification returned { valid: true }"

echo -e "\n${YELLOW}[6/6] Tamper Test...${NC}"
echo "Tampering with Audit DB Record directly..."
# Mock tampering
sleep 1
echo "Audit Chain: Verification returned ${RED}{ valid: false, brokenAt: 'event-001' }${NC}"
echo -e "${GREEN}✅ Tamper detected successfully.${NC}"

echo -e "\n${CYAN}=== Demo Completed in 12s ===${NC}"
