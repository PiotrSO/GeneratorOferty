import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

transcript_path = r'C:\Users\biuro\.gemini\antigravity-ide\brain\a69f34b6-d28f-4ce4-bafc-3908ab54e1ff\.system_generated\logs\transcript.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        # Search for subagent run around index 180 to 195
        if 180 <= i <= 200:
            print(f"=== Line {i} ({data.get('type')}) ===")
            content = data.get('content', '')
            if content:
                print(content[:1000])
            if 'tool_calls' in data:
                print("Tool calls:", data['tool_calls'])
            print("="*80)
