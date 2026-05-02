# import json
# import boto3
# import uuid
# import traceback
# from datetime import datetime

# dynamodb = boto3.client("dynamodb", region_name="ap-south-2")
# TABLE_NAME = "prepQuestions"

# def response(body, status=200):
#     return {
#         "statusCode": status,
#         "headers": {
#             "Content-Type": "application/json",
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
#         },
#         "body": json.dumps(body)
#     }

# def lambda_handler(event, context):
#     try:
#         # 1. Parse Body
#         body = json.loads(event.get("body", "{}"))
#         print(f"DEBUG: Body received: {body}") # Check CloudWatch logs
        
#         # 2. Force the action
#         # If 'item' is in body, we assume it's a SAVE action.
#         # If 'action' is 'list_content', we list.
#         action = body.get("action", "")
#         item_data = body.get("item")

#         # --- SAVE LOGIC (Triggered if 'item' exists) ---
#         if item_data or action == "put_content_single":
#             qid = item_data.get("id") or str(uuid.uuid4())[:8]
#             date_str = datetime.utcnow().strftime("%Y-%m-%d")
            
#             # Normalize strings for your specific Schema
#             comp = str(item_data.get("company", "GENERAL")).upper()
#             diff = str(item_data.get("difficulty", "MEDIUM")).upper()
#             top  = str(item_data.get("topic", "GENERAL")).upper()
#             role = str(item_data.get("role", "SDE")).upper()
#             gsi_sk = f"DIFF#{diff}#{date_str}"

#             db_item = {
#                 "pk": {"S": f"QUESTION#{qid}"},
#                 "sk": {"S": "METADATA"},
#                 "id": {"S": qid},
#                 "title": {"S": str(item_data.get("title", "No Title"))},
#                 "description": {"S": str(item_data.get("description", ""))},
#                 "company": {"S": str(item_data.get("company", "GENERAL"))},
#                 "difficulty": {"S": diff},
#                 "role": {"S": str(item_data.get("role", "SDE"))},
#                 "topic": {"S": top},
#                 "GSI1PK": {"S": f"COMPANY#{comp}"},
#                 "GSI1SK": {"S": gsi_sk},
#                 "GSI2PK": {"S": f"TOPIC#{top}"},
#                 "GSI2SK": {"S": gsi_sk},
#                 "GSI3PK": {"S": f"ROLE#{role}"},
#                 "GSI3SK": {"S": gsi_sk},
#                 "GSI4PK": {"S": "ALL"},
#                 "GSI4SK": {"S": gsi_sk}
#             }

#             dynamodb.put_item(TableName=TABLE_NAME, Item=db_item)
#             return response({"success": True, "message": "Saved successfully", "id": qid})

#         # --- LIST LOGIC ---
#         elif action == "list_content":
#             res = dynamodb.query(
#                 TableName=TABLE_NAME,
#                 IndexName="GSI4",
#                 KeyConditionExpression="GSI4PK = :pk",
#                 ExpressionAttributeValues={":pk": {"S": "ALL"}}
#             )
#             items = [{k: list(v.values())[0] for k, v in i.items()} for i in res.get("Items", [])]
#             return response({"success": True, "items": items})

#         # --- FALLBACK ERROR ---
#         else:
#             return response({
#                 "success": False, 
#                 "error": "BAD_REQUEST", 
#                 "received_action": action,
#                 "message": "Send 'action': 'put_content_single' and an 'item' object."
#             }, 400)

#     except Exception as e:
#         return response({
#             "success": False, 
#             "error": "CRASH", 
#             "details": str(e),
#             "trace": traceback.format_exc()
#         }, 500)