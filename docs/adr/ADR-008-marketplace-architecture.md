<ADR-008: Marketplace Architecture and Package Signing>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
Enterprise customers require pre-built workflow packages (e.g., NDA Fast-Review, MSA Risk Review, SaaS Renewal Tracker) to accelerate time-to-value. Eventually, third parties may publish packages to this marketplace. These packages contain workflow definitions, prompt templates, playbooks, evaluation datasets, and UI components. Security is paramount: malicious packages must not be able to execute arbitrary code or access unauthorized tenant data.

## Decision
Marketplace packages will be declarative bundles (JSON/YAML) containing no executable code. Package manifests must be cryptographically signed using Ed25519. The installation process will validate the signature against a trusted key registry. At runtime, packages are sandboxed by the LangGraph workflow engine, which only interprets the declarative definitions.

**Package format:**
```
package.json  (manifest: name, version, author, signature)
prompts/      (versioned prompt templates)
playbooks/    (risk assessment rules in DSL)
workflows/    (LangGraph graph definitions in declarative JSON)
evals/        (evaluation datasets for CI validation)
README.md
```

**Installation process:** 
Download → Verify signature → Validate schema → Dry-run on test tenant → Apply to tenant.

## Alternatives Considered
- **Executable packages (e.g., Python scripts or DLLs):** Rejected. Exposes the platform to severe security risks (RCE, data exfiltration) and is very difficult to sandbox safely in a multi-tenant environment.
- **Plugin system with dynamic code loading:** Rejected. Increases the attack surface and complicates dependency management.
- **API-based workflow definition only:** Rejected. Lacks a distribution mechanism for sharing bundled solutions across tenants.

## Consequences
### Positive
- Complete protection against arbitrary code execution from malicious packages.
- Easy to audit and version control declarative definitions.
- Cryptographic verification ensures package integrity and authenticity.

### Negative
- Limits the expressiveness of packages; custom logic requires platform updates rather than package updates.
- Requires building and maintaining a JSON/YAML schema interpreter for LangGraph.

### Neutral
- Forces all third-party developers to adopt our specific declarative formats.

## Failure Modes and Mitigations
1. **Signing key compromise:** An attacker steals the private key and signs malicious packages. *Mitigation:* Store private keys in Azure Key Vault / HSM. Implement key rotation and a revocation list (CRL) checked during installation.
2. **Supply chain attack via dependency:** A package references a compromised external prompt template or playbook. *Mitigation:* All dependencies must be strictly version-pinned and hashed. The installation process verifies all hashes.
3. **Workflow definition bypassing node allow-lists:** A maliciously crafted JSON definition attempts to reference an internal or restricted LangGraph node. *Mitigation:* The schema validator strictly enforces an allow-list of safe, permitted node types. Any unknown node type fails validation.

## Implementation Notes
Implement signature verification during the upload/install HTTP endpoint.

```csharp
public async Task<bool> VerifyPackageSignatureAsync(byte[] packageData, byte[] signature, byte[] publicKey)
{
    // Using NSec.Cryptography for Ed25519
    var algorithm = SignatureAlgorithm.Ed25519;
    var key = PublicKey.Import(algorithm, publicKey, KeyBlobFormat.RawPublicKey);
    return algorithm.Verify(key, packageData, signature);
}
```
</ADR-008: Marketplace Architecture and Package Signing>
