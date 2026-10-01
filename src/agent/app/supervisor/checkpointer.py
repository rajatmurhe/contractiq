from typing import Any, Dict, List
import json

class SqlServerCheckpointer:
    """Mock implementation of SQL Server checkpointer"""
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.store: Dict[str, List[Dict[str, Any]]] = {}

    def save_checkpoint(self, run_id: str, step_id: int, state: dict[str, Any], tenant_id: str) -> None:
        if run_id not in self.store:
            self.store[run_id] = []
        
        record = {
            "RunId": run_id,
            "StepId": step_id,
            "StateJson": json.dumps(state),
            "TenantId": tenant_id
        }
        self.store[run_id].append(record)

    def load_checkpoint(self, run_id: str) -> dict[str, Any] | None:
        if run_id not in self.store or not self.store[run_id]:
            return None
            
        latest = sorted(self.store[run_id], key=lambda x: x["StepId"])[-1]
        return json.loads(latest["StateJson"])

    def list_checkpoints(self, run_id: str) -> List[Dict[str, Any]]:
        if run_id not in self.store:
            return []
        return sorted(self.store[run_id], key=lambda x: x["StepId"])
