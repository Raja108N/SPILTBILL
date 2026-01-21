import urllib.request
import json
import traceback

def log(msg):
    with open('api_test_result.txt', 'a') as f:
        f.write(str(msg) + '\n')

url = 'http://87.106.96.173/api/groups/'
data = json.dumps({'name': 'TestGroup', 'pin': '1234'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    log("Testing Group Creation...")
    with urllib.request.urlopen(req) as response:
        log(f"Status: {response.status}")
        log(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    log(f"Error: {e.code}")
    log(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    log(f"Error: {e}")
    log(traceback.format_exc())
