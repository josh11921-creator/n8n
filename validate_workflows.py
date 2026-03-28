#!/usr/bin/env python3
"""Validate n8n workflow JSON files for import readiness."""

import json
import os
import sys

UPLOAD_DIR = "/home/ubuntu/.cursor/projects/workspace/uploads"

FILES = [
    "00_master_scheduler_dispatcher_v23_patched.json",
    "01_local_stack_ai_wrapper_v24_maxed.json",
    "02_lead_systems_wrapper_v24_maxed.json",
    "03_shared_engine_content_publish_v24_maxed.json",
    "04_shared_engine_analytics_v23_patched.json",
    "05_shared_engine_strategy_milestones_v23_patched.json",
    "06_setup_audit_console_v23_patched.json",
    "07_central_config_registry_v23_patched.json",
    "08_external_services_readiness_console_v23_patched.json",
    "09_health_dashboard_console_v23_patched.json",
]

REQUIRED_TOP_LEVEL = ["name", "nodes", "connections"]
REQUIRED_NODE_FIELDS = ["id", "name", "type", "position"]

SINGLE_OUTPUT_NODE_TYPES = {
    "n8n-nodes-base.code",
    "n8n-nodes-base.httpRequest",
    "n8n-nodes-base.googleSheets",
    "n8n-nodes-base.executeWorkflow",
    "n8n-nodes-base.executeWorkflowTrigger",
    "n8n-nodes-base.manualTrigger",
    "n8n-nodes-base.scheduleTrigger",
}

MULTI_OUTPUT_NODE_TYPES = {
    "n8n-nodes-base.if": 2,
    "n8n-nodes-base.switch": None,  # dynamic based on rules
}


