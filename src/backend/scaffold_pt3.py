import os
import subprocess

base_dir = "/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/backend"
os.chdir(base_dir)

files = {
    "ContractIQ.sln": """
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.SharedKernel", "SharedKernel/ContractIQ.SharedKernel/ContractIQ.SharedKernel.csproj", "{00000000-0000-0000-0000-000000000001}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.SharedKernel.Infrastructure", "SharedKernel/ContractIQ.SharedKernel.Infrastructure/ContractIQ.SharedKernel.Infrastructure.csproj", "{00000000-0000-0000-0000-000000000002}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.Contracts.Domain", "Contracts/ContractIQ.Contracts.Domain/ContractIQ.Contracts.Domain.csproj", "{00000000-0000-0000-0000-000000000003}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.Contracts.Application", "Contracts/ContractIQ.Contracts.Application/ContractIQ.Contracts.Application.csproj", "{00000000-0000-0000-0000-000000000004}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.Contracts.Infrastructure", "Contracts/ContractIQ.Contracts.Infrastructure/ContractIQ.Contracts.Infrastructure.csproj", "{00000000-0000-0000-0000-000000000005}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.Contracts.Api", "Contracts/ContractIQ.Contracts.Api/ContractIQ.Contracts.Api.csproj", "{00000000-0000-0000-0000-000000000006}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ContractIQ.Gateway", "Gateway/ContractIQ.Gateway.csproj", "{00000000-0000-0000-0000-000000000007}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{00000000-0000-0000-0000-000000000001}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000001}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000001}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000001}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000002}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000002}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000002}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000002}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000003}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000003}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000003}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000003}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000004}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000004}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000004}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000004}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000005}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000005}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000005}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000005}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000006}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000006}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000006}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000006}.Release|Any CPU.Build.0 = Release|Any CPU
		{00000000-0000-0000-0000-000000000007}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{00000000-0000-0000-0000-000000000007}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{00000000-0000-0000-0000-000000000007}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{00000000-0000-0000-0000-000000000007}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
EndGlobal
"""
}

for path, content in files.items():
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\\n")
