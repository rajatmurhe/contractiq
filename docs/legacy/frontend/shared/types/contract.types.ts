export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ContractStatus = 'Draft' | 'Processing' | 'IngestionCompleted' | 'AwaitingApproval' | 'Approved' | 'Rejected' | 'Failed';
export type ClauseType = 'Indemnification' | 'Liability' | 'Termination' | 'RenewalAutoRenewal' | 'PaymentTerms' | 'Confidentiality' | 'DataProtection' | 'IntellectualProperty' | 'GoverningLaw' | 'DisputeResolution' | 'ForceMajeure' | 'ChangeOfControl' | 'Assignment' | 'Warranty' | 'Representation' | 'SLA' | 'Penalty' | 'Other';

export interface SourceSpan { page: number; startChar: number; endChar: number; sectionId?: string; }
export interface Clause { id: string; contractId: string; type: ClauseType; text: string; sourceSpan: SourceSpan; confidence: number; criticVerified: boolean; }
export interface RiskFinding { description: string; severity: RiskLevel; citation: SourceSpan; chunkId: string; relatedClauseType: ClauseType; }
export interface RiskReport { contractId: string; overallRisk: RiskLevel; findings: RiskFinding[]; agentVersion: string; modelId: string; promptVersion: string; }
export interface ContractSummary { id: string; title: string; status: ContractStatus; overallRisk?: RiskLevel; counterpartyName?: string; expiryDate?: string; createdAt: string; }
export interface ContractMetadata { contractType?: string; counterpartyName?: string; effectiveDate?: string; expiryDate?: string; jurisdiction?: string; currency?: string; totalValue?: number; }
export interface ContractDetail extends ContractSummary { originalFileName: string; contentType: string; fileSizeBytes: number; storagePath: string; clauses: Clause[]; riskReport?: RiskReport; metadata: ContractMetadata; }
