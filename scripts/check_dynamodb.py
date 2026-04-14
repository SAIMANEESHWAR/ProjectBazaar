import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
table = dynamodb.Table('PrepJobPortals')

response = table.scan()
items = response.get('Items', [])
print(f"Total items: {len(items)}")
if items:
    print("Sample item:", json.dumps(items[0], indent=2))
else:
    print("No items found.")
