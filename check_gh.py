import urllib.request, json
url = 'https://api.github.com/repos/Sammalik8884/mytecherp-cloud/actions/runs'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read())
        for run in data.get('workflow_runs', [])[:5]:
            msg = run.get('head_commit', {}).get('message', '').split('\n')[0]
            print(f"[{run.get('status')}] {run.get('conclusion')} - {msg} (Updated: {run.get('updated_at')})")
except Exception as e:
    print('Error:', e)