def validate_workflow(filepath):
    issues = []
    warnings = []
    filename = os.path.basename(filepath)

    # 1. Valid JSON
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        issues.append(f"CRITICAL: Invalid JSON - {e}")
        return issues, warnings, None

    # 2. Required top-level fields
    for field in REQUIRED_TOP_LEVEL:
        if field not in data:
            issues.append(f"CRITICAL: Missing required top-level field '{field}'")

    if "nodes" not in data or "connections" not in data:
        return issues, warnings, data

    nodes = data.get("nodes", [])
    connections = data.get("connections", {})

    # 3. Check for settings and active fields
    if "settings" not in data:
        warnings.append("Missing 'settings' field (will use defaults on import)")
    elif isinstance(data.get("settings"), dict) and "executionOrder" not in data["settings"]:
        warnings.append("Missing 'settings.executionOrder' (will default to 'v1' on import)")

    if "active" not in data:
        warnings.append("Missing 'active' field (will default to false on import)")

    # 4. Validate each node
    node_names = set()
    node_types = {}
    node_ids = set()
    for i, node in enumerate(nodes):
        for field in REQUIRED_NODE_FIELDS:
            if field not in node:
                issues.append(f"Node index {i}: Missing required field '{field}'")
        
        name = node.get("name", f"<unnamed-{i}>")
        
        if "typeVersion" not in node:
            warnings.append(f"Node '{name}': Missing 'typeVersion' (will use default)")
        
        if "parameters" not in node:
            warnings.append(f"Node '{name}': Missing 'parameters' field")

        if name in node_names:
            issues.append(f"CRITICAL: Duplicate node name '{name}'")
        node_names.add(name)
        
        node_id = node.get("id", "")
        if node_id in node_ids:
            issues.append(f"CRITICAL: Duplicate node ID '{node_id}' in node '{name}'")
        node_ids.add(node_id)
        
        node_types[name] = node.get("type", "")

    # 5. Validate connections reference existing nodes
    for source_name, conn_data in connections.items():
        if source_name not in node_names:
            issues.append(f"CRITICAL: Connection from non-existent node '{source_name}'")
        
        if "main" not in conn_data:
            issues.append(f"Connection for '{source_name}': Missing 'main' key")
            continue
        
        main_outputs = conn_data["main"]
        
        # Check if node type supports the number of outputs
        source_type = node_types.get(source_name, "")
        if source_type in SINGLE_OUTPUT_NODE_TYPES and len(main_outputs) > 1:
            non_empty_outputs = [i for i, o in enumerate(main_outputs) if o]
            if len(non_empty_outputs) > 1:
                issues.append(
                    f"CRITICAL: Node '{source_name}' (type: {source_type}) has "
                    f"{len(main_outputs)} outputs but this node type only supports 1 output. "
                    f"Output indices {non_empty_outputs[1:]} will never fire."
                )
        
        for output_idx, targets in enumerate(main_outputs):
            for target in targets:
                target_node = target.get("node", "")
                if target_node not in node_names:
                    issues.append(
                        f"CRITICAL: Connection from '{source_name}' output {output_idx} "
                        f"targets non-existent node '{target_node}'"
                    )

    # 6. Check for orphaned nodes (no incoming or outgoing connections)
    connected_sources = set(connections.keys())
    connected_targets = set()
    for conn_data in connections.values():
        for outputs in conn_data.get("main", []):
            for target in outputs:
                connected_targets.add(target.get("node", ""))

    trigger_types = {
        "n8n-nodes-base.manualTrigger",
        "n8n-nodes-base.scheduleTrigger",
        "n8n-nodes-base.executeWorkflowTrigger",
        "n8n-nodes-base.webhookTrigger",
    }

    for name in node_names:
        is_trigger = node_types.get(name, "") in trigger_types
        has_outgoing = name in connected_sources
        has_incoming = name in connected_targets
        
        if not has_outgoing and not has_incoming and not is_trigger:
            warnings.append(f"Node '{name}' is completely disconnected (no connections in or out)")
        elif not has_incoming and not is_trigger:
            warnings.append(f"Node '{name}' has no incoming connections and is not a trigger")

    # 7. Check switch node output count vs rules
    for node in nodes:
        if node.get("type") == "n8n-nodes-base.switch":
            name = node.get("name", "")
            params = node.get("parameters", {})
            rules = params.get("rules", {}).get("rules", [])
            has_fallback = params.get("fallbackOutput") == "extra"
            expected_outputs = len(rules) + (1 if has_fallback else 0)
            
            conn = connections.get(name, {}).get("main", [])
            actual_outputs = len(conn)
            
            if actual_outputs != expected_outputs:
                warnings.append(
                    f"Switch node '{name}': Has {len(rules)} rules + "
                    f"{'fallback' if has_fallback else 'no fallback'} = "
                    f"{expected_outputs} expected outputs, but connections define "
                    f"{actual_outputs} outputs"
                )

    # 8. Check if node has typeVersion field
    for node in nodes:
        if "typeVersion" not in node:
            name = node.get("name", "")
            issues.append(f"Node '{name}': Missing 'typeVersion' - may fail import on some n8n versions")

    return issues, warnings, data


def main():
    all_issues = {}
    total_critical = 0
    total_warnings = 0

    for filename in FILES:
        filepath = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(filepath):
            print(f"\n{'='*60}")
            print(f"FILE: {filename}")
            print(f"  ERROR: File not found!")
            continue

        issues, warnings, data = validate_workflow(filepath)
        all_issues[filename] = {"issues": issues, "warnings": warnings}
        total_critical += len(issues)
        total_warnings += len(warnings)

        print(f"\n{'='*60}")
        print(f"FILE: {filename}")
        if data:
            print(f"  Workflow: {data.get('name', 'unnamed')}")
            print(f"  Nodes: {len(data.get('nodes', []))}")
            print(f"  Connections: {len(data.get('connections', {}))}")

        if not issues and not warnings:
            print(f"  STATUS: PASS - No issues found")
        else:
            if issues:
                print(f"  ISSUES ({len(issues)}):")
                for issue in issues:
                    print(f"    - {issue}")
            if warnings:
                print(f"  WARNINGS ({len(warnings)}):")
                for warning in warnings:
                    print(f"    - {warning}")

    print(f"\n{'='*60}")
    print(f"SUMMARY: {total_critical} critical issues, {total_warnings} warnings across {len(FILES)} files")


if __name__ == "__main__":
    main()
